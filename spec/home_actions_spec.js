'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');
const express = require('express');
const { ActionsSdkApp } = require('actions-on-google');

const redis = require('mock-redis-client').createMockRedis().createClient();
const OAuth = require('../services/oauth');
const User = require('../models/user');
const Intents = require('../intents');

const uut = rewire('../home_actions')
uut.__set__("RedisClient", {
  client : () => {
    return redis;
  }
});

describe("HomeActions", function() {
  let sandbox;
  let request = {
    body: {
      user: {},
      conversation: {},
      inputs: []
    }
  }
  let reply;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    reply = sinon.stub();
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

  describe("processGh", function() {
    let processGh = uut.__get__("processGh");
    let user = {};
    let climateControlStub, tvControlStub;

    beforeEach(function() {
      tvControlStub = sandbox.stub();
      climateControlStub = sandbox.stub();
      uut.__set__("ClimateControl", climateControlStub);
      uut.__set__("TvControl", tvControlStub);
    });

    it("delegates to climate handler when intent is one within the climate handler", function(){
      let climateIntent = { intent: Intents.INTENT_CLIMATE_CONTROL_UP }
      request.body.inputs = [ climateIntent ];
      processGh(request, reply, user);
      expect(climateControlStub.calledOnce).toBeTrue();
    });

    it("delegates to tv handler when intent is one within the tv handler", function(){
      let tvIntent = { intent: Intents.INTENT_TV_CONTROL_POWER_ON }
      request.body.inputs = [ tvIntent ]
      processGh(request, reply, user);
      expect(tvControlStub.calledOnce).toBeTrue();
    });

    it("answers with a simple response when intent cannot be handled", function(){
    });
  });

  describe("handleGh", function() {
    let handleGh = uut.__get__("handleGh");
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
