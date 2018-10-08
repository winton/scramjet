import {DataStream} from "./";

/**
 * Transforms stream objects by assigning the properties from the returned
 * data along with data from original ones.
 *
 * The original objects are unaltered.
 *
 * @chainable
 * @memberof DataStream#
 * @param {MapCallback|Object} func The function that returns new object properties or just the new properties
 *
 * @example {@link ../samples/data-stream-assign.js}
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
