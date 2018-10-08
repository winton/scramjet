import {DataStream} from "./";
import {StreamError} from "../errors";
import { Readable } from "stream";
import { GeneratorFunction, AsyncGeneratorFunction, pipeIfTarget } from "../util";

/**
 * Returns a DataStream from pretty much anything sensibly possible.
 *
 * Depending on type:
 * * `self` will return self immediately
 * * `Readable` stream will get piped to the current stream with errors forwarded
 * * `Array` will get iterated and all items will be pushed to the returned stream.
 *   The stream will also be ended in such case.
 * * `GeneratorFunction` will get executed to return the iterator which will be used as source for items
 * * `AsyncGeneratorFunction` will also work as above (including generators) in node v10.
 * * `Iterable`s iterator will be used as a source for streams
 *
 * You can also pass a `Function` or `AsyncFunction` that will result in anything passed to `from`
 * subsequently. You can use your stream immediately though.
 *
 * @param {Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|String|Readable} str argument to be turned into new stream
 * @param {StreamOptions|Writable} options
 * @return {DataStream}
 */
DataStream.from = function(stream, options, ...args) {
    const target = options instanceof this && options;

    if (stream instanceof this) {
        return target ? stream.pipe(target) : stream;
    }

    if (stream instanceof Readable || (
        typeof stream.readable === "boolean" &&
        typeof stream.pipe === "function" &&
        typeof stream.on === "function"
    )) {
        const out = target || new this(
            Object.assign(
                {},
                options,
                { referrer: stream instanceof DataStream ? stream : null }
            )
        );

        stream.pipe(out);
        stream.on("error", e => out.raise(e));
        return out;
    }

    if (stream instanceof GeneratorFunction || stream instanceof AsyncGeneratorFunction) {
        const iterator = stream(...args);
        const iteratorStream = this.fromIterator(iterator, options);
        return pipeIfTarget(iteratorStream, target);
    }

    if (Array.isArray(stream))
        return pipeIfTarget(this.fromArray(stream, options), target);

    const iter = stream[Symbol.iterator] || stream[Symbol.asyncIterator];
    if (iter)
        return pipeIfTarget(this.fromIterator(iter(), options), target);

    if (typeof stream === "function") {
        const out = new this(Object.assign({}, options));

        Promise.resolve(options)
            .then(stream)
            .then(source => this.from(source, out))
            .catch(e => out.raise(new StreamError(e, out, "EXTERNAL", null)));

        return out;
    }

    throw new Error("Cannot return a stream from passed object");
};
