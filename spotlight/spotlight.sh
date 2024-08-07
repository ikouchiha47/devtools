#!/usr/bin/env bash

# Install rxvt-unicode if not already installed
# sudo dnf install rxvt-unicode

# Check if urxvtd is running, if not start it
running=$(ps aux | grep urxvtd | grep -v grep)
if [[ -z "$running" ]]; then
    urxvtd -q -o -f
fi

d=$(cd `dirname $0` && pwd -P)
urxvt_id="URxvtFuzzy"

# Get the mouse position to determine the active monitor
eval $(xdotool getmouselocation --shell)

# Get information about all connected monitors
mapfile -t monitors < <(xrandr --current | grep -w "connected" | sed -n 's/\([^ ]*\) connected \(primary \)\?\([^ ]*\).*/\1 \3/p')

# Find the active monitor based on mouse position
for monitor in "${monitors[@]}"; do
    read -r name geometry <<< "$monitor"
    if [[ "$geometry" == "primary" ]]; then
        continue  # Skip to next iteration if geometry is "primary"
    fi
    if [[ "$geometry" =~ ^[0-9]+x[0-9]+\+[0-9]+\+[0-9]+$ ]]; then
        IFS='+x' read -ra dims <<< "$geometry"
        mon_width=${dims[0]}
        mon_height=${dims[1]}
        mon_x=${dims[2]}
        mon_y=${dims[3]}
    else
        # For displays without position info (like laptop display), use full resolution
        IFS='x' read -ra dims <<< "$geometry"
        mon_width=${dims[0]}
        mon_height=${dims[1]}
        mon_x=0
        mon_y=0
    fi
    
    if ((X >= mon_x && X < mon_x + mon_width && Y >= mon_y && Y < mon_y + mon_height)); then
        active_mon_x=$mon_x
        active_mon_y=$mon_y
        active_mon_width=$mon_width
        active_mon_height=$mon_height
        break
    fi
done

# terminal character width height, set by manual testing
terminal_width=1000
terminal_height=400

pos_x=$((active_mon_x + (active_mon_width - terminal_width) / 2))
pos_y=$((active_mon_y + (active_mon_height - terminal_height) / 2))

# Ensure pos_x and pos_y are not negative
pos_x=$((pos_x < 0 ? 0 : pos_x))
pos_y=$((pos_y < 0 ? 0 : pos_y))

# Check if the terminal is already open
is_spotlight_on=$(xdotool search --classname "$urxvt_id")

if [[ ! -z "$is_spotlight_on" ]]; then
    # If terminal is open, activate it and move it to the active monitor
    xdotool windowactivate "$is_spotlight_on"
    xdotool windowmove "$is_spotlight_on" $pos_x $pos_y
else
    # If terminal is not open, launch it on the active monitor
    urxvtc -name "$urxvt_id" -geometry 80x8+${pos_x}+${pos_y} -e sh -c "$d/run.sh $d"
fi
