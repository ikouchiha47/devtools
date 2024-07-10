const { GoogleResults, BingResults, DDGResults, BreachDetector } = require('./sniffratings');
const Store = require('./store');

function parseArguments(args) {
	const argsMap = {};
	let currentKey = null;

	for (let i = 2; i < args.length; i++) {
		const arg = args[i];

		if (arg.startsWith('-')) {
			currentKey = arg.slice(1);
			argsMap[currentKey] = true;
		} else if (currentKey) {
			argsMap[currentKey] = arg;
			currentKey = null;
		}
	}

	return argsMap;
}

const store = Store.init("berater", { reviews: [] })

function handleRatingSearch(company, sp) {
	company = company.trim();

	if (!company) return Promise.reject('empty_content')

	let fetcher = { getReviews: () => Promise.reject("invalid_search_provider") }
	if (sp == 'google') {
		fetcher = GoogleResults.init(company)
	} else if (sp == 'ddg') {
		fetcher = DDGResults.init(company)
	}

	let data = store.get('reviews', company)
	if (data) {
		// console.log("resolving from disk")
		return Promise.resolve(data)
	}

	let breacher = BreachDetector.init(fetcher);

	return Promise.allSettled([fetcher.getReviews(), breacher.detect(company)]).
		then(results => {
			let [ratingsState, breachedState] = results;
			let response = { ratings: [], breached: false };

			// console.log(results);
			if (ratingsState.status === 'fulfilled')
				response.ratings = ratingsState.value

			if (breachedState.status === 'fulfilled')
				response.breached = breachedState.value

			// console.log(response);

			store.set('reviews', company, response)
			return response;
		});
}

async function main() {
	await store.tryload();
	const argsMap = parseArguments(process.argv);

	if (!argsMap.company) {
		console.error('Error: Company name is required. Use -company option.');
		return;
	}

	const company = argsMap.company;
	const sp = argsMap.search || 'ddg';

	try {
		const ratings = await handleRatingSearch(company, sp);
		console.log(`Ratings for ${company}:`, ratings);
		await store.flush();
		store.stop();
	} catch (error) {
		console.error('Error retrieving ratings:', error);
	}

}

main().then(() => { process.exit(0) });
