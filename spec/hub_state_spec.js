'use strict';

const Q = require("q");
const rewire = require("rewire");
const sinon = require('sinon');

const uut = rewire('../hub_state')

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

describe("HubState", function() {
  let sandbox = sinon.sandbox.create();
  let hub;

  beforeEach(function(){
    hub  = {
      state : {
        devices: [{id: 'device-id', label: 'device-name'}]
      }
    } 
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe("#executeCommand", function() {
    let executeCommand = uut.__get__("executeCommand");
   
    let device = 'TV';
    let command = 'PowerOn';   
    let isDevice = true;

    it("does not executeCommand when in simulation", function(done){
      let simulation = true;
      executeCommand(hub, simulation, isDevice, device, command).then((result) => {
        expect(result).toEqual("Simulated command");
        done();
      });
    });

    it("executes command", function(){
      let simulation = false;
      hub.executeCommand = sandbox.stub();
      executeCommand(hub, simulation, isDevice, device, command);
      expect(hub.executeCommand.withArgs(isDevice, device, command).calledOnce).toBeTrue(); 
    });
  });

  describe("#deviceById", function() {
    let deviceById = uut.__get__("deviceById");
    it("returns null when device is not found", function(){
      expect(deviceById(hub, 'some-id')).toBeNull();
    });

    it("returns a device object when the device is found", function(){
      expect(deviceById(hub, 'device-id')).toBe(hub.state.devices[0]);
    });
  });

  describe("#deviceByName", function() {
    let deviceByName = uut.__get__("deviceByName");
 
    it("returns null when device is not found", function(){
      expect(deviceByName(hub, 'some-name')).toBeNull();
    });
    it("returns a device object when the device is found", function(){
      expect(deviceByName(hub, 'device-name')).toBe(hub.state.devices[0]);
    });
  });

  describe("#forceDefaultRemote", function() {
    let forceDefaultRemote = uut.__get__("forceDefaultRemote");
    let currentActivity;

    beforeEach(function(){
      hub.readCurrentActivity = sandbox.stub().callsFake(() => {
        return stubResolvedPromise(currentActivity)();
      });
      hub.executeActivity = sandbox.stub().callsFake(stubResolvedPromise('i did it'));
    });

    describe("when activity is 'PowerOff'", function(){
      beforeEach(function(){
        currentActivity = "PowerOff";
      });

      it("changes the activity to Default", function(done){
        forceDefaultRemote(hub).then(() => {
          expect(hub.executeActivity.withArgs("Default").calledOnce).toBeTrue();
          done();
        });
      });
    });

    describe("when activity is not 'PowerOff'", function(){
      beforeEach(function(){
        currentActivity = "MyCrazyActivity";
      });

      it("does not change the activity", function(done){
        forceDefaultRemote(hub).fail(() => {
          expect(hub.executeActivity.notCalled).toBeTrue();
          done();
        });
      });
    });
  });

  describe("#listDevices", function() {
    let listDevices = uut.__get__("listDevices");
    let getAvailableCommandsResponse = {
      device: []
    }

    beforeEach(function(){
      hub._harmonyClient = {
        getAvailableCommands: sandbox.stub().callsFake(stubResolvedPromise(getAvailableCommandsResponse))
      }
    }); 
    it("returns a promise", function(){
      expect(listDevices(hub)).toBePromise();
    });

    describe("when promise resolves", function(){
      it("returns an array of devices", function(done){
        listDevices(hub).then((devices) => {
          expect(devices).toEqual([]);
          done();
        });
      });
    });
  });

  describe(".init", function() {
    it("returns a promise", function(){
      expect(uut.init('my-ip')).toBePromise();
    });

    xdescribe("when hub fails to initialize", function(){
      beforeEach(function(){
      });
    });

    describe("when hub initializes", function(){
      let hubResponse = {};
      let devices = [];
      let ip = 'my-ip';
      let listDevicesStub;

      beforeEach(function(){
        let MockHarmonyUtils = function() { return stubResolvedPromise(hubResponse)(); }
        listDevicesStub = sinon.stub().callsFake(stubResolvedPromise(devices));
        uut.__set__("HarmonyUtils", MockHarmonyUtils);
        uut.__set__("listDevices", listDevicesStub);
      });

      it("lists devices", function(done){
        uut.init(ip).then(() => { 
          expect(listDevicesStub.calledOnce).toBeTrue();
          done();
        });
      });

      describe("resolving final promise", function(){
        it("has an ip property", function(done){
          uut.init(ip).then((hub) => { 
            expect(hub.ip).toEqual(ip);
            done();
          });
        });

        it("sets initialized to true", function(done){
          uut.init(ip).then((hub) => { 
            expect(hub.initialized).toBeTrue();
            done();
          });
        });

        it("sets the state.devices", function(done){
          uut.init(ip).then((hub) => { 
            expect(hub.state.devices).toEqual(devices);
            done();
          });
        });

        it("sets _hub", function(done){
          uut.init(ip).then((hub) => { 
            expect(hub._hub).toEqual(hubResponse);
            done();
          });
        });

        describe(".deviceById", function(){
          let deviceByIdStub;
          beforeEach(function(){
            deviceByIdStub = sandbox.stub();
            uut.__set__("deviceById", deviceByIdStub);
          });

          it("calls #deviceById", function(done){
            uut.init(ip).then((hub) => { 
              hub.deviceById('123');
              expect(deviceByIdStub.withArgs(hub, '123').calledOnce).toBeTrue();
              done();
            });
          });
        });

        describe(".deviceByName", function(){
          let deviceByNameStub;
          beforeEach(function(){
            deviceByNameStub = sandbox.stub();
            uut.__set__("deviceByName", deviceByNameStub);
          });

          it("calls #deviceByName", function(done){
            uut.init(ip).then((hub) => { 
              hub.deviceByName('123');
              expect(deviceByNameStub.withArgs(hub, '123').calledOnce).toBeTrue();
              done();
            });
          });
        });

        describe(".forceDefaultRemote", function(){
          let forceDefaultRemoteStub;
          beforeEach(function(){
            forceDefaultRemoteStub = sandbox.stub();
            uut.__set__("forceDefaultRemote", forceDefaultRemoteStub);
          });

          it("calls #forceDefaultRemote", function(done){
            uut.init(ip).then((hub) => { 
              hub.forceDefaultRemote();
              expect(forceDefaultRemoteStub.withArgs(hub._hub).calledOnce).toBeTrue();
              done();
            });
          });
        });

        describe(".executeCommand", function(){
          let executeCommandStub;
          beforeEach(function(){
            executeCommandStub = sandbox.stub();
            uut.__set__("executeCommand", executeCommandStub);
          });

          it("calls #executeCommandStub", function(done){
            uut.init(ip).then((hub) => { 
              hub.executeCommand(true, 'TV', 'PowerOff');
              expect(executeCommandStub.withArgs(hub._hub, undefined, true, 'TV', 'PowerOff').calledOnce).toBeTrue();
              done();
            });
          });
        });
      });
    });
  });
}); 
