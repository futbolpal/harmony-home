
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

User.findBy = (id) => {
  let user = Object.assign({}, userDb[id]);
  user.deviceByHandler = (handler) => {
    return user.devices.find((d) => { return d.handler == handler });
  }
  return user; 
}

module.exports = User;
