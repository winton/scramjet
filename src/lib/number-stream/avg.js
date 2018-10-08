import {NumberStream} from "./";


/**
 * Calculates the sum of all items in the stream.
 *
 * @async
 * @return {Number}
 */
NumberStream.prototype.avg = async function avg() {
    let cnt = 0;
    const _valueOf = this._valueOf;
    return this.reduce((a, x) => (cnt * a + _valueOf(x)) / ++cnt, 0);
};
