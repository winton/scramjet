import {MultiStream} from "./";
import { EventEmitter } from "events";

/**
 * Removes a stream from the MultiStream
 *
 * If the stream was muxed, filtered or mapped, it will be removed from same
 * streams.
 *
 * @meta.noReadme
 * @param {stream.Readable} stream [description]
 *
 * @test test/methods/multi-stream-remove.js
 */
MultiStream.prototype.remove =  function remove(stream) {

    const strIndex = this.streams.indexOf(stream);
    if (strIndex >= 0) {
        this.setMaxListeners(this.streams.length + EventEmitter.defaultMaxListeners);
        this.streams.splice(strIndex, 1);
        this.emit("remove", stream, strIndex);
    }

    if (!this.streams.length) {
        this.emit("empty");
    }

    return this;
};
