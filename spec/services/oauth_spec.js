
'use strict';

const rewire = require("rewire");
const sinon = require('sinon');
const Q = require ('q');
const express = require('express');

const uut = rewire('../../services/oauth');

describe("OAuth", function() {
  
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
});
