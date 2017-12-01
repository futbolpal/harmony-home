'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');

const redis = require('mock-redis-client').createMockRedis().createClient();

const stubResolvedPromise = (resolveWith) => {
  return () => {
    let d = Q.defer();
    d.resolve(resolveWith);
    return d.promise;
  }
}
const stubRejectedPromise = (rejectWith) => {
  return () => {
    let d = Q.defer();
    d.reject(rejectWith);
    return d.promise;
  }
}
let execError = null;
let execReplies = [];
const uut = rewire('../../models/user')
uut.__set__("RedisClient", {
  client : () => {
    redis.batch = function() { return redis; }
    redis.exec = (cb) => { 
      cb(execError, execReplies) 
    }
    return redis;
  }
});

describe("User", function() {
  let sandbox;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe(".all", function(){
    let keys = [];
    let userIds = [];

    beforeEach(function(){
        sandbox.stub(redis, "keys").callsFake((pattern, cb) => { cb(null, keys) })
    });

    it("returns a promise", function(){
      expect(uut.all()).toBePromise();
    });

    describe("when resolved with no users", function(){
      beforeEach(function(){
        keys = [];
        execReplies = [];
      });

      it("returns an empty array when there are no users", function(done){
        uut.all().then((users) => {
          expect(users).toEqual([]);
          done();
        });
      });
    });

    describe("when resolved with users", function(){
      beforeEach(function(){
        userIds = ['my-id'];
        keys = userIds.map((id) => { return `users:${id}` })
        execReplies = userIds.map((id) => { return "{}" })
      });

      it("calls 'get' for each returned key", function(done){
        let getSpy = sandbox.spy(redis, "get");
        uut.all().then(() => {
          expect(getSpy.callCount).toBe(keys.length);
          done();
        });
      });

      it("returns an array of users when they exist", function(done){
        uut.all().then((users) => {
          expect(users.length).toEqual(keys.length);
          users.forEach((user, index) => {
            expect(user.id).toEqual(userIds[index]);
          });
          done();
        });
      });
    });
  });

  describe(".find", function() {
    xit("calls success callback when user is found", function(){
    });

    xit("calls failure callback when user is not found", function(){
    });
  });

  xdescribe(".find_or_create_by", function(){
    xit("calls success callback with user when found", function(){
    });

    xit("calls success callback with new user when not found", function(){
    });
  });

  describe("#writeUser", function(){
    let redisSetSpy;
    let writeUser;
    let mockId = 'my-id'
    let mockAttributes = { x: 'y' }

    beforeEach(function(){
      writeUser = uut.__get__("writeUser");
      redisSetSpy = sandbox.spy(redis, "set");
    });

    it("sets a redis key with JSON representation of user attributes", function(){
      writeUser(mockId, mockAttributes);
      expect(redisSetSpy.withArgs(`users:${mockId}`, JSON.stringify(mockAttributes)).calledOnce).toBeTrue();
    });
  });

  describe("#instantiateUser", function(){
    let instantiatedUser;
    let mockId = 'my-id';
    let mockAttributes = {};

    beforeEach(function(){
      let instantiateUser = uut.__get__("instantiateUser");
      instantiatedUser = instantiateUser(mockId, mockAttributes);
    });

    it("creates an object with a deviceByHandler method", function(){
      expect(instantiatedUser.deviceByHandler).toBeFunction();
    });

    it("creates an object with a setDevices method", function(){
      expect(instantiatedUser.setDevices).toBeFunction();
    });

    it("creates an object with a setHubState method", function(){
      expect(instantiatedUser.setHubState).toBeFunction();
    });

    it("creates an object with a save method", function(){
      expect(instantiatedUser.save).toBeFunction();
    });
 
  });

  describe("#retrieveUser", function(){
    let retrieveUser;
    let mockId = 'my-id';
    let mockAttributes = { x: 'y'};

    beforeEach(function(){
      retrieveUser = uut.__get__("retrieveUser");
    });

    it("returns the user when id is found", function(done) {
      sandbox.stub(redis, "get").callsFake((id, cb) => { return cb(null, JSON.stringify(mockAttributes)); });
      retrieveUser(mockId).then((user) => {
        expect(user.attributes).toEqual(mockAttributes);
        done();
      });
    });

    it("returns the null when the user is not found", function(done){
      sandbox.stub(redis, "get").callsFake((id, cb) => { return cb(null, null); });
      retrieveUser(mockId).fail((nothing) => {
        expect(nothing).toBeNull();
        done();
      });
    });

    it("returns the id and the error when there is an error", function(done){
      sandbox.stub(redis, "get").callsFake((id, cb) => { return cb('fail', null); });
      retrieveUser(mockId).fail((error) => {
        expect(error).toEqual('fail');
        done();
      });
    });
  });

  describe("instance methods", function(){
    let instantiatedUser;
    let mockId = 'my-id';
    let mockAttributes = {};

    beforeEach(function(){
      let instantiateUser = uut.__get__("instantiateUser");
      instantiatedUser = instantiateUser(mockId, mockAttributes);
    });

    describe(".deviceByHandler", function(){
      let devices = [ { handler: 'smart-handler' } ];

      beforeEach(function(){
        instantiatedUser.setDevices(devices);
      });

      it("returns null when device doesn't exist for handler", function(){
        expect(instantiatedUser.deviceByHandler('dumb-handler')).toBeNull();
      });

      it("returns the device when one matches the handler", function(){
        expect(instantiatedUser.deviceByHandler('smart-handler')).toBe(devices[0]);
      });
    });

    describe(".setDevices", function(){
      let mockDevice = { x: 'y' }
      it("updates the devices attribute", function(){
        instantiatedUser.setDevices([mockDevice]);
        expect(instantiatedUser.attributes.devices).toEqual([mockDevice]);
      });
    });

    describe(".setHubState", function(){
      let mockHubState = { x: 'y' }
      it("updates the devices attribute", function(){
        instantiatedUser.setHubState(mockHubState);
        expect(instantiatedUser.attributes.hubState).toEqual(mockHubState);
      });
    });

    describe(".setHandlerData", function(){
      let mockHandler = 'mock-handler';
      let mockHandlerData = { x: 'y' }
      it("updates the handler data", function(){
        instantiatedUser.setHandlerData(mockHandler, mockHandlerData);
        expect(instantiatedUser.attributes.handlerData[mockHandler]).toEqual(mockHandlerData);
      });
    });

    describe(".getHandlerData", function(){
      let mockHandler = 'mock-handler';
      let mockHandlerData = { x: 'y' }
      it("updates the handler data", function(){
        instantiatedUser.setHandlerData(mockHandler, mockHandlerData);
        expect(instantiatedUser.getHandlerData(mockHandler)).toEqual(mockHandlerData);
      });
    });

    describe(".save", function(){
      let writeUserStub, restoreWriteUserStub;
      beforeEach(function(){
        writeUserStub = sandbox.stub();
        restoreWriteUserStub = uut.__set__("writeUser", writeUserStub); 
      });

      afterEach(function(){
        restoreWriteUserStub();
      });

      it("calls writeUser with id and attributes", function(){
        instantiatedUser.save();
        expect(writeUserStub.withArgs(instantiatedUser.id, instantiatedUser.attributes).calledOnce).toBeTrue();
      });
    });
  });
}); 
