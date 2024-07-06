#!/usr/bin/env bash
#
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

run_app() {
    app="$1"
    shift

    bash "${dir}/spotscripts/${app}" "$@"
}


case "$input" in
    apps)
        list_apps
        ;;

    google)
        read -p "query: " query
        echo "$query" | run_app "google"
        read -r
        ;;

    calculate)
        read -p "= " expr
        echo "$expr" | run_app "calculate"
        read -r
        ;;

    hextodec)
        read -p "= " expr
        echo "$expr" | run_app "hextodec"
        read -r
        ;;
    findfiles)
        read -p "$> " expr
        echo "$expr" | run_app "findfiles" ~/Downloads/ ~/Desktop/
        ;;
    *)
        list_cmds
        ;;
esac

