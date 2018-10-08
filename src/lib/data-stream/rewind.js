import {DataStream} from "./";


/**
 * Rewinds the buffered chunks the specified length backwards. Requires a prior call to {@see DataStream..keep}
 *
 * @chainable
 * @memberof DataStream#
 * @param {number} count Number of objects or -1 for all the buffer
 */
DataStream.prototype.rewind = function rewind(count = -1) {
    if (count < 0)
        count = Infinity;

    if (this.buffer) {
        return this.buffer.tail(count).pipe(this._selfInstance());
    } else {
        throw new Error("Stream not buffered, cannot rewind.");
    }
};
