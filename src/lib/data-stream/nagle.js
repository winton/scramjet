import {DataStream} from "./";
/**
 * Performs the Nagle's algorithm on the data. In essence it waits until we receive some more data and releases them
 * in bulk.
 *
 * @memberof DataStream#
 * @todo needs more work, for now it's simply waiting some time, not checking the queues.
 * @param  {number} [size=32] maximum number of items to wait for
 * @param  {number} [ms=10]   milliseconds to wait for more data
 * @chainable
 * @meta.noreadme
 */
DataStream.prototype.nagle = function nagle(size = 32, ms = 10) {
    return this.timeBatch(size, ms)
        .flatten();
};
