import {BufferStream} from "./";

/**
 * Shift callback
 *
 * @callback ShiftCallback
 * @param {Buffer} shifted shifted bytes
 */

/**
 * Shift given number of bytes from the original stream
 *
 * Works the same way as {@see DataStream.shift}, but in this case extracts
 * the given number of bytes.
 *
 * @chainable
 * @param {Number} chars The number of bytes to shift
 * @param {ShiftCallback} func Function that receives a string of shifted bytes
 * @return {BufferStream} substream
 *
 * @test test/methods/string-stream-shift.js
 */
BufferStream.prototype.shift = function(bytes, func) {
    const ret = Buffer.alloc(bytes);
    const str = this.tap()._selfInstance();
    let offs = 0;

    const chunkHandler = (chunk) => {
        const length = Math.min(ret.length - offs, chunk.length);
        chunk.copy(ret, offs, 0, length);
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

    const unHook = (async () => {
        this.removeListener("data", chunkHandler);
        this.removeListener("end", endHandler);
        this.removeListener("error", errorHandler);
        return func(ret);
    });


    this.on("data", chunkHandler);
    this.on("end", endHandler);
    this.on("error", errorHandler);

    return str;
};

