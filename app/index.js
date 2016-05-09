'use strict';

const log = require('./models/log').module('prometheusExporter-main');
const Redis = require('ioredis');
const config = require('./config');
const PrometheusExporter = require('./models/PrometheusExporter');
const WebServer = require('./models/WebServer');


const client = new Redis(config.redis);

client.on('error', (err) => {
    log.e(`Error ${err}`);
});

const exporter = new PrometheusExporter(client, {
    sleepInterval: 10 * 1000,
    sumKey: 'profiler:aggregator_sum',
    lbmKey: 'aggregator_lastBucketMinute',
    threshold: 1, // minute to check: getMinute - threshold
    profilePrefix: '',

    // bucket expiration time in minutes
    bucketExpiration: 10

});

const init = function () {
    exporter.init();
    WebServer.init(exporter);
};

module.exports = {
    callback () {
        init();
        return WebServer.callback();
    }
};
