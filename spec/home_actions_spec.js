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
const HubState = require('../hub_state');

const uut = rewire('../home_actions')
uut.__set__("RedisClient", {
  client : () => {
    return redis;
  }
});

describe("HomeActions", function() {
  let sandbox = sinon.sandbox.create();
  let request = {
    body: {
      user: {},
      conversation: {},
      inputs: []
    }
  }
  let reply;
  beforeEach(function() {
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
    let restoreTvControl, restoreClimateControl;

    beforeEach(function() {
      tvControlStub = sandbox.stub();
      climateControlStub = sandbox.stub();
      restoreClimateControl = uut.__set__("ClimateControl", climateControlStub);
      restoreTvControl = uut.__set__("TvControl", tvControlStub);
    });

    afterEach(function(){
      restoreTvControl();
      restoreClimateControl();
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
      let restoreAskForSignIn;

      beforeEach(function(){
        askForSignInStub = sandbox.stub();
        sandbox.stub(OAuth, "retrieveAuth").callsFake((token) => {
          const d = Q.defer();
          d.reject(null);
          return d.promise;
        });

        restoreAskForSignIn = uut.__set__("askForSignIn", askForSignInStub)
      });

      afterEach(function(){
        restoreAskForSignIn();
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
        let restoreRequireConfiguration;
        beforeEach(function(){
          requireConfigurationStub = sandbox.stub();
          restoreRequireConfiguration = uut.__set__("requireConfiguration", requireConfigurationStub)

          sandbox.stub(User, "find").callsFake((token) => {
            const d = Q.defer();
            d.reject(null);
            return d.promise;
          });
        });

        afterEach(function(){
          restoreRequireConfiguration();
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
        let restoreProcessGh;
        let userData = {attributes: {hubState: {ip: 'some-ip'}}};
        let hubState = {};

        beforeEach(function(){
          processGhStub = sandbox.stub();
          restoreProcessGh = uut.__set__("processGh", processGhStub)

          sandbox.stub(User, "find").callsFake((token) => {
            const d = Q.defer();
            d.resolve(userData);
            return d.promise;
          });

          sandbox.stub(HubState, "init").callsFake((ip) => {
            const d = Q.defer();
            d.resolve(hubState);
            return d.promise;
          });
        });

        afterEach(function(){
          restoreProcessGh();
        });
 
        it("calls processGh with a valid user", function(done){
          handleGh(request, reply).then(() => {
            expect(processGhStub.calledOnce).toBeTrue();
            done();
          });
        });
      });
    });
  });
})
