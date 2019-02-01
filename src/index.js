/**
 * @module scramjet
 */
import {DataStream} from "./lib/data-stream";

export {DataStream} from "./lib/data-stream";
export {StringStream} from "./lib/string-stream";
export {BufferStream} from "./lib/buffer-stream";
export {NumberStream} from "./lib/number-stream";
export {WindowStream} from "./lib/window-stream";
export {MultiStream} from "./lib/multi-stream";

export {
    PromiseTransformStream,
    MultiTransform,
    ScramjetOptions,
    StreamError
} from "scramjet-core";

export const from = (...args) => DataStream.from(...args);
