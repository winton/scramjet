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
     * @example {@link ../samples/string-stream-constructor.js}
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
