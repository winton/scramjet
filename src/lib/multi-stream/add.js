import {MultiStream} from "./";
import { EventEmitter } from "events";


/**
 * Adds a stream to the MultiStream
 *
 * If the stream was muxed, filtered or mapped, this stream will undergo the
 * same transorms and conditions as if it was added in constructor.
 *
 * @meta.noReadme
 * @param {stream.Readable} stream [description]
 *
 * @test test/methods/multi-stream-add.js
 */
MultiStream.prototype.add =  function add(stream) {

    if (stream) {
        this.streams.push(stream);
        this.setMaxListeners(this.streams.length + EventEmitter.defaultMaxListeners);
        this.emit("add", stream, this.streams.length - 1);
        stream.on("end", () => this.remove(stream));
    }

    return this;
};
