'use strict';

const HubState = require('./hub_state');
const User = require('./models/user');

const forceDefaultRemote = (user) => {
  let ip = user.attributes.hubState.ip;
  return HubState.init(ip).then((hub) => {
    hub.forceDefaultRemote();
  });
}

const checkRemoteStatus = function(){
  return User.all().then((users) => { 
    return users.map(forceDefaultRemote);
  });
};

module.exports = { checkRemoteStatus };
