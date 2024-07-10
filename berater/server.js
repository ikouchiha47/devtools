const http = require('http');
const url = require('url');

const { GoogleResults, DDGResults, BreachDetector } = require('./sniffratings');
const Store = require('./store');


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


	// return fetcher.getReviews();
	// Refine google search or google search twice parallely for each

	// Get rating from google search and also try to get rating from website. Combine to average.
	// 
	// GoogleResults.init('Turing').getReviews().
	// 	then(results => results.filter(r => r.status == 'fulfilled')).
	// 	then(results => Promise.allSettled(results.map((r, i) => write(`scraped-${i}.html`, r.value)))).
	// 	catch(err => console.error(err));

}

const requestListener = function(req, res) {
	res.setHeader("Content-Type", "application/json");

	const parsedUrl = url.parse(req.url, true);
	const pathname = parsedUrl.pathname;
	const company = parsedUrl.query.company;
	const sp = parsedUrl.query.sp || 'ddg';

	if (pathname == "/rating") {
		return handleRatingSearch(company, sp).then(result => {
			res.writeHead(200);
			// console.log(result);
			res.end(JSON.stringify({ success: true, result }));
		}).catch(err => {
			res.writeHead(422);
			res.end(`{"error": ${err}, "success": false}`)
		})
	}

	res.end(`{"error": "invalidpath"}`)
};


const server = http.createServer(requestListener);
const port = process.env.PORT || 3000;

store.tryload().then(() => {
	server.listen(port, () => {
		console.log(`Server is running on :${port}`);
	});
})

