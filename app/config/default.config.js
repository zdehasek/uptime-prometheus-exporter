'use strict';

const cfg = {

    port: 3333,
    debugEnabled: true,
    production: false,
    redis: 6379,

    logger: {
        transports: [
            {
                transport: 'MongoDB',
                db: process.env.DATABASE_SERVICE_NAME_LOGS || null,
                collection: 'logs',
                username: process.env.MONGODB_USER || null,
                password: process.env.MONGODB_PASSWORD || null,
                capped: true,
                cappedSize: 1000000000
            }
        ]
    }

};

module.exports = cfg;
