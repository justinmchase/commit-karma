#!/bin/bash
heroku container:login
heroku container:push web
heroku container:release web
