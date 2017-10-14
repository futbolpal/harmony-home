#!/bin/sh
set -xe 
node $PACKAGE_GENERATOR && ./gactions test --action_package action.json --project $PROJECT_ID 
