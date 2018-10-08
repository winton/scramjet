import {BufferStream} from "./";

/**
 * Breaks up a stream apart into chunks of the specified length
 *
 * @chainable
 * @param  {Number} number the desired chunk length
 * @return {BufferStream}  the resulting buffer stream.
 * @example {@link ../samples/buffer-stream-breakup.js}
 */
BufferStream.prototype.breakup = function breakup(number) {
    if (number <= 0 || !isFinite(+number))
        throw new Error("Breakup number is invalid - must be a positive, finite integer.");

    return this.tap().pipe(this._selfInstance({
        transform(chunk, encoding, callback) {
            if (Buffer.isBuffer(this.buffer)) {
                chunk = Buffer.concat([this.buffer, chunk]);
            }
            let offset;
            for (offset = 0; offset < chunk.length - number; offset += number) {
                this.push(chunk.slice(offset, offset + number));
            }
            this.buffer = chunk.slice(offset);
            callback();
        },
        flush(callback) {
            this.push(this.buffer);
            this.buffer = null;
            callback();
        }
    }));

};
