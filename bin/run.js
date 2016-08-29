#!/usr/bin/env node
'use strict';

var config = require('config');
var port = config.get('port');

var targets = config.get('targets');

const request = require('request');
const url = require ('url');

const koa = require('koa');
const app = koa();
//Cheap and insecure: TODO: FIX!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const cookies = {};

app.use(function *(){
  const resultPromises = []
  for(let target of targets) {

      let promise = new Promise((resolve, reject)=> {

        let URL = target.url;
        cookies[URL] = cookies[URL] || request.jar()
      //  const parsedURL = url.parse(URL);
        console.log(URL)
        request
          .get({url: URL, jar: cookies[URL]})

          .on('response', (response) => {
            console.log(target.url + " " + response.statusCode);
            if (response.statusCode == 200 ) {
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
        resultPromises.push(promise);

  }
  const result = yield resultPromises;
  this.body = result.join("\n")+"\n"
});

app.listen(port);
