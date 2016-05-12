'use strict';
/**
 * Created by Jan Řasa on 5/5/2016
 */

const log = require('./log').module('prometheus-exporter-test');
const events = require('events');
const co = require('co');

class PrometheusExporter extends events.EventEmitter {
    constructor (redis, options) {
        super();
        this.redis = redis;
        const errorFunc = function (err) {
            log.e(`Err:${err}`);
        };

        this.redis.on('error', errorFunc);

        if (typeof options === 'object') {
            for (const key of Object.keys(options)) {
                this[key] = options[key];
            }
        }
    }

    init () {

        log.i(`Initializing with: sumKey: ${this.sumKey}, lbmKey: ${this.lbmKey}`);
        co(this.aggregateData.bind(this)).catch((err) => {
            log.e(`Err:${err}`);
        });

        setInterval(() => {
            co(this.aggregateData.bind(this)).catch((err) => {
                log.e(`Err:${err}`);
            });
        }, this.sleepInterval);
        log.i('Initialized');
    }

    /**
     * Aggregates data from redis
     */
    *aggregateData () {
        const currentMinute = this._getMinute();

        let lbm = yield this.redis.get(this.lbmKey);
        lbm = lbm === null ? currentMinute - this.bucketExpiration : parseInt(lbm, 10) + 1;

        while (lbm < this._getThreshold()) {
            const lockKey = `aggregator_lock_${lbm}`;
            if (yield this.redis.set(lockKey, 1, 'NX', 'EX', 100)) {
                log.i('Started aggregate procedure');

                const multi = this.redis.multi();
                if (yield this.redis.exists(`${this.profilePrefix}profile:${lbm}`)) {
                    multi.zunionstore(this.sumKey, 2,
                        this.sumKey, `${this.profilePrefix}profile:${lbm}`);
                } else {
                    log.i(`${this.profilePrefix}profile:${lbm} does not exist`);
                }

                multi.set(this.lbmKey, lbm);

                yield multi.exec();
                yield this.redis.del(lockKey);

                log.i('Ended aggregate procedure');
            } else {
                log.i(`Failed to lock key ${lockKey}, threshold: ${this._getThreshold()}`);
                break;
            }
            lbm++;
        }
    }

    /**
     * Returns the aggregated data
     */
    *handleRequest () {
        const multi = this.redis.multi();
        multi.zrange(this.sumKey, 0, -1, 'WITHSCORES');
        multi.get(this.lbmKey);
        const data = yield multi.exec();
        let missingMinuteData = [];
        const sumData = data[0][1];
        const threshold = this._getThreshold();

        if (this._getThreshold() - 1 > data[1][1]) {
            // add data for requests which are created before timer calls aggregate
            // but the next minute has already begun
            missingMinuteData = yield this.redis.zrange(
                `${this.profilePrefix}profile:${threshold - 1}`, 0, -1, 'WITHSCORES'
            );

            log.i(`Adding missingMinuteData ${this.profilePrefix}profile:${threshold - 1}`);
        }

        const minuteData = yield this.redis.zrange(
            `${this.profilePrefix}profile:${threshold}`, 0, -1, 'WITHSCORES'
        );

        const response = {};
        let addMinute = false;
        let requestsSum = parseFloat(sumData[sumData.indexOf('total_sum') + 1] || 0);
        let requestsCount = parseFloat(sumData[sumData.indexOf('total_count') + 1] || 0);
        let requestsBucket = 0;

        // add not summarized minute
        if (threshold > data[1][1]) {
            addMinute = true;
            log.i(`Adding last minute ${this.profilePrefix}profile:${threshold - 1}, current minute: ${this._getMinute()}`);
        }

        const minuteKeys = new Map();

        [minuteData, missingMinuteData].forEach((mArray) => {
            for (let i = 0; i < mArray.length; i += 2) {

                if (mArray[i] === 'total_count') {
                    if (mArray === minuteData) {
                        requestsBucket += parseFloat(mArray[i + 1]);
                    }
                    if (addMinute) {
                        requestsCount += parseFloat(mArray[i + 1]);
                    }

                } else if (mArray[i] === 'total_sum') {
                    if (addMinute) {
                        requestsSum += parseFloat(mArray[i + 1]);
                    }
                } else {
                    if (mArray[i].indexOf('_count') > -1 && mArray === minuteData) {
                        // minute bucket info
                        response[mArray[i].replace('_count', '_bucket{le="1"}')] = mArray[i + 1];
                    }
                }
                const sumDataidx = sumData.indexOf(mArray[i]);
                if (typeof sumDataidx > -1) {
                    const val = minuteKeys.get(sumData[i]);
                    minuteKeys.set(mArray[i], parseFloat(mArray[i + 1]) + parseFloat(val));
                } else {
                    minuteKeys.set(mArray[i], parseFloat(mArray[i + 1]));
                }
            }
        });

        response['requests_bucket{le="1"}'] = requestsBucket;
        response.requests_sum = requestsSum;
        response.requests_count = requestsCount;
        for (let i = 0; i < sumData.length; i += 2) {
            // get & remove minute val
            // (remove to get new keys that are not in total sum set, see (1))
            const minuteVal = minuteKeys.get(sumData[i]);
            const minuteSet = minuteKeys.delete(sumData[i]);

            if (sumData[i] === 'total_count' || sumData[i] === 'total_sum') continue;

            let val = parseFloat(sumData[i + 1]);
            if (minuteSet) {
                val += parseFloat(minuteVal);
            }
            response[sumData[i]] = val;
        }


        // (1) set new records from the last minute
        minuteKeys.forEach((val, key) => {
            response[key] = val;
        });

        return response;
    }

    /**
     *
     * @returns {number}
     * @private
     */
    _getMinute () {
        return Math.ceil(new Date().getTime() / 60000);
    }

    /**
     *
     * @returns {number}
     * @private
     */
    _getThreshold () {
        return this._getMinute() - this.threshold;
    }
}

module.exports = PrometheusExporter;
