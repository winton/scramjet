import {BufferStream} from "./";
import {StringStream} from "../string-stream";

/**
 * Creates a string stream from the given buffer stream
 *
 * Still it returns a DataStream derivative and isn't the typical node.js
 * stream so you can do all your transforms when you like.
 *
 * @param  {String} encoding The encoding to be used to convert the buffers
 *                           to streams.
 * @return {StringStream}  The converted stream.
 * @test test/methods/buffer-stream-tostringstream.js
 */
BufferStream.prototype.stringify = function stringify(encoding) {
    return this.pipe(new StringStream(encoding || "utf-8", {objectMode: true}));
};

/**
 * Alias for {@link BufferStream#stringify}
 * @function toStringStream
 */

