import { DataStream } from "../data-stream";

/**
 * A stream of string objects for further transformation on top of DataStream.
 *
 * Example:
 *
 * ```javascript
 * StringStream.fromString()
 * ```
 *
 * @extends DataStream
 * @borrows StringStream#shift as StringStream#pop
 */
export class StringStream extends DataStream {
    /**
     * Constructs the stream with the given encoding
     *
     * @param  {String} encoding the encoding to use
     * @return {StringStream}  the created data stream
     *
     * @test test/methods/string-stream-constructor.js
     */
    constructor(encoding, options) {

        super(typeof encoding === "string" ? options : encoding);
        this.buffer = "";
        this.encoding = typeof encoding === "string" ? encoding : "utf8";
    }

    /**
     * Alias for {@link StringStream#parse}
     * @function toDataStream
     */

    /**
     * @meta.noReadme
     * @ignore
     */
    async _transform(chunk) {
        this.push(chunk.toString(this.encoding));
    }

}

import "./append";
import "./bufferify";
import "./csv-parse";
import "./from";
import "./from-string";
import "./json-parse";
import "./lines";
import "./match";
import "./parse";
import "./prepend";
import "./replace";
import "./shift";
import "./split";
import "./stringify";
