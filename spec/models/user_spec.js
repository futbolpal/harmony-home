'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');

const redis = require('mock-redis-client').createMockRedis().createClient();

const uut = rewire('../../models/user')
uut.__set__("RedisClient", {
  client : () => {
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
