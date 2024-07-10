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

	//fireup
	// jobs-details__main-content jobs-details__main-content--single-pane
	// job-details-jobs-unified-top-card__container--two-pane"
	//
	waitTill(() => $(".jobs-details__main-content--single-pane .mt5 div:first-child"),
		(value) => [value, !!value],
		(err, element) => {
			// console.log(element, "eeeee");
			if (err != null) {
				return err
			}

			console.log("creating rater");

			let ratingEl = document.createElement("a");

			ratingEl.href = "#";
			ratingEl.innerText = "GetRated"
			ratingEl.className = "jobs-save-button artdeco-button artdeco-button--secondary artdeco-button--3"
			ratingEl.style = "margin-left: 10px;";

			ratingEl.onclick = () => {
				let companyName = $(".job-details-jobs-unified-top-card__company-name a").innerText.trim();

				getCompanyRatings(companyName, SP).then(res => alert(res))
			}

			console.log(element, element.appendChild)

			element.appendChild(ratingEl);
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
