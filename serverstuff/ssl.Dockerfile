FROM nginx

RUN apt update && apt install -y procps git vim net-tools
ADD ./box.vimrc /.vimrc

COPY ./nginx-config/certs /etc/nginx/certs

RUN mkdir -p /data/nginx/cache && chown nginx:nginx /data/nginx/cache && chmod 755 /data/nginx/cache
