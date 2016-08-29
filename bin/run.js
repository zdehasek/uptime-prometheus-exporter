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


app.use(function *(){
  const resultPromises = []
  for(let target of targets) {

        var promise = targetToPromise(target);
        resultPromises.push(promise);

  }
  const result = yield resultPromises;
  this.body = result.join("\n")+"\n"
});

app.listen(port);
