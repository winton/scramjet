import {ScramjetStream} from "scramjet-core";

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
 * @borrows DataStream#bufferify as DataStream#toBufferStream
 * @borrows DataStream#stringify as DataStream#toStringStream
 * @extends ScramjetStream
 */
export class DataStream extends ScramjetStream {

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

import "./accumulate";
import "./consume";
import "./do";
import "./flat-map";
import "./map";
import "./reduce-now";
import "./separate-into";
import "./time-batch";
import "./unshift";
import "./assign";
import "./csv-stringify";
import "./each";
import "./flatten";
import "./into";
import "./nagle";
import "./remap";
import "./shift";
import "./to-array";
import "./until";
import "./batch";
import "./debug";
import "./empty";
import "./from";
import "./join";
import "./peek";
import "./rewind";
import "./slice";
import "./to-generator";
import "./use";
import "./bufferify";
import "./delegate";
import "./end-with";
import "./from-array";
import "./json-stringify";
import "./pull";
import "./run";
import "./stringify";
import "./to-json-array";
import "./while";
import "./concat";
import "./distribute";
import "./filter";
import "./from-iterator";
import "./keep";
import "./reduce";
import "./separate";
import "./tee";
import "./to-json-object";
import "./window";
