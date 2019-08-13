#!/usr/bin/env bash
echo "Deploying..."

# Build
if ! [ -d node_modules ]; then
  npm ci
fi

if ! [ -d dist ]; then
  npm run build
fi

# Create Docker Image and Push
npx heroku container:login
npx heroku container:push web
npx heroku container:release web
