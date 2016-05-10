'use strict';

const Koa = require('koa');
const log = require('./log').module('prometheus-exporter-server');
const KoaRouter = require('koa-router');

const app = new Koa();

let prometheusExporter;

// let's override our error handler
app.use(function *(next) {
    try {
        yield next;
    } catch (err) {
        this.res.status = err.code || 500;
        this.app.emit('error', err, this);
    }
});

// ROUTER
const router = new KoaRouter();

// homepage
router.get('/', function *() {
    this.body = 'Hello World!';
});

router.get('/status', function *() {
    let data;
    try {
        data = yield prometheusExporter.handleRequest();
    } catch (err) {
        log.e(`Server error ${err}`);
    }

    if (data === null) {
        this.res.status = 404;
    } else {
        let response = '';
        for (const property in data) {
            if (data.hasOwnProperty(property)) {
                response += `${property} ${data[property]}\n`;
            }
        }
        this.body = response;
    }
});

// mount a main router
app.use(router.routes());

// handle 404 - not found
app.use(function *() {
    this.res.status = 404;

    // log.i(`404: ${this.req.url}`);
});


app.on('error', (err) => {
    log.e(`Server error ${err}`);
});

module.exports = {
    init (exporter) {
        prometheusExporter = exporter;
    },
    callback () {
        return app.callback();
    }
};
