#!/usr/bin/env bash
echo "Deploying..."

# Build
if ! [ -d node_modules ]; then
  npm i
fi

if ! [ -d dist ]; then
  npm run build
fi

# Create Docker Image and Push
heroku container:login
heroku container:push web
heroku container:release web
