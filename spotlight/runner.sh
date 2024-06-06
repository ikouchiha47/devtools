#!/usr/bin/env bash
#
#
# google_search() {
#     query=$(echo "$1" | sed 's/^g! //')
#     firefox "https://www.google.com/search?q=${query}" &
# }
#
# calculate() {
#     expression="${1#calc }"
#     result=$(echo "$expression" | bc -l)
#     echo "Result: $expression = $result"
# }

list_cmds() {
    cmd_list=$(compgen -c | grep '\w' | sort -u)
    echo "$cmd_list"
}

list_apps() {
    # scripts=$(find ./spotscripts -type f | sort -u)
    scripts=$(ls "${dir}/spotscripts" | sort -u)
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

dir="$1"
shift

input="$@"

if [[ "$input" == "apps" ]]; then
    list_apps
elif [[ "$input" == "google" ]]; then
    read -p "query: " query
    bash "${dir}/spotscripts/google" "$query"
    clear
else
    list_cmds
fi
