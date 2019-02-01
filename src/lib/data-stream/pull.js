import {DataStream} from "./";

/**
 * Pulls in any Readable stream, resolves when the pulled stream ends.
 *
 * Does not preserve order, does not end this stream.
 *
 * @async
 * @param {Readable} incoming
 * @returns {Number} resolved when incoming stream ends, rejects on incoming error
 *
 * @example {@include ../samples/data-stream-pull.js}
 */
DataStream.prototype.pull = async function(incoming) {
    return new Promise((res, rej) => {
        incoming.pipe(this, { end: false });
        incoming.on("end", res);
        incoming.on("error", rej);
    });
};
