#!/usr/bin/env bash
#
#
google_search() {
    query=$(echo "$1" | sed 's/^g! //')
    firefox "https://www.google.com/search?q=${query}" &
}

# Function to perform inline calculation
calculate() {
    expression="${1#calc }"
    result=$(echo "$expression" | bc -l)
    echo "Result: $expression = $result"
}

list_cmds() {
    cmd_list=$(compgen -c | grep '\w' | sort -u)
    echo "$cmd_list"
}

list_apps() {
    # scripts=$(find ./spotscripts -type f | sort -u)
    scripts=$(ls ./spotscripts | sort -u)
    echo "$scripts"
}

list_all() {
    scripts="$@"
    all_scripts=""

    for arg in "$@"; do
        all_scripts+="$arg"$'\n'
    done
    echo -e "$all_scripts"
}

input="$@"

if [[ "$input" == "apps"  ]]; then
    list_apps
else
    echo "$input" > loll
    list_cmds
fi
