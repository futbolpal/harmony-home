'use strict';

const redis = require('redis');

let _client = null;

const client = () => {
  if(_client) { return _client }
  return _client = redis.createClient(process.env.REDISCLOUD_URL || 'redis://localhost', {
    no_ready_check: true
  });
}

module.exports = { client }
