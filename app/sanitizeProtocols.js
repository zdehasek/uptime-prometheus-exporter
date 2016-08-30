'use strict';

const url = require('url');


module.exports = function sanitizeProtocols(targets) {
	let sanitizedTargets = [];

	var target;
	for (target of targets) {

		var targetUrl = url.parse(target.url);
		
		if (targetUrl.protocol === "http:" || targetUrl.protocol == "https:") { // http and https are ok
			sanitizedTargets.push(target);
		} else if (targetUrl.protocol == null) { // if protocol not set, it probably starts with '//' and should be processed as both http and https
			
			var one = JSON.parse(JSON.stringify(target))
			targetUrl.protocol="http:";
			one.url=url.format(targetUrl);
			sanitizedTargets.push(one);

			var two = JSON.parse(JSON.stringify(target))
			targetUrl.protocol="https:";
			two.url=url.format(targetUrl);
			sanitizedTargets.push(two);
			
		} else { // if some other protocol, then do no process
			console.error("Strange protocol " + targetUrl.protocol + " in target " + url.format(targetUrl) );
		}
	}

	return sanitizedTargets;
}