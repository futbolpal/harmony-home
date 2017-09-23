'use strict';

const Q = require('q');

const HomeActionsHelper = {};

HomeActionsHelper.createSimpleReply = (conversationToken, text) => {
  return {
    conversation_token: conversationToken,
    expect_user_response: false,
    final_response: {
      speech_response: {
        text_to_speech: text
      }
    }
  };
}

HomeActionsHelper.repeatCommands = (times, delay, commandFn) => {
  let commands = new Array(times).fill(() => { 
    return Q.delay(delay).then(commandFn);
  });
  return commands.reduce(Q.when, Q([]));
}
module.exports = HomeActionsHelper;
