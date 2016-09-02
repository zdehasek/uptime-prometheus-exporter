'use strict';

const request = require('request');

// cache for cookies and patters if run as server
const cookies = {};
const patterns = {};

module.exports = function targetToPromise (target) {
    const promise = new Promise((resolve) => {

        const URL = target.url;
        cookies[URL] = cookies[URL] || request.jar();

        request({
            method: 'GET',
            url: URL,
            jar: cookies[URL]
        },

            (error, response, body) => {
                if (error) {
                    console.error('hit');
                    console.error(error.message);
                    resolve(`urlcheck{url="${URL}"} 0`);
                } else {

                    console.log(`${target.url} ${response.statusCode}`);
                    if (response.statusCode === 200) {


                        if (target.pattern) {

                            // cache compiled patterns
                            /* eslint no-eval: 0 */
                            // eval is bad, but no other way to put regex in json and then use it
                            patterns[URL] = patterns[URL] || eval(target.pattern);

                            if (patterns[URL].exec(body)) {
                                resolve(`urlcheck{url="${URL}"} 1`);
                            } else {
                                resolve(`urlcheck{url="${URL}"} 0.5`);
                            }

                        } else {
                            resolve(`urlcheck{url="${URL}"} 1`);
                        }


                    } else {
                        resolve(`urlcheck{url="${URL}"} 0`);
                    }
                }
            });
    });

    return promise;
};
