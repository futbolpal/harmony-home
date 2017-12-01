'use strict';

const Q = require('q');

const Intents     = require('../intents');
const HubState    = require('../hub_state');
const HomeActions = require('../home_actions_helper');

const HandlerName = 'climate_control';

Intents.INTENT_CLIMATE_CONTROL_STATUS       = "com.harmony-home.intent.climate-control.temperature.status";
Intents.INTENT_CLIMATE_CONTROL_UP           = "com.harmony-home.intent.climate-control.temperature.up";
Intents.INTENT_CLIMATE_CONTROL_DOWN         = "com.harmony-home.intent.climate-control.temperature.down";
Intents.INTENT_CLIMATE_CONTROL_RESET        = "com.harmony-home.intent.climate-control.temperature.reset";
Intents.INTENT_CLIMATE_CONTROL_SET          = "com.harmony-home.intent.climate-control.temperature.set";
Intents.INTENT_CLIMATE_CONTROL_ADJUST       = "com.harmony-home.intent.climate-control.temperature.adjust";
Intents.INTENT_CLIMATE_CONTROL_POWER_OFF    = "com.harmony-home.intent.climate-control.on";
Intents.INTENT_CLIMATE_CONTROL_POWER_ON     = "com.harmony-home.intent.climate-control.off";

Intents.INTENT_GROUP_CLIMATE_CONTROL = [
  Intents.INTENT_CLIMATE_CONTROL_STATUS       ,
  Intents.INTENT_CLIMATE_CONTROL_UP           ,
  Intents.INTENT_CLIMATE_CONTROL_DOWN         ,
  Intents.INTENT_CLIMATE_CONTROL_RESET        ,
  Intents.INTENT_CLIMATE_CONTROL_SET          ,
  Intents.INTENT_CLIMATE_CONTROL_ADJUST       ,
  Intents.INTENT_CLIMATE_CONTROL_POWER_OFF    ,
  Intents.INTENT_CLIMATE_CONTROL_POWER_ON     
];

const handleClimateControl = (context, request, reply) => {
  let {hubState, intent, user, conversationToken} = context;
  let intentName = intent.intent;

  let deviceConfiguration = user.deviceByHandler(HandlerName);
  let device = hubState.deviceByName(deviceConfiguration.name);
  let commands = deviceConfiguration.commands;

  let intentMap = {};
  intentMap[Intents.INTENT_CLIMATE_CONTROL_STATUS]      = { command : null, response: handleReadStatus }   
  intentMap[Intents.INTENT_CLIMATE_CONTROL_UP]          = { command : commands.UP, response: "Ok" } 
  intentMap[Intents.INTENT_CLIMATE_CONTROL_DOWN]        = { command : commands.DOWN, response: "Ok" }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_RESET]       = { command : null, response: handleSetStatus }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_SET]         = { command : null, response: handleSetTemperature }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_ADJUST]      = { command : null, response: handleAdjustTemperature }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_POWER_OFF]   = { command : commands.POWER, response: handleTogglePower }
  intentMap[Intents.INTENT_CLIMATE_CONTROL_POWER_ON]    = { command : commands.POWER, response: handleTogglePower }

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
  return commandPromise.then((response) => {
    if(typeof(intentResponse) === 'function'){
      let response = intentResponse(hubState, user, intent, device, deviceConfiguration);
      return reply.json(HomeActions.createSimpleReply(conversationToken, response));
    } else {
      return reply.json(HomeActions.createSimpleReply(conversationToken, intentResponse));
    }
  });
};

//
// Private Methods
//
const argsTemperature = (intent) => {
  return Number(intent.arguments.find((arg) => arg.name == 'temperature').raw_text);
}

const queryContains = (intent, needle) => {
  return intent.raw_inputs.find((raw_input) => raw_input.query.includes(needle)) != undefined;
}

const adjustTemperature = (hubState, device, deviceConfig, amount, delay = 750) => {
  let command = amount > 0 ? deviceConfig.commands.UP : deviceConfig.commands.DOWN;
  return HomeActions.repeatCommands(Math.abs(amount), delay, () =>{
    return hubState.executeCommand(true, device.label, command) 
  }).then(() => {
    let temp = user.getHandlerData(HandlerName).temp;
    user.setHandlerData(HandlerName, {temp: temp + amount});
    user.save();
  });
}

///
// Handler Methods
//
const handleSetTemperature = (hubState, user, intent, device, deviceConfig) => {
  let target_temp = argsTemperature(intent);
  let diff = user.getHandlerData(HandlerName).temp - target_temp;
  adjustTemperature(hubState, device, deviceConfig, diff);
  return "Ok";
}

const handleAdjustTemperature = (hubState, user, intent, device, deviceConfig) => {
  let amount = argsTemperature(intent);
  if(queryContains(intent, "down")){
    amount *= -1;
  }
  adjustTemperature(hubState, device, deviceConfig, amount);
  return "Ok";
}

const handleTogglePower = (hubState, user, intent, device) => {
  let online = user.getHandlerData(HandlerName).online;
  user.setHandlerData(HandlerName, { online: !online });
  user.save();
  return "Ok";
}

const handleSetStatus = (hubState, user, intent, device) => {
  let current_temp = argsTemperature(intent);
  let status = "The current temperature is " + current_temp + " degrees";
  user.setHandlerData(HandlerName, { temp: current_temp });
  user.save();
  return status;
}

const handleReadStatus = (hubState, user, intent, device) => {
  let current_temp = user.getHandlerData(HandlerName).temp;
  let status = "The current temperature is " + temp + " degrees";
  return status;
}

module.exports = handleClimateControl;
