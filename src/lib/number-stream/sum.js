import {NumberStream} from "./";

/**
 * Calculates the sum of all items in the stream.
 *
 * @async
 * @return {Number}
 */
NumberStream.prototype.sum = async function sum() {
    const _valueOf = this._valueOf;
    return this.reduce((a, x) => a + _valueOf(x), 0);
};
