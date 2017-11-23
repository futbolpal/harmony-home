'use strict';

const redis = require('redis');

let _client = null;

const client = () => {
  if(_client) { return _client };
  _client = redis.createClient(process.env.REDISCLOUD_URL || 'redis://localhost', {
    no_ready_check: true
  });
  _client.on("ready", () => {
    console.log('Redis connection ready');
  });
  _client.on("connected", () => {
    console.log('Redis connection connected');
  });
  _client.on("error", (e) => {
    console.error('Redis connection failed', e.code);
  });
  return _client;
}

module.exports = { client }
