'use strict';

const Wol         = require('wake_on_lan');
const Intents     = require('../intents');
const { createSimpleReply } = require('../home_actions_helper');

const HandlerName = 'win_control';

Intents.INTENT_WIN_CONTROL_WOL = "com.harmony-home.intent.win.wol";

Intents.INTENT_GROUP_WIN_CONTROL = [
  Intents.INTENT_WIN_CONTROL_WOL         
];

const handleWol = (hubState, device) => {
  Wol.wake(device.mac, {address: hubState.ip}, (error) =>{
    if(error) { console.log('wol error', error) }
    else { console.log('wol successful') }
  })
}

const intentMap = {};
intentMap[Intents.INTENT_WIN_CONTROL_WOL] = { command : handleWol, response: "Ok" };

const handleWinControl = (context, request, reply) => {
  let {hubState, intent, user, conversationToken} = context;
  let intentName = intent.intent;
  
  let deviceConfiguration = user.deviceByHandler(HandlerName);

  if(!intentMap[intentName]) { 
    return reply.json(createSimpleReply(
          conversationToken, 
          'Intent could not be handled'
          ));
  }

  let command = intentMap[intentName].command;
  let intentResponse = intentMap[intentName].response;
  command(hubState, deviceConfiguration);
  return reply.json(createSimpleReply(conversationToken, intentResponse));
};

module.exports = handleWinControl;
