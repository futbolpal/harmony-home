'use strict';

const Intents     = require('../intents');
const HomeActions = require('../home_actions_helper');

const HandlerName = 'win_control';

Intents.INTENT_GROUP_WIN_CONTROL = [
];

const handleWinControl = (context, request, reply) => {
  let {hubState, intent, user, conversationToken} = context;
  let intentName = intent.intent;
  
  let deviceConfiguration = user.deviceByHandler(HandlerName);
  let device = hubState.deviceByName(deviceConfiguration.name);
  let commands = deviceConfiguration.commands;

  let intentMap = {};

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  command(device);
  return reply.json(HomeActions.createSimpleReply(conversationToken, intentResponse));
};

module.exports = handleWinControl;
