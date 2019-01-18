import { DataStream } from "../data-stream";

/**
 * A factilitation stream created for easy splitting or parsing buffers.
 *
 * Useful for working on built-in Node.js streams from files, parsing binary formats etc.
 *
 * A simple use case would be:
 *
 * ```javascript
 *  fs.createReadStream('pixels.rgba')
 *      .pipe(new BufferStream)         // pipe a buffer stream into scramjet
 *      .breakup(4)                     // split into 4 byte fragments
 *      .parse(buf => [
 *          buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
 *          buf.readInt8(1),            // values from 0-255 in an array.
 *          buf.readInt8(2),
 *          buf.readInt8(3)
 *      ]);
 * ```
 *
 * @extends DataStream
 */
export class BufferStream extends DataStream {

    /**
     * Creates the BufferStream
     *
     * @param {object} opts Stream options passed to superclass
     * @test test/methods/buffer-stream-constructor.js
     */
    constructor(...args) {
        super(...args);
        this._buffer = [];
    }

    /**
     * @ignore
     */
    async _transform(chunk, encoding) {
        this.push(Buffer.from(chunk, encoding));
    }

}

import "./breakup";
import "./from";
import "./parse";
import "./shift";
import "./split";
import "./stringify";
