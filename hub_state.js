'use strict';

const Q = require('q');
const HarmonyUtils = require('harmony-hub-util');
const RedisClient = require('./redis_client')

const executeCommand = (hubState, simulate, is_device_cmd, act_or_dev_name, command) => {
  if(simulate){
    console.log("Simulating command: ",is_device_cmd, act_or_dev_name, command);
    return new Promise((resolve, reject) =>{
      resolve("Simulated command");
    });
  } else {
    console.log("Sending command: ",is_device_cmd, act_or_dev_name, command);
    return hubState.executeCommand(is_device_cmd, act_or_dev_name, command);
  }
}

const deviceById = (hub, deviceId) => {
  return hub.state.devices.find(function (dev) {
    if (dev.id.toString() == deviceId) {
      return dev;
    }
  }) || null;
}

const deviceByName = (hub, deviceName) => {
  return hub.state.devices.find(function (dev) {
    if (dev.label == deviceName) {
      return dev;
    }
  }) || null;
}

const forceDefaultRemote = (hub) => {
  let d = Q.defer();
  hub.readCurrentActivity().then((response) => { 
    console.log('current activity', response);
    if(response == 'PowerOff'){
      console.log("Activity was " + response);
      hub.executeActivity('Default').then((response) => { 
        console.log(response); 
        d.resolve(response);
      });
    } else {
      d.reject();
    }
  });
  return d.promise;
}

const listDevices = (hub) => {
  return hub._harmonyClient.getAvailableCommands().then(function(response){
    return response.device; 
  }); 
}

const init = (ip) => {
  const d = Q.defer();
  const h = {
    initialized: false,
    ip: ip,
    state: {},
    deviceById: (id) => { 
      return deviceById(h, id) 
    },
    deviceByName: (name) => { 
      return deviceByName(h, name) 
    },
    forceDefaultRemote: () => {
      return forceDefaultRemote(h._hub);
    },
    executeCommand: (is_device_cmd, act_or_dev_name, command) => { 
      return executeCommand(h._hub, h.simulate, is_device_cmd, act_or_dev_name, command);
    }
  }
  new HarmonyUtils(ip).then((hub) => {
    listDevices(hub).then((devices) => {
      h.initialized = true;
      h.state.devices = devices;
      h._hub = hub;
      d.resolve(h);
    });
  });
  return d.promise;
}

module.exports = { init: init };
