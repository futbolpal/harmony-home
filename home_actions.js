'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');

const Intents = require('./intents');
const ClimateControl = require('./handlers/climate_control');

const HomeActions = {}

HomeActions.register = (server) => {
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
}

module.exports = HomeActions;
