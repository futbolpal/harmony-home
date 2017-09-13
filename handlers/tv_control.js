'use strict';

const Q = require('q');

const Intents   = require('../intents');
const HubState  = require('../hub_state');

Intents.INTENT_TV_CONTROL_POWER_OFF    = "TV Control Power Off";
Intents.INTENT_TV_CONTROL_POWER_ON     = "TV Control Power On";
Intents.INTENT_TV_CONTROL_VOLUME_UP    = "TV Control Volume Up";
Intents.INTENT_TV_CONTROL_VOLUME_DOWN  = "TV Control Volume Down";
Intents.INTENT_TV_CONTROL_MUTE         = "TV Control Mute";

Intents.INTENT_GROUP_TV_CONTROL = [
  Intents.INTENT_TV_CONTROL_POWER_OFF    ,
  Intents.INTENT_TV_CONTROL_POWER_ON     ,
  Intents.INTENT_TV_CONTROL_VOLUME_UP    ,
  Intents.INTENT_TV_CONTROL_VOLUME_DOWN  ,
  Intents.INTENT_TV_CONTROL_MUTE         ,
];

const handleTvControl = (hubState, intentName, request, reply) => {
  let device = hubState.deviceByName("TV");
  let intentMap = {};
  intentMap[Intents.INTENT_TV_CONTROL_POWER_OFF] = { command : "PowerOff", response: { "speech" : "TV is now off"} };
  intentMap[Intents.INTENT_TV_CONTROL_POWER_ON] = { command : "PowerOn", response: { "speech" : "TV is now on"} };
  intentMap[Intents.INTENT_TV_CONTROL_VOLUME_UP] =  { command : "VolumeUp" };
  intentMap[Intents.INTENT_TV_CONTROL_VOLUME_DOWN] = { command : "VolumeDown" };
  intentMap[Intents.INTENT_TV_CONTROL_MUTE] = { command : "Mute" };

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  return hubState.executeCommand(true, device.label, command).then((response) => {
    return reply(intentResponse);
  });
};

module.exports = handleTvControl;
