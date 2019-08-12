#!/bin/bash

heroku git:remote -a commit-karma
heroku container:login
heroku container:push web
heroku container:release web

