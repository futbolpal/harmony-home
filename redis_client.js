'use strict';


const redis = require('redis');
const redis_client = redis.createClient(process.env.REDISCLOUD_URL || 'redis://localhost', {
  no_ready_check: true
});

module.exports = redis_client
