#!/usr/bin/env bash
#
# Berater is a silly script to get reviews for company from linekdin jobs listing
# No fancy selenium, headless, puppermater, and could probably break.
# Hopefully it doesn't
# 
# This is the installer
#
# curl 'https://raw.githubusercontent.com/ikouchiha47/devtools/master/berater/install.sh' | bash -s -- -y
#
set -e

BASE_URL="https://raw.githubusercontent.com/ikouchiha47/devtools/master/berater"

FILES=("cli.js" "server.js" "sniffratings.js" "store.js" "grissmokey.js" "Makefile")

function yes_or_no() {
	while true; do
		read -p "$* [y/N]: " yn
		case $yn in
			[Yy]*) return 0  ;;  
			[Nn]*) echo "Aborted" ; return  1 ;;
			*) echo "Aborting"; return 1 ;;
		esac
	done
}

function install() {
	echo "creating project berater"
	mkdir -p berater
	mkdir -p berater/tmp

	for file in ${FILES[@]}; do
		echo "file $file"
		curl "${BASE_URL}/${file}" -o "berater/${file}"
	done

	echo "project setup done"
	echo "post install instruction to run:"

	if [[ -z "$(which node)" ]]; then
		echo "node js is not found in PATH"
		exit
	fi

	usage
}

function usage() {
	echo "cd berater && PORT=3000 node server.js"
	echo "or"
	echo "cd berater && make run"
	echo "curl localhost:3000/rating?company=Cockroach+Labs"
	echo "to run as cli"
	echo "cd berater && node cli.js -company 'Cockroach Labs' -sp[google|ddg(default)]"
}


AUTO_CONFIRM=0
for arg in "$@"
do
    case $arg in
        -y|--yes)
        AUTO_CONFIRM=1
        shift 
        ;;
    esac
done

echo "installing at $(pwd)/berater"

if [[ $AUTO_CONFIRM -eq 1 ]]; then
    install
else
	yes_or_no && install
fi
