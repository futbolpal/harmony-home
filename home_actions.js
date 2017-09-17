'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');

const Intents = require('./intents');
const ClimateControl = require('./handlers/climate_control');
const TvControl = require('./handlers/tv_control');

const HomeActions = {}

HomeActions.register = (server) => {
  server.route({
    method: 'POST',
    path:'/gh',
    handler : (request, reply) => {
      for(let i = 0; i < request.payload.inputs.length; i++){
        let intent = request.payload.inputs[0];
        if(Intents.INTENT_GROUP_CLIMATE_CONTROL.includes(intent.intent)){
          return ClimateControl(HubState, intent, request, reply);
        } else if(Intents.INTENT_GROUP_TV_CONTROL.includes(intent.intent)){
          return TvControl(HubState, intent, request, reply);
        }
      }
    }
  });
}
module.exports = HomeActions;
