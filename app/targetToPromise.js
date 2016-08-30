'use strict';

const request = require('request');

// cache for cookies and patters if run as server
var cookies = {};
var patterns = {};

module.exports = function targetToPromise(target) {
	let promise = new Promise((resolve, reject) => {

		let URL = target.url;
		cookies[URL] = cookies[URL] || request.jar();

		request({
				method: 'GET',
				url: URL,
				jar: cookies[URL]
			},

			function(error, response, body) {
				if (error) {
					console.error("hit");
					console.error(error.message);
					resolve("urlcheck{url=\"" + URL + "\"} 0");
				} else {

					console.log(target.url + " " + response.statusCode);
					if (response.statusCode == 200) {


						if (target.pattern) {

							// cache compiled patterns
							patterns[URL] = patterns[URL] || eval(target.pattern);

							if (patterns[URL].exec(body)) {
								resolve("urlcheck{url=\"" + URL + "\"} 1");
							} else {
								resolve("urlcheck{url=\"" + URL + "\"} 0.5");
							}

						} else {
							resolve("urlcheck{url=\"" + URL + "\"} 1");
						}


					} else {
						resolve("urlcheck{url=\"" + URL + "\"} 0");
					}
				}
			});
	});

	return promise;
}