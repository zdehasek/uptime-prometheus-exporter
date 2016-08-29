#!/usr/bin/env node

'use strict';

const request = require('request');
const url = require('url');

var cookies = {};

module.exports =  function targetToPromise(target) {
	let promise = new Promise((resolve, reject) => {

		let URL = target.url;
		cookies[URL] = cookies[URL] || request.jar()
		console.log(URL)
		request
			.get({
				url: URL,
				jar: cookies[URL]
			})

		.on('response', (response) => {
			console.log(target.url + " " + response.statusCode);
			if (response.statusCode == 200) {
				resolve("urlcheck{url=\"" + URL + "\"} 1");
			} else {
				resolve("urlcheck{url=\"" + URL + "\"} 0");
			}
		})

		.on("error", (error) => {
			console.log("hit");
			console.log(error.message);
			resolve("urlcheck{url=\"" + URL + "\"} 0");
		})

	});

	return promise;
}

