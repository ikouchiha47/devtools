// ==UserScript==
// @name     RatingSniffer
// @version  1.1
// @match        https://www.linkedin.com/jobs/*
// @run-at      document-idle
// ==/UserScript==

(function(_window) {
	const MAX_LOOP = 10000;

	function $(el) {
		return document.querySelector(el)
	}

	var SP = 'ddg'; //google

	function waitTill(fn, comp, cb) {
		let loopCount = 0;

		let interval = setInterval(() => {
			let [values, ok] = comp(fn());

			console.log("running", ok, values);

			if (ok) {
				console.log("result received")
				clearInterval(interval)
				cb(null, values);
				return
			}

			if (loopCount == MAX_LOOP) {
				clearInterval(interval);
				cb("max loop", values);

				return
			}


			loopCount += 1;

		}, 2000)
	}

	function getNewRater() {
		let ratingEl = document.createElement("a");

		ratingEl.href = "#";
		ratingEl.id = "berater_el"
		ratingEl.innerText = "GetRated"
		ratingEl.className = "jobs-save-button artdeco-button artdeco-button--secondary artdeco-button--3"
		ratingEl.style = "margin-left: 10px;";

		ratingEl.onclick = () => {
			let companyName = $(".job-details-jobs-unified-top-card__company-name a").innerText.trim();

			getCompanyRatings(companyName, SP).then(res => alert(res)).catch(err => alert(err))
		}

		return ratingEl;
	}


	function debounce(func, delay) {
		let debounceTimer;
		delay = delay || 2000

		return function() {
			const context = this;
			const args = arguments;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => func.apply(context, args), delay);
		};
	};

	const mutator = (elq) => (mutationsList, observer) => {
		let hasMutated = false;

		//TODO: add a debouncer

		for (const mutation of mutationsList) {
			if (mutation.type === 'childList' || mutation.type === 'attributes') {
				// console.log("lala");

				hasMutated = true
				break;
			}
		}

		console.log("mutated?", hasMutated);

		if (!hasMutated) return;

		let element = $(elq);
		let html = element.innerText;
		//console.log("html", !html.includes("GetRated"));

		if (hasMutated && !html.includes("GetRated")) {
			let ratingEl = getNewRater();
			console.log("appending to ", elq);


			element.appendChild(ratingEl);
		}
	}

	let watcherQs = [
		".jobs-details__main-content--single-pane .mt5 div:first-child",
		".job-details-jobs-unified-top-card__container--two-pane .mt5 div:first-child"
	]

	//fireup
	// jobs-details__main-content jobs-details__main-content--single-pane
	// job-details-jobs-unified-top-card__container--two-pane"
	//
	waitTill(() => watcherQs.slice(0, 1),
		(values) => [values, values && values.length > 0],
		(err, elements) => {
			if (err != null) {
				return err
			}

			// console.log("creating rater", elements);

			elements.forEach((element, i) => {
				if (!element) return;

				// first run
				let ratingEl = getNewRater();
				element.appendChild(ratingEl);

				const observer = new MutationObserver(debounce(mutator(watcherQs[i])));
				const config = { childList: true, attributes: true };

				observer.observe(element, config);
			});
		});


	function getCompanyRatings(company, sp) {
		sp ||= 'ddg'

		const url = `http://localhost:3000/rating?company=${company}&sp=${sp}`;

		return fetch(url).then(resp => resp.json()).then(data => {
			if (!data.success) return Promise.reject('failed_response');

			console.log(data);

			let texts = data.result.ratings.map(r => `${r.provider}: ${r.rating}`)
			texts.push(`data_breached: ${data.result.breached}`);
			return texts.join("\n");
		});
	}


	//   _window.addEventListener('load', fireUp);
	_window.getRatings = getCompanyRatings;

})(window);
