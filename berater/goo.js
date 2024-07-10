// #!/usr/bin/env node

const { GoogleResults } = require('./sniffratings');

if (process.argv.length < 2) {
	console.log("need to pass query")
	process.exit(1)
}

const query = process.argv[2]
console.log(`Q: ${query}`);

GoogleResults.init('').
	search(query).
	then(console.log.bind(console)).
	catch(console.error.bind(console))

