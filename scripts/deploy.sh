#!/bin/bash
# Install and Setup Heroku
gem install heroku
heroku container:login

# Build
npm ci
npm run build

# Create Docker Image and Push
heroku container:push web
heroku container:release web
