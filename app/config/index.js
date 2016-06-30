'use strict';

//export URL="pay.storyous.cz,login.storyous.com,storyous.com,pro.storyous.com,storyous.pl,admin.storyous.pl"

let URLsConfig = process.env.URL;
URLsConfig = URLsConfig.split(',');
const URLs = [];
let count = 1;

URLsConfig.forEach((host) => {
  const URL = {
    count, host
  };
  URLs.push(URL);
  count++
});

module.exports = {
  URLs
}
