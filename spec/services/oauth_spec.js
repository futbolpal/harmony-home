'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');
const express = require('express');

const redis = require('mock-redis-client').createMockRedis().createClient();
const uut = rewire('../../services/oauth')
uut.__set__("RedisClient", {
  client : () => {
    return redis;
  }
});

describe("OAuth", function() {
  let sandbox;
  beforeEach(function(){
    sandbox = sinon.sandbox.create();
  });
  afterEach(function(){
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

    it("has a GET /auth path", function(){
      expect(findRoute('/auth','get')).toBeTruthy();
    });
    it("has a POST /login path", function(){
      expect(findRoute('/login','post')).toBeTruthy();
    });
    it("has a POST /token path", function(){
      expect(findRoute('/token','post')).toBeTruthy();
    });
    it("has a POST /token path", function(){
      expect(findRoute('/token','post')).toBeTruthy();
    });
    it("has a GET /token path", function(){
      expect(findRoute('/token','get')).toBeTruthy();
    });
  });

  describe('.generateIndex', function() {
    let generateIndex = uut.__get__("generateIndex");
    it("returns a string", function(){
      expect(generateIndex()).toBeString();
    });

    it("returns a base64 string", function(){
      var base64Matcher = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");
      expect(base64Matcher.test(generateIndex())).toBeTrue();
    });
  });
  
  describe('.upsertAuth', function() {
    let redisSetSpy;
    let upsertAuth = uut.__get__("upsertAuth");
    let mockToken = 'my-token';
    let mockData = { 'attribute': 'value' }
    beforeEach(function(){
      redisSetSpy = sandbox.spy(redis, "set");
      upsertAuth(mockToken, mockData)
    });
    it('creates a key with a token and stringified JSON', function(){
      expect(redisSetSpy.withArgs("oauth:my-token", JSON.stringify(mockData)).calledOnce).toBeTrue(); 
    });
  });


  describe('.retrieveAuth', function(){
    let retrieveAuth = uut.__get__("retrieveAuth");
    let mockToken = 'my-token';
    let mockData = { 'attribute': 'value' }

    beforeEach(function(){
      sandbox.stub(redis, 'get').callsFake((k,cb) => {
        if(k == mockToken) { return cb(null, mockData) };
        return cb('error', null)
      });
    });

    it("resolves null when token is not found", function(){
      retrieveAuth('no-haz-code').then(tokenData => {
        expect(tokenData).toBeNull();
      });
    });

    it("resolves the token data when it is found", function(){
      retrieveAuth(mockToken).then(tokenData => {
        expect(tokenData).toEqual(mockData);
      });
    });

    it("resolves an error when one exists", function(){
      retrieveAuth('no-haz-code').fail((error) => {
        expect(error).toEqual('error');
      });
    });
  });

  describe('.verifyToken', function(){
    it('ensures client id matches')
    it('ensures user is valid')
    it('ensures the token type is expected')
    it('ensures the access token is present')
  });
});
