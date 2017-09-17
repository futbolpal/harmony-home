'use strict';

const Q = require('q');

const Intents   = require('../intents');
const HubState  = require('../hub_state');

Intents.INTENT_CLIMATE_CONTROL_STATUS       = "com.harmony-home.intent.climate-control.temperature.status";
Intents.INTENT_CLIMATE_CONTROL_UP           = "com.harmony-home.intent.climate-control.temperature.up";
Intents.INTENT_CLIMATE_CONTROL_DOWN         = "com.harmony-home.intent.climate-control.temperature.down";
Intents.INTENT_CLIMATE_CONTROL_RESET        = "com.harmony-home.intent.climate-control.temperature.reset";
Intents.INTENT_CLIMATE_CONTROL_SET          = "com.harmony-home.intent.climate-control.temperature.set";
Intents.INTENT_CLIMATE_CONTROL_POWER_OFF    = "com.harmony-home.intent.climate-control.on";
Intents.INTENT_CLIMATE_CONTROL_POWER_ON     = "com.harmony-home.intent.climate-control.off";

Intents.INTENT_GROUP_CLIMATE_CONTROL = [
  Intents.INTENT_CLIMATE_CONTROL_STATUS       ,
  Intents.INTENT_CLIMATE_CONTROL_UP           ,
  Intents.INTENT_CLIMATE_CONTROL_DOWN         ,
  Intents.INTENT_CLIMATE_CONTROL_RESET        ,
  Intents.INTENT_CLIMATE_CONTROL_SET          ,
  Intents.INTENT_CLIMATE_CONTROL_POWER_OFF    ,
  Intents.INTENT_CLIMATE_CONTROL_POWER_ON     
];

const handleClimateControl = (hubState, conversationToken, intent, request, reply) => {
  let device = hubState.deviceByName("Friedrich Climate Control");
  let intentName = intent.intent;
  
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
      hubState.state.climate_control.temp++;
      return hubState.executeCommand(true, device.label, "Temp+").then((response) => {
        return reply({ "speech" : "Temp is " + hubState.state.climate_control.temp + " degrees, is that better"});
      });
    case Intents.INTENT_CLIMATE_CONTROL_DOWN:
      hubState.state.climate_control.temp--;
      return hubState.executeCommand(true, device.label, "Temp-").then((response) => {
        return reply({ "speech" : "Temp is " + hubState.state.climate_control.temp + " degrees, is that better"});
      });
    case Intents.INTENT_CLIMATE_CONTROL_RESET:
      let current_temp = Number(intent.arguments.find((arg) => arg.name == 'temperature').raw_text);
      hubState.state.climate_control.temp = current_temp;
      return reply({ "speech" : "Thanks, it helps that I know the AC is set to " + hubState.state.climate_control.temp + " degrees"});
    case Intents.INTENT_CLIMATE_CONTROL_SET:
      let target_temp = Number(intent.arguments.find((arg) => arg.name == 'temperature').raw_text);
      let diff = hubState.state.climate_control.temp - target_temp;
      let command = diff < 0 ? "Temp+" : "Temp-";
      let commands = new Array(Math.abs(diff)).fill(() => { 
        return Q.delay(750).then(() => { 
          return hubState.executeCommand(true, device.label, command) 
        });
      });
      reply({});
      return commands.reduce(Q.when, Q([])).then(() => {
        hubState.state.climate_control.temp = request.payload.result.parameters.temperature.amount
      });
  }
  return reply();
};

module.exports = handleClimateControl;
