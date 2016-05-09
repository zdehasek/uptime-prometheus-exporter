/**
 * Created by davidmenger on 27/05/15.
 */
'use strict';

const winston = require('winston');
const LoggerModule = require('./loggerModule');
const config = require('../../config');
const mongo = require('winston-mongodb').MongoDB;

const transports = [
    new (winston.transports.Console)({
        level: (config.logger && config.logger.consoleLevel) || null
    })
];

const configTransports = (config.logger && config.logger.transports) || [];
configTransports.forEach((transport) => {
    const newTransport = new (winston.transports[transport.transport])(transport);
    transports.push(newTransport);
    if (transport.transport === 'MongoDB') {
        let firstLog = true;
        newTransport.on('logged', () => {
            if (firstLog) {
                newTransport.logDb.collection(newTransport.collection, (err, col) => {
                    col.createIndex({ 'label.app': 1, 'label.env': 1 });
                });
                firstLog = false;
            }
        });
    }
});

const logger = new winston.Logger({
    transports
});

module.exports = logger;

/**
 *
 * @param moduleName
 * @returns {LoggerModule}
 */
module.exports.module = function moduleFactory (moduleName) {
    return new LoggerModule(moduleName, this);
};
