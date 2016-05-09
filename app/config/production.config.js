'use strict';

// 0.0.0.0:4545,1.1.1.1:4646
// ip:port,ip:port
let sentinelsConfig = process.env.REDIS_SENTINELS;
sentinelsConfig = sentinelsConfig.split(',');
const sentinels = [];

sentinelsConfig.forEach((val) => {
    const hostAndPort = val.split(':');
    const sentinel = {
        host: hostAndPort[0],
        port: hostAndPort[1]
    };
    sentinels.push(sentinel);
});

module.exports = {

    redis: {
        sentinels,
        name: process.env.REDIS_USER,
        password: process.env.REDIS_PASS
    }
};
