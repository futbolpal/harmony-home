'use strict';

const util = require('util');
const User = require('../models/user');

const Configuration = {}

Configuration.register = (server) => {
  server.get('/configuration', function(request, reply) {
    console.log("GET /configuration");
    let user_id = request.query.user_id
    let user = User.find_or_create(request.query.user_id);

    return reply.render('configuration', {
      user_id: user_id,
      devices: JSON.stringify(user.devices)
    });
  });

  server.post('/configuration', function(request, reply) {
    console.log('POST /configuration')
    let user = User.find(request.body.user_id);
    let devices = JSON.parse(request.body.devices);

    user.setDevices(devices);

    let redirect = util.format('/configuration?user_id=%s', user.id);
    return reply.redirect(redirect);
  });
}

module.exports = Configuration;
