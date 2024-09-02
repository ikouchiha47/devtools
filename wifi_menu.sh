#!/usr/bin/env bash

# set -x  # Enable debugging

set -e

debug() {
	if [[ "$MODE" == "debug" ]]; then
		printf "DEBUG: %s\n" "$@"
	fi
}

function scan_and_select() {
    debug "Entering scan_and_select function"

    while true; do
        # Perform the scan
        wpa_cli scan > /dev/null 2>&1
        sleep 2

        # Capture scan results and filter out empty lines
        SSID=$(wpa_cli scan_results | awk 'NR > 2 {print $5}' | grep -v '^[[:space:]]*$' | fzf --prompt="Select SSID: ")

        # Check if an SSID was selected
        if [[ -n "$SSID" ]]; then
            debug "Selected SSID: $SSID"
            echo "$SSID"
            return 0  # Exit function with success
        else
            debug "No SSID selected. Refreshing..."
            echo "No SSID selected. Refreshing..."
            # Optionally add a short sleep or delay before the next scan
            sleep 1
        fi
    done
}

# function scan_and_select() {
#   debug "Entering scan_and_select function"
#
#   wpa_cli scan > /dev/null 2>&1
#   sleep 2
#
#   SSID=$(wpa_cli scan_results | awk 'NR > 2 {print $5}' | tail -n +3 | fzf --prompt="Select SSID: ")
#
#   if [[ -z "$SSID" ]]; then
#     echo "No SSID selected. Exiting..."
#     exit 1
#   fi
#   # debug "Selected SSID: $SSID"
#   echo "$SSID"
# }

function setup_network() {
  debug "Entering setup_network function"
  SSID="$1"
  debug "Setting up network for SSID: $SSID"
  
  NETWORK_ID=$(wpa_cli list_networks | grep -wF "$SSID" | awk '{print $1}')
  debug "Selected NID $NETWORK_ID"
  
  if [[ -z "$NETWORK_ID" ]]; then
    debug "Network not configured, asking for password"
    read -p "Enter password for $SSID: " PASSWORD
    echo  # Add a newline after password input
    
    NETWORK_ID=$(wpa_cli add_network | tail -n 1 | grep -o '[0-9]*')
    echo "New network ID: $NETWORK_ID $SSID $PASSWORD"
    
    wpa_cli set_network $NETWORK_ID ssid "\"$SSID\"" &> /dev/null

    debug "set network password"
    wpa_cli set_network $NETWORK_ID psk "\"$PASSWORD\"" &> /dev/null
    wpa_cli enable_network $NETWORK_ID &> /dev/null
    wpa_cli save_config &> /dev/null

    debug "Config set"
  # else
  #   echo "DEBUG: Network already configured"
  fi
  
  debug "Returning NETWORK_ID: $NETWORK_ID"
  debug "++++"
  echo "$NETWORK_ID"
  debug "+++++"
}

function disconnect_and_reset() {
  debug "Entering disconnect_and_reset function"
  NETWORK_ID="$1"
  echo "8888888888 $NETWORK_ID"
  wpa_cli disconnect
  wpa_cli select_network $NETWORK_ID
  wpa_cli reconnect
}

MODE=debug
SSID=$(scan_and_select)

debug "Selected network $SSID"

debug "Calling setup_network"
NETWORK_ID=$(setup_network "$SSID")
debug "Returned from setup_network, NETWORK_ID: $NETWORK_ID"

# disconnect_and_reset "$NETWORK_ID"
