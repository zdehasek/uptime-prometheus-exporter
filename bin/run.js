#!/usr/bin/env node
'use strict';

const config = require('../app/config');
const request = require('request');
const url = require ('url');
const protocols = [ "http://", "https://" ];

const koa = require('koa');
const app = koa();
//Cheap and insecure: TODO: FIX!!!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const cookies = {};

app.use(function *(){
  const resultPromises = []
  for(let address of config.URLs) {
    for (let protocol of protocols ) {
      let promise = new Promise((resolve, reject)=> {

        let URL = protocol + address.host;
        cookies[URL] = cookies[URL] || request.jar()
      //  const parsedURL = url.parse(URL);
        console.log(URL)
        request
          .get({url: URL, jar: cookies[URL]})

          .on('response', (response) => {
            console.log(address.host + " " + response.statusCode);
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
  }
  const result = yield resultPromises;
  this.body = result.join("\n")+"\n"
});

app.listen(8080);
