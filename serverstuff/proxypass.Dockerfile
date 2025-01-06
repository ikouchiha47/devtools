FROM nginx

COPY --from=golang:1.23-alpine /usr/local/go/ /usr/local/go/
 
ENV PATH="/usr/local/go/bin:${PATH}"

RUN apt update && apt install -y procps git vim net-tools
ADD ./box.vimrc /.vimrc

COPY ./nginx-config/certs /etc/nginx/certs
COPY ./cmd/echoserver/main.go /app/server/main.go
COPY ./nginx-config/proxy/run.sh /app/server/run.sh

RUN mkdir -p /data/nginx/cache && chown nginx:nginx /data/nginx/cache && chmod 755 /data/nginx/cache

CMD ["/app/server/run.sh"]
