'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');

const HomeAutomation = {}

HomeAutomation.register = (server) => {
  server.route({
    method: 'POST',
    path: '/ha',
    handler: (request, reply) => {
      for(let i = 0; i < request.body.inputs.length; i++){
        let input = request.body.inputs[i];
        let intent = input.intent;
        switch(intent){
          case "actions.devices.SYNC":
            return HomeAutomation.sync({
              requestId: request.body.requestId
            }, reply);
          case "actions.devices.QUERY":
            return HomeAutomation.query({
              requestId: request.body.requestId,
              devices: input.payload.devices
            }, reply);
          case "actions.devices.EXEC":
            return HomeAutomation.exec({
              requestId: request.body.requestId,
              commands: input.payload.commands
            }, reply);
        }
      }
    }
  });
}

HomeAutomation.sync = ()=> {
}
HomeAutomation.query = ()=> {
}
HomeAutomation.exec = ()=> {
}

module.exports = HomeAutomation;
