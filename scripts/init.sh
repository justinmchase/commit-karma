#!/bin/bash

# Install heroku cli
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Configure this repo to point to the right app in heroku
heroku git:remote -a commit-karma