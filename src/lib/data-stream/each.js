import {DataStream} from "./";

/**
 * Performs an operation on every chunk, without changing the stream
 *
 * This is a shorthand for ```stream.on("data", func)``` but with flow control.
 * Warning: this resumes the stream!
 *
 * @chainable
 * @param  {MapCallback} func a callback called for each chunk.
 */
DataStream.prototype.each = function (func) {
    return this.tap().map(
        (a) => Promise.resolve(func(a))
            .then(() => a)
    ).resume();
};
