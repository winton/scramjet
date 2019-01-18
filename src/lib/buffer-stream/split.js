import {BufferStream} from "./";

/**
 * Splits the buffer stream into buffer objects
 *
 * @chainable
 * @param  {String|Buffer} splitter the buffer or string that the stream
 *                                  should be split by.
 * @return {BufferStream}  the re-split buffer stream.
 * @test test/methods/buffer-stream-split.js
 */
BufferStream.prototype.split = function split(splitter) {
    if (splitter instanceof Buffer || typeof splitter === "string") {
        const needle = Buffer.from(splitter);
        return this.tap().pipe(this._selfInstance({
            transform(buffer, enc, callback) {
                if (Buffer.isBuffer(this._haystack) && this._haystack.length > 0) {
                    this._haystack = Buffer.from([this._haystack, buffer]);
                } else {
                    this._haystack = buffer;
                }

                let pos;
                while((pos = this._haystack.indexOf(needle)) > -1) {
                    this.push(Buffer.from(this._haystack.slice(0, pos)));
                    this._haystack = this._haystack.slice(pos + needle.length);
                }

                callback();
            },
            flush(callback) {
                if (this._haystack.length) this.push(this._haystack);
                this._haystack = null;
                callback();
            }
        }));
    }
};

