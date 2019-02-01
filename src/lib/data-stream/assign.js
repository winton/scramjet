import {DataStream} from "./";

/**
 * Transforms stream objects by assigning the properties from the returned
 * data along with data from original ones.
 *
 * The original objects are unaltered.
 *
 * @chainable
 * @param {DataStream.MapCallback|Object} func The function that returns new object properties or just the new properties
 *
 * @test test/methods/data-stream-assign.js
 */
DataStream.prototype.assign = function assign(func) {
    if (typeof func === "function") {
        return this.map(
            (chunk) => Promise.resolve(func(chunk))
                .then(obj => Object.assign({}, chunk, obj))
        );
    } else {
        return this.map(
            (chunk) => Object.assign({}, chunk, func)
        );
    }
};
