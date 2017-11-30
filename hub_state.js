'use strict';

const Q = require('q');
const HarmonyUtils = require('harmony-hub-util');
const RedisClient = require('./redis_client')

const hubState = {
};

hubState.executeCommand = (hubState, simulate, is_device_cmd, act_or_dev_name, command) => {
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

hubState.deviceById = (hub, deviceId) => {
  return hub.state.devices.find(function (dev) {
    if (dev.id.toString() == deviceId) {
      return dev;
    }
  });
}

hubState.deviceByName = (hub, deviceName) => {
  return hub.state.devices.find(function (dev) {
    if (dev.label == deviceName) {
      return dev;
    }
  });
}

hubState.forceDefaultRemote = (hub) => {
  hub.readCurrentActivity().then((response) => { 
    if(response == 'PowerOff'){
      console.log("Activity was " + response) 
        hub.executeActivity('Default').then((response) => { console.log(response) });;
    }
  });
}

hubState.listDevices = (hub) => {
  return hub._harmonyClient.getAvailableCommands().then(function(response){
    return response.device; 
  }); 
}

hubState.init = (ip) => {
  const d = Q.defer();
  const h = {
    initialized: false,
    ip: ip,
    state: {},
    deviceById: (id) => { 
      return hubState.deviceById(h, id) 
    },
    deviceByName: (name) => { 
      return hubState.deviceByName(h, name) 
    },
    forceDefaultRemote: () => {
      return hubState.forceDefaultRemote(h._hub);
    },
    executeCommand: (is_device_cmd, act_or_dev_name, command) => { 
      return hubState.executeCommand(h._hub, h.simulate, is_device_cmd, act_or_dev_name, command);
    }
  }
  new HarmonyUtils(ip).then((hub) => {
    hubState.listDevices(hub).then((devices) => {
      h.initialized = true;
      h.state.devices = devices;
      h._hub = hub;
      d.resolve(h);
    });
  });
  return d.promise;
}

module.exports = hubState;
