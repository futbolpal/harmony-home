'use strict';

const fs = require('fs');
const { accountLinking } = require('./action_account_linking');

if(!process.env.DEPLOY_DOMAIN){
  console.log("Missing environment variable: DEPLOY_DOMAIN (https://myapp.com)");
  process.exit(1);
}

const actionPackage = {
  "actions": [
  {
    "name": "actions.devices",
    "deviceControl": {
    },
    "fulfillment": {
      "conversationName": "automation"
    }
  }],
  "conversations": {
    "automation" :
    {
      "name": "automation",
      "url": process.env.DEPLOY_DOMAIN + "/ha"
    }
  },
  "accountLinking" : accountLinking
}

const content = JSON.stringify(actionPackage);
fs.writeFile("action.json", content, 'utf8', function (err) {
  if (err) {
    return console.log(err);
  }
  console.log("action.json package generated");
}); 
