set -xe 

node action.js && ./gactions test --action_package action.json --project $PROJECT_ID 
