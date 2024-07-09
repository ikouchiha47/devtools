const toTuringRx = (company) => new RegExp(`${company.toLowerCase()}-reviews$`);
const toGlassRx = (company) => new RegExp(`${company}-Reviews-`, 'i');

let agents = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.3",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.3",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.3",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.",
]

const ua = {
	"User-Agent": agents[Math.floor(Math.random() * 10) % 6]
}

const search = (company, url, query) => {
	const searchURL = `${url}=${query.replaceAll(" ", "+")}`;
	log.off("final url ", searchURL, { headers: { ...ua } });

	let scope = { text: '' };

	return fetch(searchURL).then(resp => resp.text()).then(t => {
		scope.text = t;
		return write(`${company.toLowerCase()}.html`, t);
	}).then(() => scope.text);
}

const cleanHTML = (data, rx) => {
	const results = [];

	while ((m = rx.exec(data)) !== null) {
		if (m.index === rx.lastIndex) {
			regex.lastIndex++;
		}

		m.forEach(match => {
			results.push(match)
		});
	}

	return results;
}

const glassdoorScraper = (url) => {
	return fetch(url, { headers: { ...ua } }).then(resp => resp.text());
}

const ambitionScraper = (url) => {
	return fetch(url, { headers: { ...ua } }).then(resp => resp.text());
}

const findReviews = (reviewMapper) => {
	let promises = [];
	if (reviewMapper['ambition']) {
		promises.push(ambitionScraper(reviewMapper['ambition']))
	}

	if (reviewMapper['glass']) {
		promises.push(glassdoorScraper(reviewMapper['glass']))
	}

	return Promise.allSettled(promises)
};

const findURLs = (urls, company, rx) => {
	urls ||= [];

	let externalURLs = urls.map(url => {
		let match = url.match(rx);
		if (match) return match[1];
	}).filter(f => f);

	let [turingURL, glassURL] = [toTuringRx(company), toGlassRx(company)];
	log.off(turingURL, glassURL);

	let reviewsMapper = {};

	for (let url of externalURLs) {
		if (url.search("ambitionbox") > -1 && url.search(turingURL) > -1) {
			reviewsMapper['ambition'] = url;
		} else if (url.search("glassdoor") > -1 && url.search(glassURL) > -1) {
			reviewsMapper['glass'] = url;
		}

		if ('ambition' in reviewsMapper && 'glass' in reviewsMapper) {
			log.off("all done");
			break;
		}
	}

	log.on(reviewsMapper);
	return reviewsMapper;
}


