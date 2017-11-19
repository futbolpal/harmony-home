'use strict';

const Q = require('q');

const Intents     = require('../intents');
const HubState    = require('../hub_state');
const HomeActions = require('../home_actions_helper');
const Users       = require('../models/user');

const HandlerName = 'tv_control';

Intents.INTENT_TV_CONTROL_POWER_OFF    = "com.harmony-home.intent.tv.off";
Intents.INTENT_TV_CONTROL_POWER_ON     = "com.harmony-home.intent.tv.on";
Intents.INTENT_TV_CONTROL_VOLUME_UP    = "com.harmony-home.intent.tv.volume.up";
Intents.INTENT_TV_CONTROL_VOLUME_DOWN  = "com.harmony-home.intent.tv.volume.down";
Intents.INTENT_TV_CONTROL_MUTE         = "com.harmony-home.intent.tv.volume.mute";

Intents.INTENT_GROUP_TV_CONTROL = [
  Intents.INTENT_TV_CONTROL_POWER_OFF    ,
  Intents.INTENT_TV_CONTROL_POWER_ON     ,
  Intents.INTENT_TV_CONTROL_VOLUME_UP    ,
  Intents.INTENT_TV_CONTROL_VOLUME_DOWN  ,
  Intents.INTENT_TV_CONTROL_MUTE         ,
];

const handleTvControl = (hubState, context, request, reply) => {
  let {intent, userId, conversationToken} = context;
  let intentName = intent.intent;

  let user = Users.findBy(userId);
  let deviceConfiguration = user.deviceByHandler(HandlerName);
  let device = hubState.deviceByName(deviceConfiguration.name);
  let commands = deviceConfiguration.commands;

  let intentMap = {};
  intentMap[Intents.INTENT_TV_CONTROL_POWER_OFF] = { command : commands.POWER_OFF, response: "Ok" };
  intentMap[Intents.INTENT_TV_CONTROL_POWER_ON] = { command : commands.POWER_ON, response: "Ok" };
  intentMap[Intents.INTENT_TV_CONTROL_VOLUME_UP] =  { command : commands.VOLUME_UP, response: "Ok" };
  intentMap[Intents.INTENT_TV_CONTROL_VOLUME_DOWN] = { command : commands.VOLUME_DOWN, response: "Ok" };
  intentMap[Intents.INTENT_TV_CONTROL_MUTE] = { command : commands.MUTE, response: "Ok" };

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  return hubState.executeCommand(true, device.label, command).then((response) => {
    return reply.json(HomeActions.createSimpleReply(conversationToken, intentResponse));
  });
};

module.exports = handleTvControl;
