import {DataStream} from "./";

/**
 * @callback FilterCallback
 * @param {*} chunk the chunk to be filtered or not
 * @returns {Promise|Boolean}  information if the object should remain in
 *                             the filtered stream.
 */

/**
 * Filters object based on the function outcome, just like
 * Array.prototype.filter.
 *
 * @chainable
 * @param  {FilterCallback} func The function that filters the object
 *
 * @test test/methods/data-stream-filter.js
 */
DataStream.prototype.filter = function (func) {
    return this.pipe(this._selfInstance({
        promiseTransform: func,
        afterTransform: (chunk, ret) => ret ? chunk : Promise.reject(DataStream.filter),
        referrer: this
    }));
};
