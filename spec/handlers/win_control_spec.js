'use strict'

const rewire = require('rewire')
const sinon = require('sinon')
const uut = rewire('../../handlers/win_control')

describe('WinControl', function () {
  let sandbox;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe("handler name", function(){
    it("is win_control", function(){
      expect(uut.__get__("HandlerName")).toEqual("win_control");
    });
  });

  describe("intent group", function(){
    it("is defined", function(){
      expect(uut.__get__("Intents").INTENT_GROUP_WIN_CONTROL).toBeArray();
    });
  });
  
  describe("private methods", function(){
    describe("#handleWol", function(){
      let handleWol = uut.__get__("handleWol");
      let hubState = { ip: 'my-ip' }
      let device = { mac: 'my-mac' }
      let wakeStub;

      beforeEach(function(){
        wakeStub = sandbox.stub();
        uut.__set__("Wol", { wake: wakeStub });
      });

      afterEach(function(){
      }); 

      it("is called with the right mac and ip address", function(){
        handleWol(hubState, device);
        expect(wakeStub.withArgs(device.mac, {address: hubState.ip}).calledOnce).toBeTrue();
      });
    });

    describe("#handlwWinControl", function(){
      let handleWinControl = uut.__get__("handleWinControl");
      let createSimpleReplyStub;

      let request, reply;
      let intent;
      let user;
      let hubState;
      let context;
      let device;
      let expectedSpeech;

      beforeEach(function(){
        createSimpleReplyStub = sandbox.stub();
        uut.__set__("createSimpleReply", createSimpleReplyStub);
        reply = { json : sandbox.stub() }
        request = sandbox.stub();
        device = {};
        hubState = { deviceByName: sandbox.stub().returns(device) };
        user = { deviceByHandler: sandbox.stub().returns(device) };
        intent = { intent: 'real-intent'};
        context = () => { return { intent, user, hubState } }; 
      });

      afterEach(function(){
        handleWinControl(context(), request, reply); 
        expect(
            createSimpleReplyStub.withArgs(
              sinon.match.any, expectedSpeech
              ).calledOnce
            ).toBeTrue();
      });
      
      describe("when intent is found", function(){
        let intentsMock, intentsMap;

        beforeEach(function(){
          intentsMock = {};
          intentsMock.INTENT_WIN_CONTROL_TEST    = intent.intent;
          intentsMock.INTENT_GROUP_WIN_CONTROL = [ intentsMock.INTENT_WIN_CONTROL_TEST ];

          intentsMap = {};
          intentsMap[intentsMock.INTENT_WIN_CONTROL_TEST] = { 
            command: sandbox.stub(), 
            response: 'Hi' 
          };
          uut.__set__("Intents", intentsMock);
          uut.__set__("intentMap", intentsMap);
        });

        it("responds wth intent map response", function(){
          expectedSpeech = 'Hi';
        });
      });

      describe("when intent not found", function(){
        beforeEach(function(){
          intent = { intent: 'not-found'};
        });

        it("responds with 'Intent could not be handled'", function(){
          expectedSpeech = 'Intent could not be handled';
        });
      });
    });
  });
})
