'use strict';

const Q = require('q');

const Intents   = require('../intents');
const HubState  = require('../hub_state');

Intents.INTENT_CLIMATE_CONTROL_STATUS       = "Climate Control Status";
Intents.INTENT_CLIMATE_CONTROL_UP           = "Climate Control +";
Intents.INTENT_CLIMATE_CONTROL_DOWN         = "Climate Control -";
Intents.INTENT_CLIMATE_CONTROL_RESET        = "Climate Control Reset";
Intents.INTENT_CLIMATE_CONTROL_SET          = "Climate Control Set";
Intents.INTENT_CLIMATE_CONTROL_DOWN_REPEAT  = "Climate Control - - no";
Intents.INTENT_CLIMATE_CONTROL_UP_REPEAT    = "Climate Control + - no";
Intents.INTENT_CLIMATE_CONTROL_POWER_OFF    = "Climate Control Power Off";
Intents.INTENT_CLIMATE_CONTROL_POWER_ON     = "Climate Control Power On";

Intents.INTENT_GROUP_CLIMATE_CONTROL = [
  Intents.INTENT_CLIMATE_CONTROL_STATUS       ,
  Intents.INTENT_CLIMATE_CONTROL_UP           ,
  Intents.INTENT_CLIMATE_CONTROL_DOWN         ,
  Intents.INTENT_CLIMATE_CONTROL_RESET        ,
  Intents.INTENT_CLIMATE_CONTROL_SET          ,
  Intents.INTENT_CLIMATE_CONTROL_DOWN_REPEAT  ,
  Intents.INTENT_CLIMATE_CONTROL_UP_REPEAT    ,
  Intents.INTENT_CLIMATE_CONTROL_POWER_OFF    ,
  Intents.INTENT_CLIMATE_CONTROL_POWER_ON     ,
];

const handleClimateControl = (hubState, intentName, request, reply) => {
  let device = hubState.deviceByName("Friedrich Climate Control");
  
  switch(intentName){
    case Intents.INTENT_CLIMATE_CONTROL_POWER_OFF:
    case Intents.INTENT_CLIMATE_CONTROL_POWER_ON:
      hubState.state.climate_control.online = !hubState.state.climate_control.online;
      return hubState.executeCommand(true, device.label, "PowerToggle").then((response) => {
        return reply({ "speech" : "AC is now " + (hubState.state.climate_control.online ? "on" : "off")});
      });
    case Intents.INTENT_CLIMATE_CONTROL_STATUS:
      return reply({"speech" : "The current temperature is " + hubState.state.climate_control.temp + " degrees" });
    case Intents.INTENT_CLIMATE_CONTROL_UP:
    case Intents.INTENT_CLIMATE_CONTROL_UP_REPEAT:
      hubState.state.climate_control.temp++;
      return hubState.executeCommand(true, device.label, "Temp+").then((response) => {
        return reply({ "speech" : "Temp is " + hubState.state.climate_control.temp + " degrees, is that better"});
      });
    case Intents.INTENT_CLIMATE_CONTROL_DOWN:
    case Intents.INTENT_CLIMATE_CONTROL_DOWN_REPEAT:
      hubState.state.climate_control.temp--;
      return hubState.executeCommand(true, device.label, "Temp-").then((response) => {
        return reply({ "speech" : "Temp is " + hubState.state.climate_control.temp + " degrees, is that better"});
      });
    case Intents.INTENT_CLIMATE_CONTROL_RESET:
      hubState.state.climate_control.temp = request.payload.result.parameters.temperature.amount;
      return reply({ "speech" : "Thanks, it helps that I know the AC is set to " + hubState.state.climate_control.temp + " degrees"});
    case Intents.INTENT_CLIMATE_CONTROL_SET:
      let diff = hubState.state.climate_control.temp - request.payload.result.parameters.temperature.amount;
      let command = diff < 0 ? "Temp+" : "Temp-";
      let commands = new Array(Math.abs(diff)).fill(() => { 
        return Q.delay(750).then(() => { 
          return hubState.executeCommand(true, device.label, command) 
        });
      });
      reply();
      return commands.reduce(Q.when, Q([])).then(() => {
        hubState.state.climate_control.temp = request.payload.result.parameters.temperature.amount
      });
  }
  return reply();
};

module.exports = handleClimateControl;
