'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');
const express = require('express');
const { ActionsSdkApp } = require('actions-on-google');

const redis = require('mock-redis-client').createMockRedis().createClient();
const OAuth = require('../services/oauth');
const User = require('../models/user');

const uut = rewire('../home_actions')
uut.__set__("RedisClient", {
  client : () => {
    return redis;
  }
});

describe("HomeActions", function() {
  let sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });
  afterEach(function() {
    sandbox.restore();
  });

  describe("routes", function() {
    let app = express();
    let findRoute = (path, method) => {
      return app._router.stack.find((r) => { 
        return r.route && r.route.path == path && r.route.methods[method]
      });
    }
    beforeEach(function() {
      uut.register(app);
    });

    it("has a POST /gh path", function(){
      expect(findRoute('/gh','post')).toBeTruthy();
    });
  });

  describe("handleGh", function() {
    let handleGh = uut.__get__("handleGh");
    let request = {
      body: {
        user : {
          accessToken: null
        }
      }
    }
    let reply = sinon.stub();

    describe("when auth token is not found", function() {
      let askForSignInStub;

      beforeEach(function(){
        askForSignInStub = sandbox.stub();
        sandbox.stub(OAuth, "retrieveAuth").callsFake((token) => {
          const d = Q.defer();
          d.reject(null);
          return d.promise;
        });

        uut.__set__("askForSignIn", askForSignInStub)
      });

      it("asks for sign in", function(done) {
        handleGh(request, reply).then(() => {
          expect(askForSignInStub.calledOnce).toBeTrue();
          done();
        });
      });
    });

    describe("when auth token is found", function() {
      let tokenData = {}
      beforeEach(function(){
        sandbox.stub(OAuth, "retrieveAuth").callsFake((token) => {
          const d = Q.defer();
          d.resolve(tokenData);
          return d.promise;
        });
      });

      describe("when no user is configured", function() {
        let requireConfigurationStub;
        beforeEach(function(){
          requireConfigurationStub = sandbox.stub();
          uut.__set__("requireConfiguration", requireConfigurationStub)
        });
        it("calls requireConfiguration", function(done) {
          handleGh(request, reply).then(() => {
            expect(requireConfigurationStub.calledOnce).toBeTrue();
            done();
          });
        });
      });

      describe("when the user is configured", function() {
        let processGhStub;
        let userData = {};

        beforeEach(function(){
          processGhStub = sandbox.stub();
          uut.__set__("processGh", processGhStub)

          sandbox.stub(User, "find").callsFake((token) => {
            const d = Q.defer();
            d.resolve(userData);
            return d.promise;
          });
        });
 
        it("calls proessGh with a valid user", function(done){
          handleGh(request, reply).then(() => {
            expect(processGhStub.calledOnce).toBeTrue();
            done();
          });
        });
      });
    });
  });
})
