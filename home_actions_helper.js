'use strict';

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

module.exports = HomeActionsHelper;
