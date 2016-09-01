#!/usr/bin/env node

'use strict';

const config = require('config');
const koa = require('koa');
const co = require('co');
const sanitizeProtocols = require('../app/sanitizeProtocols');
const targetToPromise = require('../app/targetToPromise');

const targets = config.get('targets');
const sanitizedTargets = sanitizeProtocols(targets);

// Cheap and insecure: TODO: FIX!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const formatResults = function* () {
    const resultPromises = sanitizedTargets.map(targetToPromise);
    const result = yield resultPromises;
    return `${result.join('\n')}\n`;
};

let cachedResults = '';

if (config.has('port')) {
// if run with port parameter, then run server and return result on each HTTP GET

    const port = config.get('port');
    const app = koa();

    if (config.has('interval')) {
        setInterval(() => {
            co(formatResults())
                        .then((results) => {
                            cachedResults = results;
                        });
        }, config.get('interval'));
    }

    app.use(function* () {
        if (cachedResults === '') {
            this.body = yield formatResults();
        } else {
            this.body = cachedResults;
        }
    });

    app.listen(port);

} else { // if not run with port parameter, then print out and exit, do not run server
    co(formatResults())
                .then((results) => {
                    console.log(results);
                });
}

