import {StringStream} from "./";


/**
 * Splits the string stream by the specified regexp or string
 *
 * @chainable
 * @param  {RegExp|String} splitter What to split by
 *
 * @test test/methods/string-stream-split.js
 */
StringStream.prototype.split = function split(splitter) {
    if (splitter instanceof RegExp || typeof splitter === "string") {
        return this.tap().pipe(this._selfInstance({
            transform(chunk, encoding, callback) {
                this.buffer += chunk.toString(this.encoding);
                const newChunks = this.buffer.split(splitter);
                while(newChunks.length > 1) {
                    this.push(newChunks.shift());
                }
                this.buffer = newChunks[0];
                callback();
            },
            flush(callback) {
                this.push(this.buffer);
                this.buffer = "";
                callback();
            },
            referrer: this
        }));
    } else if (splitter instanceof Function) {
        return this.tap().pipe(new (this.constructor)({
            transform: splitter,
            referrer: this
        }));
    }
};
