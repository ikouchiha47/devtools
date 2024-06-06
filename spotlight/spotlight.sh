#!/usr/bin/env bash
#
#
# sudo dnf install rxvt-unicode

running=$(ps aux | grep urxvtd | grep -v grep)
if [[ -z "$running" ]]; then
   urxvtd -q -o -f
fi

d=$(cd `dirname $0` && pwd -P)
echo "$d"

urxvtc -name URxvtFuzzy -geometry 80x8+500+500 -e sh -c "$d/run.sh $d"
