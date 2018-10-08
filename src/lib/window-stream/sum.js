import {WindowStream} from "./";

/**
 * Calculates moving sum of items, the output stream will contain the moving sum.
 *
 * @chainable
 * @param {Function} [valueOf] value of method for array items
 * @return {Promise.<Number>}
 */
WindowStream.prototype.sum = function(valueOf = (x) => +x) {
    return this.map(
        arr => arr.reduce((a, x) => a + valueOf(x))
    );
};
