import {DataStream} from "./";
import {BufferStream} from "../buffer-stream";

/**
 * Creates a BufferStream
 *
 * @meta.noReadme
 * @chainable
 * @param  {MapCallback} serializer A method that converts chunks to buffers
 * @return {BufferStream}  the resulting stream
 *
 * @example {@link ../samples/data-stream-tobufferstream.js}
 */
DataStream.prototype.bufferify = function (serializer) {
    return this.map(serializer, BufferStream);
};

DataStream.prototype.toBufferStream = DataStream.prototype.bufferify;
