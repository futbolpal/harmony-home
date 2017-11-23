'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');

const Intents = require('./intents');
const ClimateControl = require('./handlers/climate_control');
const TvControl = require('./handlers/tv_control');

const HomeActions = {}

const processCapture = (request, reply) => {
  let intent = request.body.inputs[0];
  console.log('request.body', request.body);
  const fs = require('fs');
  const md5 = require('md5');
  const path = intent.intent.replace(/\./g, '/');
  const contents = JSON.stringify(request.body, null, ' ');
  const hash = md5(intent.raw_inputs[0].query);
  fs.writeFile(`mocks/${path}/sample-${hash}.json`, contents, function(err) {
    return reply.json("OK");
  });
}

const processGh = (request, reply) => {
  console.log('POST /gh');
  let conversationToken = request.body.conversation.conversationToken;
  if(process.env.CAPTURE) { return processCapture(request, reply) }
  for(let i = 0; i < request.body.inputs.length; i++){
    let intent = request.body.inputs[0];
    if(Intents.INTENT_GROUP_CLIMATE_CONTROL.includes(intent.intent)){
      return ClimateControl(HubState, conversationToken, intent, request, reply);
    } else if(Intents.INTENT_GROUP_TV_CONTROL.includes(intent.intent)){
      return TvControl(HubState, conversationToken, intent, request, reply);
    }
  }
};

HomeActions.register = (server) => {
  server.post('/gh', processGh);
}
module.exports = HomeActions;
