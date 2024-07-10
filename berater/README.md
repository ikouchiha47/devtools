#rating sniffer

sniffs rating from ambitionbox and glassdoor

# Requires

- nodejs

# install

`curl 'https://raw.githubusercontent.com/ikouchiha47/devtools/master/berater/install.sh' | bash -s -- -y`

# Cli

```shell
node cli.js -company 'Name of Company' [-search ddg/google]
```

# Server

```shell
node server.js

curl 'localhost:3000/rating?company=Nameof+Company&sp=ddg'
```

However, I do recommend using pm2 to run them without much hassel:

```shell
make run

# PORT=4000 make run
# make cleanup # to stop and clear config
```

# Greasemonkey

Script has been provided at `./grissmonkey.js`, you know what to do.
