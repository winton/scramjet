import {StringStream} from "./";


/**
 * @callback ShiftCallback
 * @param {String} shifted Popped chars
 */

/**
 * Shifts given length of chars from the original stream
 *
 * Works the same way as {@see DataStream.shift}, but in this case extracts
 * the given number of characters.
 *
 * @chainable
 * @param {Number} bytes The number of characters to shift.
 * @param {ShiftCallback} func Function that receives a string of shifted chars.
 *
 * @test test/methods/string-stream-shift.js
 */
StringStream.prototype.shift = function shift(bytes, func) {
    const ret = "";
    const str = this.tap()._selfInstance({
        referrer: this
    });
    let offs = 0;

    const chunkHandler = (chunk) => {
        const length = Math.min(bytes - offs, chunk.length);
        chunk.substr(0, length);
        offs += length;
        if (length >= bytes) {
            unHook()
                .then(
                    () => {
                        str.write(chunk.slice(length));
                        this.pipe(str);
                    }
                );
        }
    };

    const endHandler = (...args) => {
        if (ret.length < bytes) {
            unHook();
        }
        str.end(...args);
    };

    const errorHandler = str.emit.bind(str, "error");

    const unHook = () => {  // jshint ignore:line
        this.removeListener("data", chunkHandler);
        this.removeListener("end", endHandler);
        this.removeListener("error", errorHandler);
        return Promise.resolve(ret)
            .then(func);
    };


    this.on("data", chunkHandler);
    this.on("end", endHandler);
    this.on("error", errorHandler);

    return str;
};
