#!/usr/bin/env node
'use strict';

const request = require('request');
const config = require('../app/config');
const protocols = [ "http://","https://" ];

for(let s of config.URLs) {
  for (let p of protocols ) {
    let URL = p + s.host
    request( URL, function (error, response) {
      if (!error && response.statusCode == 200) {
        console.log(URL + " OK");
      } else {
        console.log(URL + " ERROR");
      }
    })
  }
}
/*
class checkURLs extends request{
  constructor() {


  }
}

const myCheck = new checkURLs();
*/
