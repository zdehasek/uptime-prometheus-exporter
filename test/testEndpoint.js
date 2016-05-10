'use strict';

const assert = require('assert');
const Redis = require('ioredis');
const sinon = require('sinon');
const config = require('./../app/config');
const PrometheusExporter = require('../app/models/PrometheusExporter');
const co = require('co');


describe('test endpoint', () => {

    it('test endpoint fill last minute', function () {
        const sumKey = 'testResponse_profiler:aggregator_sum';
        const lbmKey = 'testResponse_aggregator_lastBucketMinute';
        const profilePrefix = 'testResponse_';
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
            client.del(`${profilePrefix}profile:${testMinute - 1}`);
        });

        // set lbm val
        return client.set(lbmKey, testMinute - 2)
            .then(() => {
                // set minute data
                const m = client.multi();
                for (const property in testMinuteData) {
                    if (testMinuteData.hasOwnProperty(property)) {
                        m.zincrby(`${profilePrefix}profile:${testMinute - 1}`,
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
                // get response
                co(exporter.handleRequest.bind(exporter))
            ))
            .then((res) => {
                // test response
                const expected = {
                    'test_route1_bucket{le="1"}': 2,
                    'test_route2_bucket{le="1"}': 3,
                    'requests_bucket{le="1"}': 5,
                    requests_sum: 93.7,
                    requests_count: 21,
                    test_route3_count: 2,
                    test_route1_count: 16,
                    test_route3_sum: 23.5,
                    test_route1_sum: 64.18,
                    test_route2_count: 3,
                    test_route2_sum: 6.02
                };

                for (const p in res) {
                    if (!res.hasOwnProperty(p)) continue;

                    if (!expected.hasOwnProperty(p)) {
                        assert.ok(false, `Row ${p} is not expected`);
                    }

                    if (parseFloat(res[p]) !== parseFloat(expected[p])) {
                        assert.ok(false,
                            `${p} value mismatch, expected: ${expected[p]}, got: ${res[p]}`);
                    }
                }

                for (const p in expected) {
                    if (expected.hasOwnProperty(p) && ! res.hasOwnProperty(p)) {
                        assert.ok(false, `Missing row: ${p}`);
                    }
                }
            })
            .catch((err) => {
                assert.ok(false, `Test error ${err}`);
            });
    });
});
