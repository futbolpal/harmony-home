'use strict';

const NewRelic = require('newrelic');
const RedisClient = require('./redis_client');
const HubState = require('./hub_state');
const TvControl = require('./handlers/ha_tv_control');
const OAuth = require('./services/oauth');
const User = require('./models/user');
const HomeAutomation = {}

HomeAutomation.register = (server) => {
  server.post('/ha', handleHomeAutomation);
}

const getAccessToken = (request) => {
  return request.headers.authorization.split(' ')[1];
}

const handleHomeAutomation = (request, response) => {
  let accessToken = getAccessToken(request);
  console.log("------------  New Smart Device Action ---------------");
  console.log('headers', request.headers);
  console.log('body', JSON.stringify(request.body));
  console.log('token', accessToken);

  const withUser = (tokenData) => {
    return User.find(tokenData.uid).then((user) => {
      let ip = user.attributes.hubState.ip;
      return HubState.init(ip).then((hub) => {
        processHomeAutomation(request, response, hub, user);
      });
    }, () => { return requireConfiguration(request, response); });
  }
  const withoutUser = () => {
    return askForSignIn(request, response);
  }
  return OAuth.retrieveAuth(accessToken).then(withUser, withoutUser);
}

const processHomeAutomation = (request, response, hub, user) => {
  for(let i = 0; i < request.body.inputs.length; i++){
    let input = request.body.inputs[i];
    let intent = input.intent;
    switch(intent){
      case "action.devices.SYNC":
        return HomeAutomation.sync({hub, user}, request, response);
      case "action.devices.QUERY":
        return HomeAutomation.query({hub, user}, request, response);
      case "action.devices.EXECUTE":
        return HomeAutomation.exec({hub, user}, request, response);
    }
  }
}

HomeAutomation.sync = (context, request, reply)=> {
  console.log("GET /sync");
  let { user, hub } = context;
  let requestId = request.body.requestId;
  let devices = user.attributes.devices.map((d) => {
    let device = hub.deviceByName(d.name);
    let { name, home_automation } = d;
    return new HarmonyDevice(device.id, name, home_automation).json;
  });
  let deviceProps = { requestId, payload: { devices }}
  console.log("SYNC response: ", JSON.stringify(deviceProps));
  return reply.json(deviceProps);
}

HomeAutomation.query = (context, request, reply)=> {
  console.log("GET /query");
  let { user, hub } = context;
  
  let requestId = request.body.requestId;
  let devices = request.body.inputs.map((input) => { 
    return input.payload.devices.map((d) => { 
      let device = hub.deviceById(d.id);
      let { name, home_automation } = user.deviceByName(device.label);
      return new HarmonyDevice(d.id, name, home_automation).json;
    })
  })
  let deviceProps = { requestId, payload: { devices } }
  console.log("QUERY response: ", JSON.stringify(deviceProps));
  return reply.json(deviceProps);
}

HomeAutomation.exec = (context, request, response) => {
  console.log('POST /exec');
  console.log('commands', JSON.stringify(request.body.inputs[0].payload.commands));
  let { hub, user } = context;
  let intent = request.body.inputs[0].payload;
  let device = intent.commands[0].devices[0];
  let execution = intent.commands[0].execution[0];

  let adapted_context = {
    hub: hub,
    user: user,
    device: hub.deviceById(device.id),
    intent: execution.command,
    execution: execution
  }
  TvControl(adapted_context, request, response);
  return response.json({});     
}

class HarmonyDevice {
  constructor(id, name, schema){
    this.id = id;
    this.name = name;
    this.schema = schema; 
  }

  get json() {
    let baseData =  {
      id : this.id,
      name : {
        name : this.name
      }
    }
    return Object.assign({}, baseData, this.schema);
  }
}

module.exports = HomeAutomation;
