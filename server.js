'use strict';

const NewRelic = require('newrelic');

const _ = require('underscore');
const s = require("underscore.string");
const Hapi = require('hapi');

const HarmonyUtils = require('harmony-hub-util');
const HubState = require('./hub_state');
const Intents = require('./intents');
const ClimateControl = require('./handlers/climate_control');
const RedisClient = require('./redis_client');

// Create a server with a host and port
const server = new Hapi.Server();

server.connection({ 
  host: '0.0.0.0', 
  port: +process.env.PORT || 3000
});

server.route({
  method: 'GET',
  path: '/health',
  handler: (request, reply) => {
    return reply({
      app: "OK",
      hub: HubState.hub != null ? "OK" : "FAIL",
      newrelic: NewRelic.agent._state != 'errored' ? "OK" : "FAIL",
      redis: RedisClient.connected ? "OK" : "FAIL"
    })
  }
});

server.route({
  method: 'POST',
  path:'/gh',
  handler : (request, reply) => {
    let intentName = request.payload.result.metadata.intentName;
    console.log(intentName);
    console.log(request.payload);
    if(Intents.INTENT_GROUP_CLIMATE_CONTROL.includes(intentName)){
        return ClimateControl(HubState, intentName, request, reply);
    }
  }
});

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});

// Connect to harmony
new HarmonyUtils(process.env.IP || '192.168.0.23').then((hutils) => {
  console.log("Connected to harmony hub");
  HubState.hub = hutils

  // Update commands
  setInterval(HubState.refresh, 60000); 
  setInterval(() => {
    HubState.hub.readCurrentActivity().then((response) => { 
      if(response == 'PowerOff'){
        console.log("Activity was " + response) 
        HubState.hub.executeActivity('Default').then((response) => { console.log(response) });;
      }
    });
  }, 5000);

});

RedisClient.on("ready", () => { HubState.load() });
