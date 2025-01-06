BUILD=s3-nginx
APP=s3-nginx-app

SSL_BUILD=ssl-nginx
SSL_APP=ssl-nginx-app

PROXY_BUILD=proxypass-nginx
PROXY_APP=proxypass-nginx-app

DEFAULT_CFG_PATH=/Users/darksied/dev/textshare/nginx-config

pod.run:
	podman build -t $(BUILD) .
	podman build -t $(SSL_BUILD) -f ssl.Dockerfile .

	podman run -d --name $(APP) -p 8083:8083 -v /Users/darksied/dev/textshare/nginx-config/s3:/etc/nginx/conf.d/ $(BUILD)
	podman run -d --name $(SSL_APP) -p 8080:80 -v /Users/darksied/dev/textshare/nginx-config/ssl:/etc/nginx/conf.d/ $(SSL_BUILD)

pod.proxypass.run:
	podman build -t $(PROXY_BUILD) -f proxypass.Dockerfile .
	podman run -d --name $(PROXY_APP) -p 8181:80 -p 8081:8081 -v $(DEFAULT_CFG_PATH)/proxy:/etc/nginx/conf.d $(PROXY_BUILD)

pod.exec:
	podman exec -it $(APP) /bin/bash

pod.stop:
	podman stop $(SSL_APP)
	podman stop $(APP)

pod.clean:
	podman stop $(APP)
	podman rm $(APP)

pod.clean.all: pod.stop
	podman rm $(APP)
	podman rm $(SSL_APP)
	podman rmi $(BUILD)
	podman rmi $(SSL_BUILD)
	podman rm $(PROXY_APP)
	podman rmi $(PROXY_BUILD)

gen.certs:
	mkdir -p nginx-config/certs
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ./nginx-config/certs/privkey.pem \
		-out ./nginx-config/certs/fullchain.pem \
		-subj "/CN=localhost"


build.sender:
	go build -o ./out/sender ./cmd/sender/main.go


build.receiver:
	GOEXPERIMENT=pagetrace go build -o ./out/receiver ./cmd/receiver/main.go


run.tracers: build.sender build.receiver kill.server
	APP_PORT=9091 ./out/receiver  >> ./tmp/receiver.log 2>&1 &
	APP_PORT=9090 TARGET_PORT=9091 ./out/sender >> ./tmp/sender.log 2>&1 &

kill.server:
	ps aux | grep 'out/' | grep -v grep | awk '{print $2}' | xargs kill
