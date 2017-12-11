'use strict';

const Intents     = require('../intents');
const { createSimpleReply } = require('../home_actions_helper');

const HandlerName = 'win_control';

Intents.INTENT_GROUP_WIN_CONTROL = [
];

const intentMap = {};

const handleWinControl = (context, request, reply) => {
  let {hubState, intent, user, conversationToken} = context;
  let intentName = intent.intent;
  
  let deviceConfiguration = user.deviceByHandler(HandlerName);
  let device = hubState.deviceByName(deviceConfiguration.name);
  let commands = deviceConfiguration.commands;

  if(!intentMap[intentName]) { 
    return reply.json(createSimpleReply(
          conversationToken, 
          'Intent could not be handled'
          ));
  }

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  command(device);
  return reply.json(createSimpleReply(conversationToken, intentResponse));
};

module.exports = handleWinControl;
