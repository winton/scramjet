import {WindowStream} from "./";


/**
 * Calculates the moving average of all items in the stream.
 *
 * @chainable
 * @param {Function} [valueOf] value of method for array items
 * @return {Promise.<Number>}
 */
WindowStream.prototype.avg = function (valueOf = (x) => +x) {
    let cnt = 0;
    return this.map(
        arr => arr.reduce((a, x) => (cnt * a + valueOf(x)) / ++cnt, 0)
    );
};
