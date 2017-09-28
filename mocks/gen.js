'use strict';

var Q = require("q");
var md5 = require("md5");
var sha1 = require("sha1");
var request = require("request-promise-native");
var shelljs = require("shelljs");
var actionPackage = require("../action.js");

const INVOCATION = "tell harmony home ci"

if(!process.env.GOOGLE_SAPISID){
  console.log("Missing environment variable: GOOGLE_SAPISID");
  process.exit(1);
}

if(!process.env.GOOGLE_APISID){
  console.log("Missing environment variable: GOOGLE_APISID");
  process.exit(1);
}

if(!process.env.GOOGLE_SID){
  console.log("Missing environment variable: GOOGLE_SID");
  process.exit(1);
}

if(!process.env.GOOGLE_HSID){
  console.log("Missing environment variable: GOOGLE_HSID");
  process.exit(1);
}

if(!process.env.GOOGLE_SSID){
  console.log("Missing environment variable: GOOGLE_HSID");
  process.exit(1);
}

if(!process.env.GOOGLE_APIKEY){
  console.log("Missing environment variable: GOOGLE_APIKEY");
  process.exit(1);
}

const agentInvocation = (query) => {
  return INVOCATION + " " + query;
}

const replaceVariables = (pattern, parameters) => {
  if(!parameters) return pattern;

  const generators = {
    "SchemaOrg_Number" : () => { return Math.floor(Math.random() * 100) }
  }

  parameters.forEach((parameter) => {
    let generator = generators[parameter.type];
    let token = "$" + parameter.type + ":" + parameter.name;
    pattern = pattern.replace(token, generator());
  });
  return pattern
}

const generateQueries = (pattern) => {
  const re = /\((.*?)\)\?/gi
  const cleanSpaces = (s) => {
    return s.replace(/\s\s+/g, ' ').trim();
  }
  let queries = [], matches = [], match;
  while(match = re.exec(pattern) ){
    matches.push(match);
  }
  matches.forEach((match, index) => {
    let perm = pattern;
    matches.forEach((otherMatch, otherIndex) => {
      if(otherIndex == index) return;
      perm = perm.replace(otherMatch[0], otherMatch[1]);
    });
    queries.push(cleanSpaces(perm.replace(match[0], match[1])));
    queries.push(cleanSpaces(perm.replace(match[0], "")));
  });
  return queries;
}

const execRequest = (query) => {
  let url = "https://assistant.clients6.google.com/v1/assistant:converse";
  let origin = "https://console.actions.google.com"

  let key = process.env.GOOGLE_APIKEY;
  let sapisid = process.env.GOOGLE_SAPISID; 
  let apisid = process.env.GOOGLE_APISID;

  let sid = process.env.GOOGLE_SID;
  let hsid = process.env.GOOGLE_HSID;
  let ssid = process.env.GOOGLE_SSID;
 
  let timestamp = Math.floor(Date.now() / 1000);
  let hash = sha1(timestamp + " " + sapisid + " " + origin);
  let headers = {
    "authorization" : `SAPISIDHASH ${timestamp}_${hash}`,
    "cookie" : `SID=${sid}; \
                HSID=${hsid}; \
                SSID=${ssid}; \
                APISID=${apisid}; \
                SAPISID=${sapisid};`,
    "x-origin" : origin,
  }
  let body = {
    "inputType": "KEYBOARD",
    "locale": "en-US",
    "query": agentInvocation(query),
    "surface": "GOOGLE_HOME"
  }
  return request({
    url : url,
    method : "POST",
    qs : { alt: "json", key : key },
    headers : headers,
    json : true,
    body : body
  });
};

let count = 0
actionPackage.actions.map((action, index) => {
  if(!action.intent || !action.intent.trigger || !action.intent.trigger.queryPatterns) return;
  let intent = action.intent.name;
  let parameters = action.intent.parameters;
  let queries = action.intent.trigger.queryPatterns;
  let perms = queries.map(generateQueries).reduce((a,b) => a.concat(b),[]).map((query) => {
    return replaceVariables(query, parameters);
  });;
  
  let path = "/usr/mocks/" + intent.split(".").join("/");
  shelljs.mkdir('-p', path);

  return perms.map((perm) => {
    const hash = md5(agentInvocation(perm))
    execRequest(perm).then((a,b) => {
      let filename = "sample-" + hash + ".json"
      let srcfile = "/usr/mocks/" + filename; 
      let exists = shelljs.test('-e', srcfile)
      let move = shelljs.mv(srcfile, path);
      count++;
      console.log(count, "done - " + perm)
    });
  })
});

