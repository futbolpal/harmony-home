'use strict';

if(!process.env.DEPLOY_DOMAIN){
  console.log("Missing environment variable: DEPLOY_DOMAIN (https://myapp.com)");
  process.exit(1);
}
if(!process.env.GOOGLE_CLIENT_ID){
  console.log("Missing environment variable: GOOGLE_CLIENT_ID (only first segment before '.')");
  process.exit(1);
}
if(!process.env.GOOGLE_CLIENT_SECRET){
  console.log("Missing environment variable: GOOGLE_CLIENT_SECRET");
  process.exit(1);
}

const accountLinking = {
  "clientId": process.env.GOOGLE_CLIENT_ID,
  "clientSecret": process.env.GOOGLE_CLIENT_SECRET,
  "grantType": "AUTH_CODE",
  "authenticationUrl": process.env.DEPLOY_DOMAIN + "/auth",
  "accessTokenUrl": process.env.DEPLOY_DOMAIN + "/token",
  "scopes": ["profile","email"],
  "scopeExplanationUrl": "",
  "assertionTypes": ["ID_TOKEN"]
}

const AccountLinking = { accountLinking };
module.exports = AccountLinking
