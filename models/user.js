'use strict';

const util = require('util');

const User = {}

const userDb = {
  'my-id': {
    hubState: {
      hub : null,
      ip : '192.168.0.23',
      state : {
        simulate : false,
        climate_control : {
          online : false,
          temp : 70
        },
      }
    },
    devices: [{
      handler: 'climate_control',
      name: 'Friedrich Climate Control',
      commands: {
        POWER : "PowerToggle",
        UP : "Temp+",
        DOWN : "Temp-"
      }
    },{
      handler: 'tv_control',
      name: 'TV',
      commands: {
        POWER_ON: "PowerOn",
        POWER_OFF: "PowerOff",
        VOLUME_UP: "VolumeUp",
        VOLUME_DOWN: "VolumeDown",
        MUTE: "Mute"
      }
    }]
  }
}

User.find = (id) => {
  if(!userDb[id]) { return null }
  let user = Object.assign({}, userDb[id]);
  user.id = id;
  user.deviceByHandler = (handler) => {
    return user.devices.find((d) => { return d.handler == handler });
  }
  user.setDevices = (devices) => {
    userDb[user.id].devices = devices;
  }
  return user; 
}

User.find_or_create = (id) => {
  if(userDb[id]) { return User.find(id) }
  userDb[id] = {
    hubState: {},
    devices: []
  }
  return User.find(id); 
}
module.exports = User;
