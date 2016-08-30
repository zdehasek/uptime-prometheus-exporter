#!/usr/bin/env node

'use strict';

const config = require('config');
const koa = require('koa');
var co = require('co');


var targets = config.get('targets');
const sanitizeProtocols = require('../app/sanitizeProtocols');
var sanitizedTargets = sanitizeProtocols(targets);


//Cheap and insecure: TODO: FIX!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const targetToPromise = require('../app/targetToPromise');

var formatResults = function*() {
  const resultPromises = sanitizedTargets.map(targetToPromise);
  const result = yield resultPromises;
  return result.join("\n") + "\n";

var cachedResults = "";

if (config.has('port')) { // if run with port parameter, then run server and return result on each HTTP GET

  const port = config.get('port');
  const app = koa();

  if (config.has('interval')) {
    setInterval(function() {
      co(formatResults()).then((results) => {
        cachedResults = results;
      });
    }, config.get('interval'));
  }

  app.use(function*() {
    if (cachedResults === "") {
      this.body = (cachedResults = yield formatResults());
    } else {
      this.body = cachedResults;
    }
  });

  app.listen(port);

} else { // if not run with port parameter, then print out and exit, do not run server
  co(formatResults()).then((results) => {
    console.log(results);
  });
}