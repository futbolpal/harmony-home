[![Maintainability](https://api.codeclimate.com/v1/badges/48729c036f1c631f98d6/maintainability)](https://codeclimate.com/github/futbolpal/harmony-home/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/48729c036f1c631f98d6/test_coverage)](https://codeclimate.com/github/futbolpal/harmony-home/test_coverage)

# Harmony Hub

This service allows Harmony Hub to be controlled by [Google Actions SDK](https://developers.google.com/actions/).  It fulfills `Intents` that originated from the API.AI application and translates them into Harmony Hub commands

_Thanks to [HarmonyHubUtils](https://github.com/sushilks/harmonyHubUtil)_

## What it does
- Keeps Harmony Hub in a particular activity 'Default' (see below)
- Climate control (IR AC unit)
    - Maintains state of climate control device (Up to 1), enabling commands such as "Set temperature to 75 degrees"
    - Turn on and off device
    - Increase or decrease temperature setting on device
		- Read back current climate device state

## Google Actions via API.AI
See agent/Harmony-Home.zip for versioned intents and entities, however, here is a list of verbal commands that are handled:

- What is the AC set to
- What is the current temperature
- Set the temperature to X degrees
- Set the AC to X degrees
- Set climate to X degrees
- Set climate control to X degrees
- I'm feeling warm
- I'm warm
- I'm roasting
- I'm hot
- It's hot in here
- Make it warmer
- I'm cold
- I'm freezing
- It's cold in here
- Turn off the AC
- Turn on the AC

State management		
- The current temperature is set to X degrees
- Reset climate control to X degrees
- AC reads X degrees
- Climate control reads X degrees
- Climate reads X degrees

## Future Work
I'll be adding an OAuth provider to this project enabling it to handle /ha requests from the Google Home Actions SDK, making it smart home compliant.  This will make the "conversations" more succinct by allowing this service to turn Harmony Hub into a smart home hub device.

## Environment Variables
- `IP` - Public IP Address of Harmony Hub
- `NEW_RELIC_LICENSE_KEY` (optional) - For publishing metrics to NewRelic
- `NEW_RELIC_LOG` (optional) - `stdout` 
- `REDISCLOUD_URL` - URL for Redis instance to maintain Harmony Hub state information

## Harmony Hub Smart Control Conundrum

I purchased the Harmony Hub Smart Control, which has no device mode.  This poses an interesting problem since we use Google Home to do most of our TV watching.  For example, we'll often say "Hey Google, play Narcos from Netflix on the TV".  The above Google Home command will turn on the television (which via HDMI turns on the sound system) and starts playing Narcos.  AWESOME!

The problem is controlling the TV.  Harmony is not aware of any activity currently active.  As a result, the buttons on the remote are useless.  Furthermore, activating the activity toggles a bunch of systems on and off, which is incredibly annoying and time consuming.  To resolve, I created a quick work around, that seems to be working very well.

1.  In addition to other devices, create an additional TV device via the Harmony app on the smartphone.  
2.  Modify the "On" command for the device to be some noop command, in my case this was "."
3.  Modify the "Off" command for the device to be some noop command, in my case this was "."
4.  Create an activity with this device, and call the activity "Default"

This application polls my Harmony Hub every 5 seconds and checks the current activity.  If the activity is "PowerOff" (the read-only activity achieved by telling Google Home to tell harmony home to turn the TV off OR by pressing the off button on the remote), the application will automatically switch the activity to "Default", which has no affect on any devices, but allows the remote control to remain useful.

Note: With the activity set to Default, the Harmony remote automatically maps the following buttons:
- Play
- Pause
- Stop
- Volume +
- Volume -

### Google Home Limitations
Currently, the Google Actions SDK only supports Lights and Thermostat schemas.


## CI

Required Environment Variables
- `GOOGLE_APISID`
- `GOOGLE_SAPISID`
- `GOOGLE_APIKEY`
- `GOOGLE_HSID`
- `GOOGLE_SSID`
- `GOOGLE_SID`

These can be obtained by capturing a cURL command made in the simulator

```
curl 'https://assistant.clients6.google.com/v1/assistant:converse?alt=json&key=<GOOGLE_APIKEY>' 
  -H 'x-requested-with: XMLHttpRequest' 
  -H 'origin: https://assistant.clients6.google.com' 
  -H 'accept-encoding: gzip, deflate, br' 
  -H 'x-origin: https://console.actions.google.com' 
  -H 'accept-language: en-US,en;q=0.8,de;q=0.6' 
  -H 'authorization: SAPISIDHASH <redacted>' 
  -H 'x-chrome-uma-enabled: 1' 
  -H 'cookie: SID=<GOOGLE_SID>; HSID=<GOOGE_HSID>; SSID=<GOOGLE_SSID> APISID=<GOOGLE_APISID>; SAPISID=<GOOGLE_SAPISID>; S=photos_html=<redacted>; NID=<redacted>; 1P_JAR=2017-9-27-23; SIDCC=<redacted>' 
  -H 'x-client-data: <redacted>' 
  -H 'x-goog-authuser: 0' 
  -H 'x-clientdetails: appVersion=5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_12_6)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F60.0.3112.113%20Safari%2F537.36&platform=MacIntel&userAgent=Mozilla%2F5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_12_6)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F60.0.3112.113%20Safari%2F537.36' 
  -H 'x-goog-encode-response-if-executable: base64' 
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36' 
  -H 'content-type: application/json' 
  -H 'accept: */*' 
  -H 'referer: https://assistant.clients6.google.com/static/proxy.html?usegapi=1&jsh=m%3B%2F_%2Fscs%2Fabc-static%2F_%2Fjs%2Fk%3Dgapi.gapi.en.ZPSwvoEq44A.O%2Fm%3D__features__%2Fam%3DAAg%2Frt%3Dj%2Fd%3D1%2Frs%3DAHpOoo8-JL5R4cxPdwFdZ0Yu3_ek27rKCQ' 
  -H 'authority: assistant.clients6.google.com' 
  -H 'x-javascript-user-agent: google-api-javascript-client/1.1.0' 
  -H 'x-referer: https://console.actions.google.com' --data-binary '{"conversationToken":"","debugLevel":1,"inputType":"KEYBOARD","locale":"en-US","mockLocation":{"city":"Mountain View","coordinates":{"latitude":37.421980615353675,"longitude":-122.08419799804688},"formattedAddress":"Googleplex, Mountain View, CA 94043, United States","zipCode":"94043"},"query":"tell harmony home ci to turn up the temperature","surface":"PHONE"}' --compressed
```
