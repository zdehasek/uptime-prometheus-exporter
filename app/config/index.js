'use strict';

// export URL="google.com,example.com,etc..."

let URLsConfig = process.env.URL;
URLsConfig = URLsConfig.split(',');
const URLs = [];
let count = 1;

URLsConfig.forEach((host) => {
    const URL = {
        count,
        host
    };
    URLs.push(URL);
    count++;
});

module.exports = {
    URLs
};
