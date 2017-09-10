'use strict';


const _ = require('underscore');
const s = require("underscore.string");
const Hapi = require('hapi');

const Health = require('./health');
const HomeAutomation = require('./home_automation');
const HomeActions = require('./home_actions');

const server = new Hapi.Server();

server.connection({ 
  host: '0.0.0.0', 
  port: +process.env.PORT || 3000
});

Health.register(server);
HomeAutomation.register(server);
HomeActions.register(server);

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
