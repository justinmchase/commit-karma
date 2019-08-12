#!/bin/bash

echo "Connecting to heroku..."
heroku git:remote -a commit-karma
heroku container:login

echo "Publishing container..."
heroku container:push web
heroku container:release web
