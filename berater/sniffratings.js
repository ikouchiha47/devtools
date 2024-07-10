const fs = require('node:fs/promises');

const GoogleURL = `https://google.com/search?q`
const DDGURL = `https://html.duckduckgo.com/html?q`
const BingURL = `https://www.bing.com/search?q`
const Providers = ["glassdoor.com", "ambitionbox.com"]

const write = (fileName, data) => {
	log.on("writing to file " + fileName);
	return fs.writeFile(`${fileName}`, data, { flag: 'w' })
}

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

const log = {
	on: console.log.bind(console),
	off: () => { },
}

const searchProviders = (company, searchprovider, url, qbuilder) => {
	const resolver = (query, provider) => {
		const searchURL = `${url}=${encodeURIComponent(query)}`;
		let scope = { text: '', provider: '' };

		log.on(searchURL);

		return fetch(searchURL, { headers: { ...ua } }).
			then(resp => resp.text()).
			then(t => {
				if (t.includes('captcha')) {
					return Promise.reject(`provider(${provider}) for your search result bitched out`)
				}

				scope.text = t; scope.provider = provider;
				const filename = `tmp/${searchprovider}_${company.toLowerCase()}_${provider.split('.').shift()}.html`;
				return write(filename, t);
			}).then(() => scope).catch(err => { log.on(err); throw err });
	}

	return Promise.allSettled(
		Providers.map(provider => resolver(qbuilder(company, provider), provider))
	).then(results => (
		results.
			filter(result => result.status === 'fulfilled').
			map(result => result.value)
	))
}

const findRatingsInSearch = (searchResult, provider, rx) => {
	// const results = {};
	while ((m = rx.exec(searchResult)) !== null) {
		if (m.index === rx.lastIndex) {
			regex.lastIndex++;
		}

		if (m && m.groups && m.groups.rating) {
			// results[provider] = m.groups.rating
			return m.groups.rating
		}
	}

	return null;
}


const GoogleResults = {
	_company: '',
	_baseURL: GoogleURL,
	_buildQ: (company, provider) => `site://${provider} ${company} reviews`,

	init: function(company) { this._company = company; return this; },
	rx: /<a href=([^>]+)\/?>/gm,
	frx: /\/url\?q=([^&]+)/,
	rrx: /Rating[\s\S]*?(?<rating>(\d\.\d))/gmi,

	search: function(query) {
		const destURL = `${this._baseURL}=${encodeURIComponent(query)}`

		return fetch(destURL, { headers: { ...ua } }).then(resp => resp.text()).then(text => {
			if (text.includes('captcha')) {
				throw 'blocked'
			}
			return text
		})
	},
	getReviews: function() {
		return searchProviders(this._company, 'google', this._baseURL, this._buildQ).then(results => {
			return results.map(result => ({
				rating: findRatingsInSearch(result.text, result.provider, this.rrx),
				provider: result.provider,
			}));
		});
	},
	_aggregateReviews: function() {
		// let searchRes = search(this._company, GoogleURL, buildQuery(this._company));
		// return searchRes.
		// then(data => cleanHTML(data, GoogleResults.rx)).
		// then(urls => findURLs(urls, this._company, GoogleResults.frx)).
		return Promise.reject("not_implemented")
	},
}

const BingResults = {
	...GoogleResults,
	_baseURL: BingURL,

	getReviews: function() {
		return searchProviders(this._company, 'bing', this._baseURL, this._buildQ).then(results => {
			return results.map(result => ({
				rating: '',
				provider: result.provider,
			}));
		});
	}
}

const DDGResults = {
	...GoogleResults,
	_baseURL: DDGURL,
	_buildQ: (company, provider) => `site:${provider} ${company} ratings`,

	// rrx: /<a class="result__snippet"[^>]+>[\s\S]*?(?<rating>(\d\.\d))/gmi,
	rrx: /rating<\/b>[\s\S]*?(?<rating>(\d\.\d))/gmi,
	getReviews: function() {
		// return Promise.resolve([{ rating: '3.4', provider: 'provider' }]);

		return searchProviders(this._company, 'ddg', this._baseURL, this._buildQ).then(results => {
			return results.map(result => ({
				rating: findRatingsInSearch(result.text, result.provider, this.rrx),
				provider: result.provider,
			}));
		});
	}
}

const breachTerms = ["breach", "confirm", "suffer", "hack", "compromise", "incident", "leak", "expose", "attack"];

const BreachDetector = {
	fetcher: { search: () => Promise.reject('fetecher_not_set') },
	rxb: (company) => {
		return new RegExp(`${company}[\\s\\S]{0,50}(?:${breachTerms.join('|')})`, 'gi');
	},
	init: function(fetcher) { this.fetcher = fetcher; return this; },
	detect: function(company) {
		// return Promise.resolve(true)
		// let scope = {};
		let query = encodeURIComponent(`${company} data breaches`);
		return this.fetcher.search(query, { headers: { ...ua } }).then(html => {
			const matches = html.match(this.rxb(company))
			// console.log("breached ", matches);
			// scope.matches = matches;
			// return write('tmp/breched', html);
			return matches && matches.length >= 30;
		})
	}
}

module.exports = {
	GoogleResults: GoogleResults,
	BingResults: BingResults,
	DDGResults: DDGResults,
	BreachDetector: BreachDetector,
}
