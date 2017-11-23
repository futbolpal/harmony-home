'use strict';

const util = require('util');
const User = require('../models/user');
const OAuth = require('../services/oauth');

const Configuration = {}

const askForSignIn = (request, reply) => {
  const app = new ActionsSdkApp({request: request, response: reply});
  return app.askForSignIn();
}

Configuration.register = (server) => {
  server.get('/configuration', function(request, reply) {
    console.log("GET /configuration");
    let accessToken = request.query.accessToken
    const withUser = (tokenData) => {
      User.find_or_create(tokenData.uid).then((user) => {
        return reply.render('configuration', {
          accessToken: accessToken,
          devices: JSON.stringify(user.attributes.devices),
          hubState: JSON.stringify(user.attributes.hubState)
        });
      });
    }
    const withoutUser = () => { askForSignIn(request, reply); }
    OAuth.retrieveAuth(accessToken).then(withUser, withoutUser);
  });

  server.post('/configuration', function(request, reply) {
    console.log('POST /configuration')
    let accessToken = request.body.access_token;
    const withUser = (tokenData) => {
      User.find(tokenData.uid).then((user) => {
        let hubState = JSON.parse(request.body.hub_state);
        let devices = JSON.parse(request.body.devices);
        let redirect = util.format('/configuration?accessToken=%s', accessToken);
               
        user.setHubState(hubState);
        user.setDevices(devices);
        user.save();

        return reply.redirect(redirect);
      });
    }   
    const withoutUser = () => { askForSignIn(request, reply); }
    OAuth.retrieveAuth(accessToken).then(withUser, withoutUser);
  });
}

module.exports = Configuration;
