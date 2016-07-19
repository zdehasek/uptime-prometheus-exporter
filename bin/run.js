#!/usr/bin/env node
'use strict';

const request = require('request');
const config = require('../app/config');
const protocols = [ "http://","https://" ];

const koa = require('koa');
const app = koa();

app.use(function *(){
  const resultPromises = []
  for(let s of config.URLs) {
    for (let p of protocols ) {
      let promise = new Promise((resolve, reject)=> {
        let URL = p + s.host
        request( URL, function (error, response) {
          if (!error && response.statusCode == 200) {
            resolve("urlcheck{url=\"" + URL + "\"} 1");
          } else {
            resolve("urlcheck{url=\"" + URL + "\"} 0");
          }
        });
      });
        resultPromises.push(promise);
    }
  }
  const result = yield resultPromises;
  this.body = result.join("\n")+"\n"
});

app.listen(8080);
