'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');

const HomeAutomation = {}

HomeAutomation.register = (server) => {
  server.post('/ha', handleHomeAutomation);
}

const handleHomeAutomation = (request, response) => {
  console.log("------------  New Smart Device Action ---------------");
  console.log(request.headers);
  console.log(request.body);
  for(let i = 0; i < request.body.inputs.length; i++){
    let input = request.body.inputs[i];
    let intent = input.intent;
    switch(intent){
      case "action.devices.SYNC":
        return HomeAutomation.sync({
          requestId: request.body.requestId
        }, reply);
      case "action.devices.QUERY":
        return HomeAutomation.query({
          requestId: request.body.requestId,
          devices: input.body.devices
        }, reply);
      case "action.devices.EXEC":
        return HomeAutomation.exec({
          requestId: request.body.requestId,
          commands: input.body.commands
        }, reply);
    }
  }
}

HomeAutomation.sync = (data, reply)=> {
  let deviceProps = {
    requestId: data.requestId,
    payload: {
      devices: [
        new HarmonyDevice('TV', 'action.devices.types.LIGHT',{
          traits : [ "action.devices.traits.OnOff" ]
        }).json,
        new HarmonyDevice('Friedrich Climate Control', 'action.devices.types.THERMOSTAT', {
          traits : [ "action.devices.traits.TemperatureSetting" ],
          attributes : {
            availableThermostatModes: "off,on",
            thermostatTemperatureUnit: "F"
          }
        }).json
      ]
    }
  }
  console.log("SYNC response: ", deviceProps.payload.devices);
  return reply(deviceProps);
}

HomeAutomation.query = (data, reply)=> {
  let devices = data.devices.reduce((object, item) => {
    object[item.id] = {
      on : true
    }
    return object;
  }, {});
  let deviceProps = {
    requestId: data.requestId,
    payload: {
      devices: devices
    }
  }
  console.log("QUERY response: ", deviceProps);
  return reply(deviceProps);
}

HomeAutomation.exec = (data, response)=> {
}

class HarmonyDevice {
  constructor(label, schema, options){
    this.label = label;
    this.schema = schema; 
    this.options = options;
  }

  get json() {
    let device = HubState.deviceByName(this.label);
    let id = device.id;
    let name = device.label;
    let baseData =  {
      id : id,
      type : this.schema,
      name : {
        name : name
      },
      willReportState: false
    }
    return Object.assign({}, baseData, this.options);
  }
}

module.exports = HomeAutomation;
