import {DataStream} from "./";

/**
 * Gets a slice of the stream to the callback function.
 *
 * Returns a stream consisting of an array of items with `0` to `start`
 * omitted and `length` items after `start` included. Works similarily to
 * Array.prototype.slice.
 *
 * Takes count from the moment it's called. Any previous items will not be
 * taken into account.
 *
 * @chainable
 * @memberof DataStream#
 * @param {Number} [start=0] omit this number of entries.
 * @param {Number} [length=Infinity] get this number of entries to the resulting stream
 *
 * @test test/methods/data-stream-slice.js
 */
DataStream.prototype.slice = function slice(start = 0, length = Infinity) {
    let n = 0;
    return this.shift(start, () => 0)
        .until(() => n++ >= length);
};
