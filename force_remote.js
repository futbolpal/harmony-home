'use strict';

const ForceRemoteUtils = require('./force_remote_utils');
const RedisClient = require('./redis_client');

RedisClient.client().on('ready', function(){
  ForceRemoteUtils.checkRemoteStatus();
  setInterval(ForceRemoteUtils.checkRemoteStatus, 30000);
});;

