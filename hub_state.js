'use strict';

const HarmonyUtils = require('harmony-hub-util');
const RedisClient = require('./redis_client')

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
  if(RedisClient.connected){
    RedisClient.get("hubState", (error, reply) => {
      hubState.state = JSON.parse(reply);
      console.log("Configuration Loaded");
    });
  } else {
    console.log("Redis not connected yet");
  }
}

hubState.save = () => {
  if(RedisClient.connected){
    RedisClient.set("hubState", JSON.stringify(hubState.state));
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

// Connect to harmony
new HarmonyUtils(process.env.IP || '192.168.0.23').then((hutils) => {
  console.log("Connected to harmony hub");
  hubState.hub = hutils

  // Update commands
  setInterval(hubState.refresh, process.env.REFRESH_HUB || 60000); 
  setInterval(() => {
    hubState.hub.readCurrentActivity().then((response) => { 
      if(response == 'PowerOff'){
        console.log("Activity was " + response) 
        hubState.hub.executeActivity('Default').then((response) => { console.log(response) });;
      }
    });
  }, 5000);

});

RedisClient.on("ready", () => { hubState.load() });

module.exports = hubState;
