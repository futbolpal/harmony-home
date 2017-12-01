'use strict';

const HarmonyUtils = require('harmony-hub-util');
const HubState = require('./hub_state');
const RedisClient = require('./redis_client');
const User = require('./models/user');

const forceDefaultRemote = (user) => {
  let ip = user.attributes.hubState.ip;
  HubState.init(ip).then((hub) => {
    hub.forceDefaultRemote();
  });
}

const checkRemoteStatus = function(){
  User.all().then((users) => { 
    return users.map(forceDefaultRemote);
  });
};

RedisClient.client().on('ready', function(){
  checkRemoteStatus();
  setInterval(checkRemoteStatus, 30000);
});;

