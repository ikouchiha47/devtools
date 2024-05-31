#!/usr/bin/bash

set -e

# Check if the command name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <man-command>"
  exit 1
fi

function kill_server() {
  [[ ! -z "SERVER_PID" ]] && kill -9 "$SERVER_PID"
}

COMMAND="$1"

# Run the Python web server in the background
man "$COMMAND" | python3 manwebpage/server.py &

# Get the PID of the Python web server
SERVER_PID=$!

trap kill_server SIGINT

sleep 2


# Open the web page in the default browser
if which xdg-open > /dev/null
then
  xdg-open "http://localhost:8000/man/pages"
elif which open > /dev/null
then
  open "http://localhost:8000/man/pages"
else
  echo "Could not detect the web browser to use."
fi

# Wait for the user to terminate the script (e.g., by closing the browser or pressing Ctrl+C)
wait $SERVER_PID

