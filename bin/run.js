#!/usr/bin/env node
'use strict';

/**
 * taken from http://expressjs.com/starter/generator.html
 */

const app = require('../app');
const http = require('http');
const config = require('../app/config');

const server = http.createServer(app.callback());

// start server
server.listen(config.port);

// or when there is an error
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${config.port} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${config.port} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});
