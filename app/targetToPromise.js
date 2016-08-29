#!/usr/bin/env node

'use strict';

const request = require('request');
const url = require('url');

var cookies = {};

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
							var pattern = eval(target.pattern);

							if (pattern.exec(body)) {
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