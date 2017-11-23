'use strict';

const util = require('util');
const Crypto = require('crypto');
const GoogleAuth = require('google-auth-library');
const RedisClient = require('../redis_client');
const Q = require('q');

const OAuth = {}

const generateIndex = () => {
  return Crypto.randomBytes(16).toString('base64');
};

const upsertAuth = (code,data) => {
  RedisClient.set(`oauth:${code}`, JSON.stringify(data));
};

const retrieveAuth = (code) => {
  const d = Q.defer();
  RedisClient.get(`oauth:${code}`, (error, reply) => {
    if(error) d.reject(error);
    if(reply) d.resolve(JSON.parse(reply));
    d.resolve(null);
  });
  return d.promise;
};

const verifyToken = (data) => {
  console.log("I should verify", data);
  //TODO: Verify client id
  //TODO: Verify user 
  //TODO: Verify token type
  //TODO: Verify user access
}

const handleAuthCode = (client_id, client_secret, code, reply) => {
  let access_token = generateIndex();
  let refresh_token = generateIndex();
  let expiry = new Date(Date.now() + (60 * 10000)); 
  return retrieveAuth(code).then((user) => {
    verifyToken(user);

    upsertAuth(access_token, {
      type: 'ACCESS',
      uid: user.uid,
      client_id: client_id,
      expires_at: expiry
    });

    upsertAuth(refresh_token, {
      type: 'REFRESH',
      uid: user.uid,
      client_id: client_id,
      expires_at: expiry
    });

    let replyData = {
      token_type: "bearer",
      access_token: access_token,
      refresh_token: refresh_token,
      expires_in: 7200
    }
    return reply.json(replyData);
  });
};

const handleRefreshToken = (client_id, client_secret, refresh_token, reply) => {
  let access_token = generateIndex();
  let expiry = new Date(Date.now() + (60 * 10000)); 
  return retrieveAuth(refresh_token).then((user) => {
    verifyToken(user);
    
    upsertAuth(access_token, {
      type: 'ACCESS',
      uid: user.uid,
      client_id: client_id,
      expires_at: expiry
    });

    return reply.json({
      token_type: "bearer",
      access_token: access_token,
      expires_in: 7200
    });
  });
};

OAuth.verifyToken = (id_token, audience_id) => {
  const d = Q.defer();

  let client_id = process.env.GOOGLE_CLIENT_ID + ".apps.googleusercontent.com";
  let auth = new GoogleAuth;
  let client = new auth.OAuth2(client_id, '', '');
  client.verifyIdToken(id_token, audience_id || client_id, (e, login) =>{
    if(e) return d.reject(e);
    return d.resolve(login);
  });
  return d.promise;
}

OAuth.register = (server) => {
  server.get('/auth', function(request, reply) {
    console.log("GET /auth");
    let redirect_uri = request.query.redirect_uri;
    let client_id = request.query.client_id || process.env.GOOGLE_CLIENT_ID;
    let response_type = request.query.response_type || 'code';
    let state = request.query.state;
  
    return reply.render('login', {
      client_id: client_id,
      state: state,
      redirect_uri: encodeURIComponent(redirect_uri)
    });
  });

  server.post('/login', function(request, reply) {
    console.log("POST /login");
    let redirect_uri = request.body.redirect_uri;
    let state = request.body.state;
    let id_token = request.body.idtoken;
    OAuth.verifyToken(id_token).then((tokenInfo) => {
      let client_id = process.env.GOOGLE_CLIENT_ID;
      let google_user_id = tokenInfo.getUserId();
      let auth_code = generateIndex();
      upsertAuth(auth_code,{
        type: 'AUTH_CODE',
        uid: google_user_id,
        client_id: client_id,
        expires_at: new Date(Date.now() + (60 * 10000))
      });
      return reply.redirect(util.format('%s?code=%s&state=%s',
            decodeURIComponent(redirect_uri), auth_code, state)
          );
    });
  });

  server.all('/token', function(request, reply) {
    console.log("POST /token");
    let payload = Object.assign({}, request.query, request.body);
    let client_id = payload.client_id;
    let client_secret = payload.client_secret;
    let grant_type = payload.grant_type;
    if ('authorization_code' == grant_type) {
      let code = payload.code;
      return handleAuthCode(client_id, client_secret, code, reply);
    } else if ('refresh_token' == grant_type) {
      let refresh_token = payload.refresh_token;
      return handleRefreshToken(client_id, client_secret, refresh_token, reply);
    } else {
      reply("error");
    }
  });

  server.get('/oauth-playground-test', function(request, reply) {
    console.log("GET /oauth-playground-test");

    let code = request.headers.authorization.replace("Bearer ", "");
    return retrieveAuth(code).then((user) => {
      if(user) return reply(user);
      return reply("Unauthorized");
    }, (error) => {
      reply(error);
    });
  }); 
}

module.exports = OAuth;
