/**
 * Created by davidmenger on 27/05/15.
 */
'use strict';

const packageJson = require('../../package.json');

module.exports = {

    /* CONSTANTS */
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TESTING: 'testing',
    BETA: 'beta',

    _initialized: false,

    /**
     * System environment
     */
    env: null,

    /**
     * @type {boolean}
     */
    debugEnabled: null,

    /**
     * @type {boolean}
     */
    production: null,

    /**
     * Call me once after run
     */
    initialize () {
        if (!this._initialized) {
            this.env = process.env.NODE_ENV || this.DEVELOPMENT;

            this._merge(require('./default.config.js'));

            try {
                const filename = this._getEnvSpecificConfigFile();
                const environmentSpecific = require(filename);
                this._merge(environmentSpecific);
                this._setMongoLogs();
            } catch (e) {
                // log is required here only in case of exception (when config file is not loaded)
                console.log(`Cant load configuration: ${e.message}`);
            }

            this._initialized = true;
        }
    },

    isProduction () {
        return this.production;
    },

    /**
     * Returns environment specific configuration file name
     *
     * @returns {string}
     * @private
     */
    _getEnvSpecificConfigFile () {
        return `./${this.env}.config.js`;
    },

    /**
     * Merge configuration files
     *
     * @param replaceWith
     * @param defaults
     * @private
     */
    _merge (replaceWith, defaults) {
        defaults = defaults || this;

        for (const k in replaceWith) {
            if (!replaceWith.hasOwnProperty(k)) {
                continue;
            }
            if (typeof replaceWith[k] !== 'object'
                || replaceWith[k] === null
                || typeof defaults[k] !== 'object'
                || defaults[k] === null) {

                defaults[k] = replaceWith[k];
            } else {
                this._merge(replaceWith[k], defaults[k]);
            }
        }
    },

    _setMongoLogs () {
        if (this.logger && typeof this.logger.transports === 'object') {
            this.logger.transports.forEach((transport) => {
                if (transport.transport === 'MongoDB') {
                    transport.label = transport.label || {};
                    transport.label.app = transport.label.app || packageJson.name;
                    transport.label.v = transport.label.v || packageJson.version;
                    transport.label.env = transport.label.env || this.env;
                    transport.storeHost = transport.storeHost || true;
                }
            });
        }
    }
};

module.exports.initialize();
