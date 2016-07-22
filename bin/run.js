#!/usr/bin/env node
'use strict';

const config = require('../app/config');
const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
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
        const request = protocol.request.get({
          host: parsedURL.host,
          method: 'GET',
          path: parsedURL.path,
          rejectUnauthorized: false,
          requestCert: true,
          agent: false
    }, function (response) {
          console.log(address.host + " " + response.statusCode);
          if (response.statusCode == 200 ) {
          //if ([200,301,302].indexOf(response.statusCode) >= 0 ) {
            resolve("urlcheck{url=\"" + URL + "\"} 1");
          } else {
            resolve("urlcheck{url=\"" + URL + "\"} 0");
          }
        });
        request.on("error",function (error) {
          console.log("hit");
          console.log(error.message);
          resolve("urlcheck{url=\"" + URL + "\"} 0");
        })
      });
        resultPromises.push(promise);
    }
  }
  const result = yield resultPromises;
  this.body = result.join("\n")+"\n"
});

app.listen(8080);
