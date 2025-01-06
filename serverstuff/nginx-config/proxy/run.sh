#!/bin/bash

go run /app/server/main.go &
nginx -g "daemon off;"
