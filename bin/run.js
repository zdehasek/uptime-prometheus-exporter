#!/usr/bin/env node

'use strict';

var config = require('config');

var port = config.get('port');
var targets = config.get('targets');

const koa = require('koa');
const app = koa();
//Cheap and insecure: TODO: FIX!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var targetToPromise = require('../app/targetToPromise');

var formatResults = function*() {
  var resultPromises = targets.map(targetToPromise);
  const result = yield resultPromises;
  return result.join("\n") + "\n"
}

app.use(function*() {
  this.body = yield formatResults();
});

app.listen(port);