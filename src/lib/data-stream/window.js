import {DataStream} from "./";
import {WindowStream} from "../window-stream";

/**
 * Returns a WindowStream of the specified length
 *
 * @memberof DataStream#
 * @chainable
 * @param {Number} length
 * @returns {WindowStream} a stream of array's
 * @meta.noreadme
 */
DataStream.prototype.window = function window(length) {
    if (!(+length > 0))
        throw new Error("Length argument must be a positive integer!");

    const arr = [];
    return this.into(
        (out, chunk) => {
            arr.push(chunk);
            if (arr.length > length)
                arr.shift();

            return out.whenWrote(arr.slice());
        },
        new WindowStream()
    );
};
