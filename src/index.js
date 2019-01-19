import {DataStream} from "./lib/data-stream";
import {StringStream} from "./lib/string-stream";
import {BufferStream} from "./lib/buffer-stream";
import {NumberStream} from "./lib/number-stream";
import {WindowStream} from "./lib/window-stream";
import {MultiStream} from "./lib/multi-stream";
import {StreamError} from  "./lib/errors";
import scramjet from "scramjet-core";

export default {
    DataStream,
    StringStream,
    BufferStream,
    WindowStream,
    MultiStream,
    NumberStream,
    StreamError,
    ...scramjet
};
