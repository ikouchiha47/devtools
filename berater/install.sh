#!/usr/bin/env bash
#
# download url
#
BASE_URL="https://raw.githubusercontent.com/ikouchiha47/devtools/master/berater"

FILES=("cli.js" "server.js" "sniffratings.js")

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

	for fils in "${FILES[@]}"; do
		curl "${BASE_URL}/file" -o "berater/${file}"
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
	echo "curl localhost:3000/rating?company=Cockroach+Labs"
	echo "to run as cli"
	echo "cd berater && node cli.js -company 'Cockroach Labs' -sp[google|ddg(default)]"
}

echo "installing at $(pwd)/berater"

yes_or_no && install
