#!/bin/sh
set -xe 

node $PACKAGE_GENERATOR && ./gactions update --action_package action.json --project $PROJECT_ID 
