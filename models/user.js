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
    if(error) return d.reject(error);
    if(reply) return d.resolve(instantiateUser(id, JSON.parse(reply)));
    return d.reject(null);
  });
  return d.promise;
};

const instantiateUser = (id, data) => {
  console.log('instantiateUser', id, data);
  let user = Object.assign({id: id}, {attributes: data});

  user.deviceByHandler = (handler) => {
    return user.attributes.devices.find((d) => { return d.handler == handler }) || null;
  }

  user.deviceByName = (name) => {
    return user.attributes.devices.find((d) => { return d.name == name }) || null;
  }

  user.getHandlerData = (handler) => {
    user.attributes.handlerData = user.attributes.handlerData || {};
    return user.attributes.handlerData[handler] || {};
  };

  user.setHandlerData = (handler, data) => {
    user.attributes.handlerData = user.attributes.handlerData || {};
    return user.attributes.handlerData[handler] = Object.assign(
        user.attributes.handlerData[handler] || {}, data
        );
  }

  user.setDevices = (devices) => { user.attributes.devices = devices; }
  user.setHubState = (hubState) => { user.attributes.hubState = hubState; }
  user.save = () => { writeUser(user.id, user.attributes) }
 
  return user;
}

User.all = () => {
  const d = Q.defer();
  RedisClient.client().keys('users:*', (error, keys) => {
    let chain = RedisClient.client().batch();
    keys.forEach((k) => { 
      chain.get(k);
    });
    chain.exec(function(error, replies) {
      if(error) d.reject(error);
      let users = replies.map((r, i) => { 
        let id = keys[i].split(":")[1];
        return instantiateUser(id, JSON.parse(r))
      })
      d.resolve(users);
    });
  });
  return d.promise;
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
