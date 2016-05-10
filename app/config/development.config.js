'use strict';

module.exports = {

    port: 3333,
    debugEnabled: true,
    production: false,

    logger: {
        transports: [
            {
                transport: 'MongoDB',
                db: 'mongodb://127.0.0.1:27017/storyous',
                collection: 'logs',
                capped: true,
                cappedSize: 1000000000,
                username: 'storyous',
                password: 'storyous'
            }
        ]
    }
};
