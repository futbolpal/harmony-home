'use strict';

const Q = require('q');

const Intents     = require('../intents');
const HubState    = require('../hub_state');
const HomeActions = require('../home_actions_helper');

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

const handleTvControl = (hubState, conversationToken, intent, request, reply) => {
  let intentName = intent.intent;
  let device = hubState.deviceByName("TV");
  let intentMap = {};
  intentMap[Intents.INTENT_TV_CONTROL_POWER_OFF] = { command : "PowerOff", response: "TV is now off" };
  intentMap[Intents.INTENT_TV_CONTROL_POWER_ON] = { command : "PowerOn", response: "TV is now on" };
  intentMap[Intents.INTENT_TV_CONTROL_VOLUME_UP] =  { command : "VolumeUp", response: "Ok" };
  intentMap[Intents.INTENT_TV_CONTROL_VOLUME_DOWN] = { command : "VolumeDown", response: "Ok" };
  intentMap[Intents.INTENT_TV_CONTROL_MUTE] = { command : "Mute", response: "Ok" };

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  return hubState.executeCommand(true, device.label, command).then((response) => {
    return reply.json(HomeActions.createSimpleReply(conversationToken, intentResponse));
  });
};

module.exports = handleTvControl;
