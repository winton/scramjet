import {PromiseTransformStream} from "scramjet-core";

/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * Use as:
 *
 * ```javascript
 * const { DataStream } = require('scramjet');
 *
 * await (DataStream.from(aStream) // create a DataStream
 *     .map(findInFiles)           // read some data asynchronously
 *     .map(sendToAPI)             // send the data somewhere
 *     .run());                    // wait until end
 * ```
 *
 * @template T
 * @borrows DataStream#bufferify as DataStream#toBufferStream
 * @borrows DataStream#stringify as DataStream#toStringStream
 * @extends PromiseTransformStream
 */
export class DataStream extends PromiseTransformStream {

    constructor(opts) {
        super(Object.assign({
            objectMode: true,
            writableObjectMode: true,
            readableObjectMode: true
        }, opts));

        this.TimeSource = Date;
        this.setTimeout = setTimeout;
        this.clearTimeout = clearTimeout;

        this.buffer = null;
    }

}
