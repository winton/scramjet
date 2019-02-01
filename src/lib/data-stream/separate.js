import {DataStream} from "./";
import { MultiStream } from "../multi-stream";

/**
 * Separates execution to multiple streams using the hashes returned by the passed callback.
 *
 * Calls the given callback for a hash, then makes sure all items with the same hash are processed within a single
 * stream. Thanks to that streams can be distributed to multiple threads.
 *
 * @meta.noreadme
 * @chainable
 * @param {AffinityCallback} affinity the callback function
 * @param {Object} createOptions options to use to create the separated streams
 * @return {MultiStream} separated stream
 *
 * @test test/methods/data-stream-separate.js
 */
DataStream.prototype.separate = function separate(affinity, createOptions, CreateClass) {
    const ret = new MultiStream();
    const hashes = new Map();

    CreateClass = CreateClass || this.constructor;

    const pushChunk = (hash, chunk) => {
        let rightStream;
        if (!hashes.has(hash)) {
            rightStream = new CreateClass(createOptions);
            rightStream._separateId = hash;
            hashes.set(hash, rightStream);
            ret.add(rightStream);
        } else {
            rightStream = hashes.get(hash);
        }

        return rightStream.whenWrote(chunk);
    };

    this.pipe(
        new this.constructor({
            async promiseTransform(chunk) {
                try {
                    const hash = await affinity(chunk);

                    if (Array.isArray(hash))
                        return Promise.all(hash.map(str => pushChunk(str, chunk)));

                    return pushChunk(hash, chunk);
                } catch (e) {
                    ret.emit("error", e);
                }
            },
            referrer: this
        })
            .on("end", () => {
                ret.streams.forEach(stream => stream.end());
            })
            .resume()
    );

    return ret;
};

DataStream.prototype.group = DataStream.prototype.separate;
