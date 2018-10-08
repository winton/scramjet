import {StringStream} from "./";
import { BufferStream } from "../buffer-stream";

/**
 * Transforms the StringStream to BufferStream
 *
 * Creates a buffer stream from the given string stream. Still it returns a
 * DataStream derivative and isn't the typical node.js stream so you can do
 * all your transforms when you like.
 *
 * @meta.noReadme
 * @chainable
 * @return {BufferStream}  The converted stream.
 *
 * @example {@link ../samples/string-stream-tobufferstream.js}
 */
StringStream.prototype.toBufferStream =  function toBufferStream() {
    return this.tap().map(
        (str) => Buffer.from(str, this.encoding),
        new BufferStream({
            referrer: this
        })
    );
};
