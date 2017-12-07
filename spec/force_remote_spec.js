'use strict';

const Q = require("q");
const proxyquire =  require('proxyquire')
const sinon = require('sinon');
const redis = require('mock-redis-client').createMockRedis().createClient();
const redisClientStub = {
  client : () => {
    redis.on = (eventName, cb) => { cb() };
    return redis;
  }
}

describe("Force Remote", function() {
  let sandbox = sinon.sandbox.create();
  let checkRemoteStatusStub;
  let uut;

  beforeEach(function(){
    checkRemoteStatusStub = sandbox.stub();
    uut = proxyquire('../force_remote', { 
      './redis_client': redisClientStub,
      './force_remote_utils': { checkRemoteStatus: checkRemoteStatusStub }
    });
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe("loading", function(){
    it("calls check remote status when redis is ready", function(done){
      expect(checkRemoteStatusStub.calledOnce).toBeTrue();
      redis.on('ready', done);
    });
  }); 
});
