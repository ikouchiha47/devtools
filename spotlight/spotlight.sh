#!/usr/bin/env bash
#
#
# sudo dnf install rxvt-unicode

running=$(ps aux | grep urxvtd | grep -v grep)
if [[ -z "$running" ]]; then
   urxvtd -q -o -f
fi

d=$(cd `dirname $0` && pwd -P)
urxvt_id="URxvtFuzzy"


is_spotlight_on=$(xdotool search --classname "$urxvt_id")

if [[ ! -z "$is_spotlight_on" ]]; then
   xdotool windowactivate "$is_spotlight_on"
else
   urxvtc -name "$urxvt_id" -geometry 80x8+600+500 -e sh -c "$d/run.sh $d"
fi

