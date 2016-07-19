#!/usr/bin/env node
'use strict';

const config = require('../app/config');
const http = require('http');
const https = require('https');
const url = require ('url');
const protocols = [ {prefix: "http://", request: http},{prefix: "https://", request: https} ];


const koa = require('koa');
const app = koa();

app.use(function *(){
  const resultPromises = []
  for(let address of config.URLs) {
    for (let protocol of protocols ) {
      let promise = new Promise((resolve, reject)=> {
        let URL = protocol.prefix + address.host;
        const parsedURL = url.parse(URL);
        protocol.request.get({
          host: parsedURL.host,
          method: 'GET',
          path: parsedURL.path,
          rejectUnauthorized: false,
          requestCert: true,
          agent: false
    }, function (response) {
          // TODO: check redirected satusCode as well.
          if (response.statusCode == 200 || response.statusCode == 302 || response.statusCode == 301 ) {
            resolve("urlcheck{url=\"" + URL + "\"} 1");
          } else {
            //console.log(response.statusCode);
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
