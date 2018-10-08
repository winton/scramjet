import {DataStream} from "./";

/**
 * Aggregates chunks in arrays given number of number of items long.
 *
 * This can be used for microbatch processing.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {Number} count How many items to aggregate
 *
 * @example {@link ../samples/data-stream-batch.js}
 */
DataStream.prototype.batch = function batch(count) {
    let arr = [];

    const ret = this.tap().pipe(new this.constructor({
        promiseTransform(chunk) {
            arr.push(chunk);
            if (arr.length >= count) {
                const push = arr;
                arr = [];
                return push;
            }
            return Promise.reject(DataStream.filter);
        },
        promiseFlush() {
            if (arr.length > 0) {
                return [arr];
            } else
                return [];
        },
        referrer: this
    }));

    return ret;
};
