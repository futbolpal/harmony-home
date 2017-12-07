'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');

const stubResolvedPromise = (resolveWith) => {
  return (args) => {
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

const uut = rewire('../force_remote_utils')
describe("ForceRemoteUtils", function() {
  let sandbox;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe(".checkRemoteStatus", function(){
    let checkRemoteStatus = uut.__get__("checkRemoteStatus");
    let User = uut.__get__("User");
    let users = [{}];
    let forceDefaultRemoteStub;
    beforeEach(function(){
      forceDefaultRemoteStub = sandbox.stub();
      uut.__set__("forceDefaultRemote", forceDefaultRemoteStub);
    });
    describe("when there are users", function(){
      beforeEach(function(){
        sandbox.stub(User, "all").callsFake(stubResolvedPromise(users));
      });
      it("calls forceDefaultRemote for each user", function(done){
        checkRemoteStatus().then(function(){
          expect(forceDefaultRemoteStub.callCount).toEqual(users.length);
          done();
        }); 
      })
    });
    describe("when there are no users", function(){
      beforeEach(function(){
        sandbox.stub(User, "all").callsFake(stubResolvedPromise([]));
      });
 
      it("does not call forceDefaultRemote", function(done){
        checkRemoteStatus().then(function(){
          expect(forceDefaultRemoteStub.notCalled).toBeTrue();
          done();
        }); 
      })
    });
  });

  describe(".forceDefaultRemote", function(){
    let forceDefaultRemote = uut.__get__("forceDefaultRemote");
    let hub = {};
    let user = { attributes : { hubState : { ip : 'my-ip' } } };
    let HubStateMock;
  
    beforeEach(function(){
      hub.forceDefaultRemote = sandbox.stub();
    });

    describe("when hub is properly initialized", function(){
      beforeEach(function(){
        HubStateMock = {
          init: sandbox.stub().callsFake(stubResolvedPromise(hub))
        }
        uut.__set__("HubState", HubStateMock);

      });
      it("calls forceDefaultRemote on the hub object", function(done){
        forceDefaultRemote(user).then(() => {
          expect(hub.forceDefaultRemote.calledOnce).toBeTrue();        
          done();
        });
      });
    });

    describe("when hub fails to initialize", function(){
      beforeEach(function(){
        HubStateMock = {
          init: sandbox.stub().callsFake(stubRejectedPromise())
        }
        uut.__set__("HubState", HubStateMock);
      });

      it("should not call forceDefaultRemote", function(){
        forceDefaultRemote(user).then(() => {
          expect(hub.forceDefaultRemote.notCalled).toBeTrue();        
          done();
        });
      });
    });
  });
}); 

