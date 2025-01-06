package utils

import "log"

func Must(val any, err error) any {
	if err != nil {
		log.Fatal(err)
	}

	return val
}
