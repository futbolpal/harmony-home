'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');

const Health = {}

Health.register = (server) => {
  server.route({
    method: 'GET',
    path: '/health',
    handler: (request, reply) => {
      return reply({
        app: "OK",
        hub: HubState.hub != null ? "OK" : "FAIL",
        newrelic: NewRelic.agent._state != 'errored' ? "OK" : "FAIL",
        redis: RedisClient.client().connected ? "OK" : "FAIL"
      })
    }
  });
}

module.exports = Health;
