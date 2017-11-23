'use strict';

const util = require('util');
const Q = require('q');
const RedisClient = require('../redis_client');

const User = {}

const writeUser = (id, data) => {
  console.log('redis:user:set', id, data);
  RedisClient.client().set(`users:${id}`, JSON.stringify(data));
};

const retrieveUser = (id) => {
  const d = Q.defer();
  RedisClient.client().get(`users:${id}`, (error, reply) => {
    console.log('redis:user:get', id, error,reply);
    if(error) d.reject(id, error);
    if(reply) d.resolve(instantiateUser(id, JSON.parse(reply)));
    d.reject(id, null);
  });
  return d.promise;
};

const instantiateUser = (id, data) => {
  console.log('instantiateUser', id, data);
  let user = Object.assign({id: id}, {attributes: data});

  user.deviceByHandler = (handler) => {
    return user.attributes.devices.find((d) => { return d.handler == handler });
  }

  user.setDevices = (devices) => {
    user.attributes.devices = devices;
    console.log('user',user);
  }

  user.setHubState = (hubState) => {
    user.attributes.hubState = hubState;
  }

  user.save = () => {
    writeUser(user.id, user.attributes);
  }
 
  return user;
}

User.find = (id) => {
  return retrieveUser(id)
}

User.find_or_create = (id) => {
  return retrieveUser(id).fail(() => {
    let user = instantiateUser(id, {});
    writeUser(id, {});
    return user;
  });
}
module.exports = User;
