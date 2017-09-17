'use strict';

const Q = require('q');

const Intents     = require('../intents');
const HubState    = require('../hub_state');
const HomeActions = require('../home_actions_helper');

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
 
  let intentMap = {};
  intentMap[Intents.INTENT_CLIMATE_CONTROL_STATUS]      = { command : null, response: readStatus }   
  intentMap[Intents.INTENT_CLIMATE_CONTROL_UP]          = { command : "Temp+", response: "Ok" } 
  intentMap[Intents.INTENT_CLIMATE_CONTROL_DOWN]        = { command : "Temp-", response: "Ok" }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_RESET]       = { command : null, response: setStatus }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_SET]         = { command : null, response: setTemperature }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_POWER_OFF]   = { command : "PowerToggle", response: togglePower }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_POWER_ON]    = { command : "PowerToggle", response: togglePower }

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  let commandPromise;
  if(command){
    commandPromise = hubState.executeCommand(true, device.label, command); 
  } else {
    let commandDeferred = Q.defer();
    commandDeferred.resolve();
    commandPromise = commandDeferred.promise;
  }
  commandPromise.then((response) => {
    if(typeof(intentResponse) === 'function'){
      return intentResponse(hubState, conversationToken, intent, request, reply, device);
    } else {
      return reply(HomeActions.createSimpleReply(conversationToken, intentResponse));
    }
  });
};

//
// Private Methods
//
const setTemperature = (hubState, conversationToken, intent, request, reply, device) => {
  reply(HomeActions.createSimpleReply(conversationToken, "Ok"));

  let target_temp = Number(intent.arguments.find((arg) => arg.name == 'temperature').raw_text);
  let diff = hubState.state.climate_control.temp - target_temp;
  let command = diff < 0 ? "Temp+" : "Temp-";
  let commands = new Array(Math.abs(diff)).fill(() => { 
    return Q.delay(750).then(() => { 
      return hubState.executeCommand(true, device.label, command) 
    });
  });
  return commands.reduce(Q.when, Q([])).then(() => {
    hubState.state.climate_control.temp = request.payload.result.parameters.temperature.amount
  });
}

const togglePower = (hubState, conversationToken, intent, request, reply, device) => {
  hubState.state.climate_control.online = !hubState.state.climate_control.online;
  return reply(HomeActions.createSimpleReply(conversationToken, "Ok"));
}

const setStatus = (hubState, conversationToken, intent, request, reply, device) => {
  let current_temp = Number(intent.arguments.find((arg) => arg.name == 'temperature').raw_text);
  let status = "The current temperature is " + current_temp + " degrees";
  hubState.state.climate_control.temp = current_temp;
  return reply(HomeActions.createSimpleReply(conversationToken, status));
}

const readStatus = (hubState, conversationToken, intent, request, reply, device) => {
  let status = "The current temperature is " + hubState.state.climate_control.temp + " degrees";
  return reply(HomeActions.createSimpleReply(conversationToken, status));
}

module.exports = handleClimateControl;
