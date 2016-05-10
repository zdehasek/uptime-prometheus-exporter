/**
 * Created by davidmenger on 08/06/15.
 */
'use strict';

/**
 *
 * @param {string} name
 * @param {object} logger
 * @constructor
 */
class LoggerModule {

    constructor (name, logger) {
        /**
         * @type {object}
         */
        this._logger = logger;

        /**
         * @type {string}
         */
        this._name = `[${name.toUpperCase()}]`;
    }

    _log (type, otherArgs) {
        const args = [type, this._name];
        for (let i = 0; i < otherArgs.length; i++) {
            args.push(otherArgs[i]);
        }
        this._logger.log.apply(this._logger, args);
    }

    /**
     * info
     */
    i (...args) {
        this._log('info', args);
    }

    /**
     * warn
     */
    w (...args) {
        this._log('warn', args);
    }

    /**
     * error
     */
    e (...args) {
        this._log('error', args);
    }
}

module.exports = LoggerModule;
