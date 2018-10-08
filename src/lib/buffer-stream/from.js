import {BufferStream} from "./";
import {DataStream} from "../data-stream";

/**
 * Create BufferStream from anything.
 *
 * @see module:scramjet.from
 *
 * @param {Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} str argument to be turned into new stream
 * @param {StreamOptions|Writable} options
 * @return {BufferStream}          new StringStream.
 */
BufferStream.from = function from(...args) {
    return DataStream.from.call(this, ...args);
};
