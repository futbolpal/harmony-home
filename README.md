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



