set -xe 

open "https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=$CLIENT_ID.apps.googleusercontent.com&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fassistant+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Factions.builder&state=state"
node action.js
./gactions test --action_package action.json --project $PROJECT_ID 
