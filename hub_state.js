'use strict';

const redis_client = require('./redis_client')
const hubState = {
  hub : null,
  state : {
    simulate : false,
    commands : null,
    climate_control : {
      online : false,
      temp : 70
    },
  }
};

hubState.executeCommand = (is_device_cmd, act_or_dev_name, command) => {
  if(hubState.state.simulate){
    console.log("Simulating command: ",is_device_cmd, act_or_dev_name, command);
    return new Promise((resolve, reject) =>{
      resolve("Simulated command");
    });
  } else {
    console.log("Sending command: ",is_device_cmd, act_or_dev_name, command);
    return hubState.hub.executeCommand(is_device_cmd, act_or_dev_name, command);
  }
}
 
hubState.refresh = () => {
  if(!hubState.hub){
    return console.log("Hub not initialized");
  }
  hubState.hub._harmonyClient.getAvailableCommands().then(function(response){
    console.log("Refreshed state");
    hubState.state.commands = response; 
    hubState.save();
  });
};

hubState.load = () => {
  if(redis_client.connected){
    redis_client.get("hubState", (error, reply) => {
      hubState.state = JSON.parse(reply);
      console.log("Configuration Loaded");
    });
  } else {
    console.log("Redis not connected yet");
  }
}

hubState.save = () => {
  if(redis_client.connected){
    redis_client.set("hubState", JSON.stringify(hubState.state));
  } else {
    console.log("Redis not connected");
  }
};

hubState.deviceById = (deviceId) => {
  return hubState.state.commands.device.find(function (dev) {
    if (dev.id.toString() == deviceId) {
      return dev;
    }
  });
}

hubState.deviceByName = (deviceName) => {
  return hubState.state.commands.device.find(function (dev) {
    if (dev.label == deviceName) {
      return dev;
    }
  });
}

module.exports = hubState;
