'use strict';

const assert = require('assert');
const Redis = require('ioredis');
const sinon = require('sinon');
const config = require('./../app/config');
const PrometheusExporter = require('../app/models/PrometheusExporter');
const co = require('co');


describe('test aggregate', () => {

    it('aggregate one minute', function () {
        const sumKey = 'test1_profiler:aggregator_sum';
        const lbmKey = 'test1_aggregator_lastBucketMinute';
        const profilePrefix = 'test1_';
        const client = new Redis(config.redis);
        const testMinute = 5;
        const testMinuteData = {
            test_route1_sum: 5.98,
            test_route1_count: 2,
            test_route2_sum: 6.02,
            test_route2_count: 3,
            total_count: 5,
            total_sum: 12
        };
        const sumInit = {
            test_route1_sum: 58.2,
            test_route1_count: 14,
            test_route3_sum: 23.5,
            test_route3_count: 2,
            total_count: 16,
            total_sum: 81.7
        };

        // stub getMinute method
        const exporter = new PrometheusExporter(client, {
            sleepInterval: 10 * 1000,
            sumKey,
            lbmKey,
            profilePrefix,
            threshold: 1, // minute to check: getMinute - threshold
            // bucket expiration time in minutes
            bucketExpiration: 10
        });
        const exporterStub = sinon.stub(exporter, '_getMinute', function () {
            return testMinute;
        });

        after(function () {
            // cleanup
            exporterStub.restore();
            client.del(sumKey);
            client.del(lbmKey);
            client.del(`${profilePrefix}profile:${testMinute - 2}`);
        });

        // set lbm val
        return client.set(lbmKey, testMinute - 3)
            .then(() => {
                // set minute data
                const m = client.multi();
                for (const property in testMinuteData) {
                    if (testMinuteData.hasOwnProperty(property)) {
                        m.zincrby(`${profilePrefix}profile:${testMinute - 2}`,
                            testMinuteData[property], property);
                    }
                }

                return m.exec();
            })
            .then(() => {
                // set initial sum data
                const m = client.multi();
                for (const property in sumInit) {
                    if (sumInit.hasOwnProperty(property)) {
                        m.zincrby(sumKey, sumInit[property], property);
                    }
                }
                return m.exec();
            })
            .then(() => (
                // aggregate
                 co(exporter.aggregateData.bind(exporter))
            ))
            .then(() => (
                // test sum content
                client.zrange(sumKey, 0, -1, 'WITHSCORES')
             ))
            .then((res) => {
                for (let i = 0; i < res.length; i += 2) {
                    const prop = res[i];
                    let val = parseFloat(res[i + 1]);
                    if (testMinuteData.hasOwnProperty(prop)) {
                        val -= testMinuteData[prop];
                    }
                    if (sumInit.hasOwnProperty(prop)) {
                        val -= sumInit[prop];
                    }

                    assert.ok(val > - 0.1 && val < 0.1, `Bad sum of ${prop}`);
                }

            })
            .catch((err) => {
                assert.ok(false, `Test error ${err}`);
            });

    });

    it('aggregate several minutes', function () {
        const sumKey = 'test2_profiler:aggregator_sum';
        const lbmKey = 'test2_aggregator_lastBucketMinute';
        const client = new Redis(config.redis);
        const profilePrefix = 'test2_';
        const testMinute = 10;
        const testMinuteData = {
            test_route1_sum: 5.98,
            test_route1_count: 2,
            test_route2_sum: 6.02,
            test_route2_count: 3,
            total_count: 5,
            total_sum: 12
        };
        const sumInit = {
            test_route1_sum: 58.2,
            test_route1_count: 14,
            test_route3_sum: 23.5,
            test_route3_count: 2,
            total_count: 16,
            total_sum: 81.7
        };

        // stub getMinute method
        const exporter = new PrometheusExporter(client, {
            sleepInterval: 10 * 1000,
            sumKey,
            lbmKey,
            threshold: 1, // minute to check: getMinute - threshold
            profilePrefix,
            // bucket expiration time in minutes
            bucketExpiration: 10
        });
        const exporterStub = sinon.stub(exporter, '_getMinute', function () {
            return testMinute;
        });

        after(function () {
            // cleanup
            exporterStub.restore();
            client.del(sumKey);
            client.del(lbmKey);
            client.del(`${profilePrefix}profile:${testMinute - 2}`);
            client.del(`${profilePrefix}profile:${testMinute - 3}`);
            client.del(`${profilePrefix}profile:${testMinute - 5}`);
        });

        // set lbm val
        return client.set(lbmKey, testMinute - 8)
            .then(() => {
                // set minute data
                const m = client.multi();
                for (const property in testMinuteData) {
                    if (testMinuteData.hasOwnProperty(property)) {
                        m.zincrby(`${profilePrefix}profile:${testMinute - 2}`,
                            testMinuteData[property], property);
                        m.zincrby(`${profilePrefix}profile:${testMinute - 3}`,
                            testMinuteData[property], property);
                        m.zincrby(`${profilePrefix}profile:${testMinute - 5}`,
                            testMinuteData[property], property);
                    }
                }

                return m.exec();
            })
            .then(() => {
                // set initial sum data
                const m = client.multi();
                for (const property in sumInit) {
                    if (sumInit.hasOwnProperty(property)) {
                        m.zincrby(sumKey, sumInit[property], property);
                    }
                }
                return m.exec();
            })
            .then(() => (
                // aggregate
                co(exporter.aggregateData.bind(exporter))
             ))
            .then(() => (
                // test sum content
                client.zrange(sumKey, 0, -1, 'WITHSCORES')
            ))
            .then((res) => {
                for (let i = 0; i < res.length; i += 2) {
                    const prop = res[i];
                    let val = parseFloat(res[i + 1]);
                    if (testMinuteData.hasOwnProperty(prop)) {
                        val -= (3 * testMinuteData[prop]);
                    }
                    if (sumInit.hasOwnProperty(prop)) {
                        val -= sumInit[prop];
                    }

                    assert.ok(val > - 0.1 && val < 0.1, `Bad sum of ${prop}`);
                }

            })
            .catch((err) => {
                assert.ok(false, `Test error ${err}`);
            });
    });
});
