#!/bin/sh
set -xe 

node action.js && ./gactions update --action_package action.json --project $PROJECT_ID 
