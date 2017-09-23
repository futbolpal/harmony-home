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

const Commands = {
  POWER : "PowerToggle",
  UP : "Temp+",
  DOWN : "Temp-"
}

const handleClimateControl = (hubState, conversationToken, intent, request, reply) => {
  let device = hubState.deviceByName("Friedrich Climate Control");
  let intentName = intent.intent;

  let intentMap = {};
  intentMap[Intents.INTENT_CLIMATE_CONTROL_STATUS]      = { command : null, response: handleReadStatus }   
  intentMap[Intents.INTENT_CLIMATE_CONTROL_UP]          = { command : Commands.UP, response: "Ok" } 
  intentMap[Intents.INTENT_CLIMATE_CONTROL_DOWN]        = { command : Commands.DOWN, response: "Ok" }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_RESET]       = { command : null, response: handleSetStatus }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_SET]         = { command : null, response: handleSetTemperature }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_POWER_OFF]   = { command : Commands.POWER, response: handleTogglePower }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_POWER_ON]    = { command : Commands.POWER, response: handleTogglePower }

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
const argsTemperature = (intent) => {
  return Number(intent.arguments.find((arg) => arg.name == 'temperature').raw_text);
}


const adjustTemperature = (hubState, device, amount, delay = 750) => {
  let command = amount > 0 ? Commands.UP : Commands.DOWN;
  return HomeActions.repeatCommands(Math.abs(amount), delay, () =>{
    return hubState.executeCommand(true, device.label, command) 
  }).then(() => {;
    hubState.state.climate_control.temp += amount
  });
}

///
// Handler Methods
//
const handleSetTemperature = (hubState, conversationToken, intent, request, reply, device) => {
  reply(HomeActions.createSimpleReply(conversationToken, "Ok"));
  let target_temp = argsTemperature(intent);
  let diff = hubState.state.climate_control.temp - target_temp;
  return adjustTemperature(hubState, device, diff);
}

const handleTogglePower = (hubState, conversationToken, intent, request, reply, device) => {
  hubState.state.climate_control.online = !hubState.state.climate_control.online;
  return reply(HomeActions.createSimpleReply(conversationToken, "Ok"));
}

const handleSetStatus = (hubState, conversationToken, intent, request, reply, device) => {
  let current_temp = argsTemperature(intent);
  let status = "The current temperature is " + current_temp + " degrees";
  hubState.state.climate_control.temp = current_temp;
  return reply(HomeActions.createSimpleReply(conversationToken, status));
}

const handleReadStatus = (hubState, conversationToken, intent, request, reply, device) => {
  let status = "The current temperature is " + hubState.state.climate_control.temp + " degrees";
  return reply(HomeActions.createSimpleReply(conversationToken, status));
}

module.exports = handleClimateControl;
