const { GoogleResults, BingResults, DDGResults } = require('./sniffratings');

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

function handleRatingSearch(company, sp) {
	company = company.trim();

	if (!company) return Promise.reject('empty_content')

	let fetcher = { getReviews: () => Promise.reject("invalid_search_provider") }
	if (sp == 'google') {
		fetcher = GoogleResults.init(company)
	} else if (sp == 'ddg') {
		fetcher = DDGResults.init(company)
	}

	return fetcher.getReviews();
}

async function main() {
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
	} catch (error) {
		console.error('Error retrieving ratings:', error);
	}
}

main()
