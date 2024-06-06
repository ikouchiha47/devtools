#!/usr/bin/env bash
#
#
#

dir="$1"
header=$(printf '%0.s-' {1..80})
cmd_list=$(source "$dir/runner.sh")

selected=""
echo "$cmd_list" | fzf \
    --border=bottom \
    --color=bg+:-1 \
    --info=hidden \
    --reverse \
    --header="$header" \
    --bind "ctrl-\:reload(bash ${dir}/runner.sh $dir apps)" \
    --bind "enter:execute(bash ${dir}/runner.sh $dir {})"

