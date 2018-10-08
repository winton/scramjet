import {BufferStream} from "./";
import {DataStream} from "../data-stream";

/**
 * @callback ParseCallback
 * @param {Buffer} chunk the transformed chunk
 * @return {Promise}  the promise should be resolved with the parsed object
 */

/**
 * Parses every buffer to object
 *
 * The method MUST parse EVERY buffer into a single object, so the buffer
 * stream here should already be split or broken up.
 *
 * @param  {ParseCallback} parser The transform function
 * @return {DataStream}  The parsed objects stream.
 * @example {@link ../samples/buffer-stream-parse.js}
 */
BufferStream.prototype.parse = function parse(parser) {
    return this.tap().map(parser, DataStream);
};

