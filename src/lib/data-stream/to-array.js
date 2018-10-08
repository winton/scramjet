import {DataStream} from "./";


/**
 * Aggregates the stream into a single Array
 *
 * In fact it's just a shorthand for reducing the stream into an Array.
 *
 * @async
 * @param  {Array} initial Optional array to begin with.
 * @returns {Array}
 */
DataStream.prototype.toArray =  function toArray(initial) {
    return this.reduce(
        (arr, item) => (arr.push(item), arr),
        initial || []
    );
};
