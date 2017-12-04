'use strict';

const Q = require('q');

const Intents     = require('../intents');
const HubState    = require('../hub_state');

const HandlerName = 'tv_control';

Intents.INTENT_TV_CONTROL_POWER    = "action.devices.commands.OnOff";

Intents.INTENT_GROUP_TV_CONTROL = [
  Intents.INTENT_TV_CONTROL_POWER
];

const handleOnOff = (commands, execution) => {
  console.log('handleOnOff', commands, execution);
  let { params } = execution;
  if(params.on) { return commands.POWER_ON } else { return commands.POWER_OFF };
}

const handleTvControl = (context, request, reply) => {
  let {hub, intent, user, device, execution} = context;
  let deviceConfiguration = user.deviceByHandler(HandlerName);
  let commands = deviceConfiguration.commands;
  console.log("commands", commands);

  let intentMap = {};
  intentMap[Intents.INTENT_TV_CONTROL_POWER] = { handler: handleOnOff };

  let command = intentMap[intent].handler(commands, execution);
  return hub.executeCommand(true, device.label, command);
};

module.exports = handleTvControl;
