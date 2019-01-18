import { ScramjetStream, PromiseTransformStream } from 'scramjet-core';
import { EventEmitter } from 'events';
import os, { EOL, cpus } from 'os';
import { dirname, resolve } from 'path';
import { Readable, Writable } from 'stream';
import { ReReadable } from 'rereadable-stream';
import { fork } from 'child_process';
import net from 'net';

/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * Use as:
 *
 * ```javascript
 * const { DataStream } = require('scramjet');
 *
 * await (DataStream.from(aStream) // create a DataStream
 *     .map(findInFiles)           // read some data asynchronously
 *     .map(sendToAPI)             // send the data somewhere
 *     .run());                    // wait until end
 * ```
 *
 * @borrows DataStream#bufferify as DataStream#toBufferStream
 * @borrows DataStream#stringify as DataStream#toStringStream
 * @extends ScramjetStream
 */
class DataStream extends ScramjetStream {

    constructor(opts) {
        super(Object.assign({
            objectMode: true,
            writableObjectMode: true,
            readableObjectMode: true
        }, opts));

        this.TimeSource = Date;
        this.setTimeout = setTimeout;
        this.clearTimeout = clearTimeout;

        this.buffer = null;
    }

}

/**
 * @callback AccumulateCallback
 * @param {*} acc Accumulator passed to accumulate function
 * @param {*} chunk the stream chunk
 * @return {Promise|*} resolved when all operations are completed
 */

/**
 * Accumulates data into the object.
 *
 * Works very similarily to reduce, but result of previous operations have
 * no influence over the accumulator in the next one.
 *
 * Method is parallel
 *
 * @async
 * @memberof DataStream#
 * @param  {AccumulateCallback} func The accumulation function
 * @param  {*} into Accumulator object
 * @return {Promise}  resolved with the "into" object on stream end.
 * @meta.noreadme
 *
 * @test test/methods/data-stream-accumulate.js
 */
DataStream.prototype.accumulate = async function accumulate(func, into) {
    return new Promise((res, rej) => {
        const bound = async (chunk) => (await func(into, chunk), Promise.reject(DataStream.filter));
        bound.to = func;

        this.tap().pipe(new PromiseTransformStream({ // TODO:
            promiseTransform: bound,
            referrer: this
        }))
            .on("end", () => res(into))
            .on("error", rej)
            .resume();
    });
};

/**
 * @callback ConsumeCallback
 * @param {*} chunk the stream chunk
 * @return {Promise|*} resolved when all operations are completed
 */

/**
 * Consumes the stream by running each callback
 * @deprecated use {@link DataStream#each} instead
 *
 * @async
 * @memberof DataStream#
 * @param  {Function}  func the consument
 * @meta.noreadme
 */
DataStream.prototype.consume = async function consume(func) {
    return this.tap()
        .each(func)
        .whenEnd();
};

/**
 * @callback DoCallback
 * @async
 * @param {Object} chunk source stream chunk
 */

/**
 * Perform an asynchroneous operation without changing or resuming the stream.
 *
 * In essence the stream will use the call to keep the backpressure, but the resolving value
 * has no impact on the streamed data (except for possile mutation of the chunk itself)
 *
 * @chainable
 * @param {DoCallback} func the async function
 */
DataStream.prototype.do = function(func) {
    return this.map(async (chunk) => (await func(chunk), chunk));
};

// TODO: rethink

/**
 * Takes any method that returns any iterable and flattens the result.
 *
 * The passed callback must return an iterable (otherwise an error will be emitted). The resulting stream will
 * consist of all the items of the returned iterables, one iterable after another.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {FlatMapCallback} func A callback that is called on every chunk
 * @param  {class} Clazz Optional DataStream subclass to be constructed
 * @return {DataStream}  a new DataStream of the given class with new chunks
 *
 * @test test/methods/data-stream-flatmap.js
 */
DataStream.prototype.flatMap = function flatMap(func, Clazz = DataStream) {
    const ref = new Clazz({referrer: this});

    return this.into(
        async (ref, chunk) => {
            const out = await func(chunk);

            let last = true;
            for (const val of out)
                last = ref.write(val);

            return last ? null : ref.whenDrained();
        },
        ref
    );
};

/**
 * @callback FlatMapCallback
 * @param {*} chunk the chunk from the original stream
 * @returns {Promise<Iterable>|Iterable}  promise to be resolved when chunk has been processed
 */

/**
 * @callback MapCallback
 * @param {*} chunk the chunk to be mapped
 * @returns {Promise|*}  the mapped object
 */

/**
 * Transforms stream objects into new ones, just like Array.prototype.map
 * does.
 *
 * @param {MapCallback} func The function that creates the new object
 * @param {Class} Clazz (optional) The class to be mapped to.
 * @chainable
 *
 * @test test/methods/data-stream-map.js
 */
DataStream.prototype.map = function (func, Clazz) {
    Clazz = Clazz || this.constructor;
    return this.pipe(new Clazz({
        promiseTransform: func,
        referrer: this
    }));
};

/**
 * Reduces the stream into the given object, returning it immediately.
 *
 * The main difference to reduce is that only the first object will be
 * returned at once (however the method will be called with the previous
 * entry).
 * If the object is an instance of EventEmitter then it will propagate the
 * error from the previous stream.
 *
 * This method is serial - meaning that any processing on an entry will
 * occur only after the previous entry is fully processed. This does mean
 * it's much slower than parallel functions.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {ReduceCallback} func The into object will be passed as the first
 * argument, the data object from the stream as the second.
 * @param  {*|EventEmitter} into Any object passed initally to the transform
 * function
 * @return {*} whatever was passed as into
 *
 * @test test/methods/data-stream-reduceNow.js
 */
DataStream.prototype.reduceNow = function reduceNow(func, into) {
    const prm = this.reduce(func, into);

    if (into instanceof EventEmitter) {
        prm.catch((e) => into.emit("error", e));
    }

    return into;
};

/**
 * Seprates stream into a hash of streams. Does not create new streams!
 *
 * @chainable
 * @meta.noreadme
 * @memberof DataStream#
 * @param {Object<DataStream>} streams the object hash of streams. Keys must be the outputs of the affinity function
 * @param {AffinityCallback} affinity the callback function that affixes the item to specific streams which must exist in the object for each chunk.
 */
DataStream.prototype.separateInto = function separateInto(streams, affinity) {
    this.consume(
        async (chunk) => {
            const streamId = await affinity(chunk);
            const found = streams[streamId];

            if (found) {
                return found.whenWrote(chunk);
            }

            throw new Error("Output for " + streamId + " not found in " + JSON.stringify(chunk));
        }
    );
    return this;
};

/**
 * Aggregates chunks to arrays not delaying output by more than the given number of ms.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {Number} ms    Maximum ammount of milliseconds
 * @param  {Number} count Maximum number of items in batch (otherwise no limit)
 *
 * @test test/methods/data-stream-timebatch.js
 */
DataStream.prototype.timeBatch = function timeBatch(ms, count = Infinity) {
    let arr = [];

    const setTimeout = this.setTimeout;
    const clearTimeout = this.clearTimeout;

    let ret = this._selfInstance({referrer: this});

    let pushTimeout = null;

    const push = () => {
        if (pushTimeout) {
            clearTimeout(pushTimeout);
            pushTimeout = null;
        }
        const last = ret.whenWrote(arr);
        arr = [];
        return last;
    };

    this.consume(async (chunk) => {
        arr.push(chunk);
        if (arr.length >= count) {
            await push();
        } else if (!pushTimeout) {
            pushTimeout = setTimeout(push, ms);
        }
    }).then(async () => {
        if (arr.length) {
            clearTimeout(pushTimeout);
            await ret.whenWrote(arr);
        }
        ret.end();
    });

    return ret;
};

/**
 * Pushes any data at call time (essentially at the beginning of the stream)
 *
 * This is a synchronous only function.
 *
 * @chainable
 * @memberof DataStream#
 * @param {*} item list of items to unshift (you can pass more items)
 */
DataStream.prototype.unshift = function unshift(...items) {
    items.forEach(
        item => this.write(item)
    );
    return this.tap();
};

/**
 * Transforms stream objects by assigning the properties from the returned
 * data along with data from original ones.
 *
 * The original objects are unaltered.
 *
 * @chainable
 * @memberof DataStream#
 * @param {MapCallback|Object} func The function that returns new object properties or just the new properties
 *
 * @test test/methods/data-stream-assign.js
 */
DataStream.prototype.assign = function assign(func) {
    if (typeof func === "function") {
        return this.map(
            (chunk) => Promise.resolve(func(chunk))
                .then(obj => Object.assign({}, chunk, obj))
        );
    } else {
        return this.map(
            (chunk) => Object.assign({}, chunk, func)
        );
    }
};

/**
 * A stream of string objects for further transformation on top of DataStream.
 *
 * Example:
 *
 * ```javascript
 * StringStream.fromString()
 * ```
 *
 * @extends DataStream
 * @borrows StringStream#shift as StringStream#pop
 */
class StringStream extends DataStream {
    /**
     * Constructs the stream with the given encoding
     *
     * @param  {String} encoding the encoding to use
     * @return {StringStream}  the created data stream
     *
     * @test test/methods/string-stream-constructor.js
     */
    constructor(encoding, options) {

        super(typeof encoding === "string" ? options : encoding);
        this.buffer = "";
        this.encoding = typeof encoding === "string" ? encoding : "utf8";
    }

    /**
     * Alias for {@link StringStream#parse}
     * @function toDataStream
     */

    /**
     * @meta.noReadme
     * @ignore
     */
    async _transform(chunk) {
        this.push(chunk.toString(this.encoding));
    }

}

/**
 * Appends given argument to all the items.
 *
 * @chainable
 * @memberof StringStream#
 * @param {Function|String} arg the argument to append. If function passed then it will be called and resolved and the resolution will be appended.
 *
 * @test test/methods/string-stream-append.js
 */
StringStream.prototype.append = function append(arg) {
    return typeof arg === "function" ? this.map(item => Promise.resolve(item).then(arg).then((result) => item + result)) : this.map(item => item + arg);
};

/**
 * A factilitation stream created for easy splitting or parsing buffers.
 *
 * Useful for working on built-in Node.js streams from files, parsing binary formats etc.
 *
 * A simple use case would be:
 *
 * ```javascript
 *  fs.createReadStream('pixels.rgba')
 *      .pipe(new BufferStream)         // pipe a buffer stream into scramjet
 *      .breakup(4)                     // split into 4 byte fragments
 *      .parse(buf => [
 *          buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
 *          buf.readInt8(1),            // values from 0-255 in an array.
 *          buf.readInt8(2),
 *          buf.readInt8(3)
 *      ]);
 * ```
 *
 * @extends DataStream
 */
class BufferStream extends DataStream {

    /**
     * Creates the BufferStream
     *
     * @param {object} opts Stream options passed to superclass
     * @test test/methods/buffer-stream-constructor.js
     */
    constructor(...args) {
        super(...args);
        this._buffer = [];
    }

    /**
     * @ignore
     */
    async _transform(chunk, encoding) {
        this.push(Buffer.from(chunk, encoding));
    }

}

/**
 * Breaks up a stream apart into chunks of the specified length
 *
 * @chainable
 * @param  {Number} number the desired chunk length
 * @return {BufferStream}  the resulting buffer stream.
 * @test test/methods/buffer-stream-breakup.js
 */
BufferStream.prototype.breakup = function breakup(number) {
    if (number <= 0 || !isFinite(+number))
        throw new Error("Breakup number is invalid - must be a positive, finite integer.");

    return this.tap().pipe(this._selfInstance({
        transform(chunk, encoding, callback) {
            if (Buffer.isBuffer(this.buffer)) {
                chunk = Buffer.concat([this.buffer, chunk]);
            }
            let offset;
            for (offset = 0; offset < chunk.length - number; offset += number) {
                this.push(chunk.slice(offset, offset + number));
            }
            this.buffer = chunk.slice(offset);
            callback();
        },
        flush(callback) {
            this.push(this.buffer);
            this.buffer = null;
            callback();
        }
    }));

};

/**
 * Create BufferStream from anything.
 *
 * @see module:scramjet.from
 *
 * @param {Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} str argument to be turned into new stream
 * @param {StreamOptions|Writable} options
 * @return {BufferStream}          new StringStream.
 */
BufferStream.from = function from(...args) {
    return DataStream.from.call(this, ...args);
};

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
 * @test test/methods/buffer-stream-parse.js
 */
BufferStream.prototype.parse = function parse(parser) {
    return this.tap().map(parser, DataStream);
};

/**
 * Shift callback
 *
 * @callback ShiftCallback
 * @param {Buffer} shifted shifted bytes
 */

/**
 * Shift given number of bytes from the original stream
 *
 * Works the same way as {@see DataStream.shift}, but in this case extracts
 * the given number of bytes.
 *
 * @chainable
 * @param {Number} chars The number of bytes to shift
 * @param {ShiftCallback} func Function that receives a string of shifted bytes
 * @return {BufferStream} substream
 *
 * @test test/methods/string-stream-shift.js
 */
BufferStream.prototype.shift = function(bytes, func) {
    const ret = Buffer.alloc(bytes);
    const str = this.tap()._selfInstance();
    let offs = 0;

    const chunkHandler = (chunk) => {
        const length = Math.min(ret.length - offs, chunk.length);
        chunk.copy(ret, offs, 0, length);
        offs += length;
        if (length >= bytes) {
            unHook()
                .then(
                    () => {
                        str.write(chunk.slice(length));
                        this.pipe(str);
                    }
                );
        }
    };

    const endHandler = (...args) => {
        if (ret.length < bytes) {
            unHook();
        }
        str.end(...args);
    };

    const errorHandler = str.emit.bind(str, "error");

    const unHook = (async () => {
        this.removeListener("data", chunkHandler);
        this.removeListener("end", endHandler);
        this.removeListener("error", errorHandler);
        return func(ret);
    });


    this.on("data", chunkHandler);
    this.on("end", endHandler);
    this.on("error", errorHandler);

    return str;
};

/**
 * Splits the buffer stream into buffer objects
 *
 * @chainable
 * @param  {String|Buffer} splitter the buffer or string that the stream
 *                                  should be split by.
 * @return {BufferStream}  the re-split buffer stream.
 * @test test/methods/buffer-stream-split.js
 */
BufferStream.prototype.split = function split(splitter) {
    if (splitter instanceof Buffer || typeof splitter === "string") {
        const needle = Buffer.from(splitter);
        return this.tap().pipe(this._selfInstance({
            transform(buffer, enc, callback) {
                if (Buffer.isBuffer(this._haystack) && this._haystack.length > 0) {
                    this._haystack = Buffer.from([this._haystack, buffer]);
                } else {
                    this._haystack = buffer;
                }

                let pos;
                while((pos = this._haystack.indexOf(needle)) > -1) {
                    this.push(Buffer.from(this._haystack.slice(0, pos)));
                    this._haystack = this._haystack.slice(pos + needle.length);
                }

                callback();
            },
            flush(callback) {
                if (this._haystack.length) this.push(this._haystack);
                this._haystack = null;
                callback();
            }
        }));
    }
};

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
 * @test test/methods/string-stream-tobufferstream.js
 */
StringStream.prototype.toBufferStream =  function toBufferStream() {
    return this.tap().map(
        (str) => Buffer.from(str, this.encoding),
        new BufferStream({
            referrer: this
        })
    );
};

/**
 * Parses CSV to DataString using 'papaparse' module.
 *
 * @chainable
 * @memberof StringStream#
 * @param options options for the papaparse.parse method.
 * @return {DataStream}  stream of parsed items
 * @test test/methods/data-stream-separate.js
 */
StringStream.prototype.CSVParse = function CSVParse(options = {}) {
    const out = new DataStream();
    require("papaparse").parse(this, Object.assign(options, {
        chunk: async ({data, errors}, parser) => {
            if (errors.length) {
                return out.raise(Object.assign(new Error(), errors[0]));
            }

            if (!out.write(data)) {
                parser.pause();
                await out.whenDrained();
                parser.resume();
            }
        },
        complete: () => {
            out.end();
        },
        error: (e) => {
            out.emit("error", e);
        }
    }));

    return out.flatten();
};

/**
 * Create StringStream from anything.
 *
 * @see module:scramjet.from
 *
 * @param {String|Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} str argument to be turned into new stream
 * @param {StreamOptions|Writable} options
 * @return {StringStream}          new StringStream.
 */
StringStream.prototype.from =  function from(source, options, ...args) {
    try {
        return DataStream.from.call(this, source, options, ...args);
    } catch(e) {
        if (typeof source === "string") {
            return this.fromString(source);
        }
        throw e;
    }
};

/**
 * Creates a StringStream and writes a specific string.
 *
 * @param  {String} str      the string to push the your stream
 * @param  {String} encoding optional encoding
 * @return {StringStream}          new StringStream.
 */
StringStream.prototype.fromString =  function fromString(str, encoding) {
    const st =  new this(encoding || "utf-8");
    st.end(str);
    return st;
};

/**
 * Parses each entry as JSON.
 * Ignores empty lines
 *
 * @chainable
 * @memberof StringStream#
 * @param {Boolean} perLine instructs to split per line
 * @return {DataStream}  stream of parsed items
 */
StringStream.prototype.JSONParse = function JSONParse(perLine = true) {
    let str = this;
    if (perLine) {
        str = str.lines();
    }

    return str.filter(a => a !== "").parse(JSON.parse);
};

/**
 * Splits the string stream by the specified regexp or string
 *
 * @chainable
 * @memberof StringStream#
 * @param  {String} [eol=/\r?\n/] End of line string
 *
 * @test test/methods/string-stream-split.js
 */
StringStream.prototype.lines = function lines(eol = /\r?\n/) {
    return this.split(eol);
};

/**
 * Finds matches in the string stream and streams the match results
 *
 * @chainable
 * @param  {RegExp} matcher A function that will be called for every
 *                             stream chunk.
 *
 * @test test/methods/string-stream-match.js
 */
StringStream.prototype.match = function match(matcher) {
    if (matcher instanceof RegExp) {
        const replaceRegex = (matcher.source.search(/\((?!\?)/g) > -1) ?
            new RegExp("[\\s\\S]*?" + matcher.source, (matcher.ignoreCase ? "i" : "") + (matcher.multiline ? "m" : "") + (matcher.unicode ? "u" : "") + "g") :
            new RegExp("[\\s\\S]*?(" + matcher.source + ")", (matcher.ignoreCase ? "i" : "") + (matcher.multiline ? "m" : "") + (matcher.unicode ? "u" : "") + "g")
            ;

        return this.tap().pipe(this._selfInstance({
            transform(chunk, encoding, callback) {
                this.buffer = (this.buffer || "") + chunk.toString("utf-8");
                this.buffer = this.buffer.replace(replaceRegex, (...match) => {
                    this.push(match.slice(1, match.length - 2).join(""));
                    return "";
                });

                callback();
            },
            referrer: this
        }));

    }
    throw new Error("Mathcher must be a RegExp!");
};

/**
 * @callback ParseCallback
 * @param {String} chunk the transformed chunk
 * @return {Promise}  the promise should be resolved with the parsed object
 */

/**
 * Parses every string to object
 *
 * The method MUST parse EVERY string into a single object, so the string
 * stream here should already be split.
 *
 * @chainable
 * @param  {ParseCallback} parser The transform function
 * @return {DataStream}  The parsed objects stream.
 *
 * @test test/methods/string-stream-parse.js
 */
StringStream.prototype.parse =  function parse(parser, Clazz = DataStream) {
    return this.tap().map(parser, Clazz);
};

/**
 * Prepends given argument to all the items.
 *
 * @chainable
 * @memberof StringStream#
 * @param {Function|String} arg the argument to prepend. If function passed then it will be called and resolved
 *                              and the resolution will be prepended.
 *
 * @test test/methods/string-stream-prepend.js
 */
StringStream.prototype.prepend = function prepend(arg) {
    return typeof arg === "function" ? this.map(item => Promise.resolve(item).then(arg).then((result) => result + item)) : this.map(item => arg + item);
};

/**
 * Finds matches in the string stream and streams the match results
 *
 * @chainable
 * @param  {RegExp} matcher A function that will be called for every
 *                             stream chunk.
 *
 * @test test/methods/string-stream-match.js
 */
StringStream.prototype.replace = function replace(needle, replacement, {windowSize = -2} = {}) {
    let replacing = "";
    let fullIndex = 0;

    if (windowSize < 0) {
        windowSize = `${needle}`.length * -windowSize;
    }

    // if regex with global?

    this.pipe(new this.constructor({
        promiseTransform(chunk) {

            const oldLength = replacing.length - windowSize;
            replacing += chunk;
            const match = replacing.match(needle);

            if (match) {
                const prev = replacing.slice(0, oldLength);
                replacing = replacing.slice(oldLength);
                return prev;
            } else {
                const newIndex = match ? match.index : -1;
                const prev = replacing.slice(0, newIndex);
                const advance = newIndex + match[0].length;
                fullIndex += advance;

                let after;
                if (typeof replacement === "function") {
                    after = replacement(...match, fullIndex, this);
                } else {
                    after = replacement;
                }

                replacing = replacing.slice(advance);

                return prev + after;
            }
        },
        promiseFlush() {
            return replacing.replace(needle, replacement);
        }
    }));
};

/**
 * @callback ShiftCallback
 * @param {String} shifted Popped chars
 */

/**
 * Shifts given length of chars from the original stream
 *
 * Works the same way as {@see DataStream.shift}, but in this case extracts
 * the given number of characters.
 *
 * @chainable
 * @param {Number} bytes The number of characters to shift.
 * @param {ShiftCallback} func Function that receives a string of shifted chars.
 *
 * @test test/methods/string-stream-shift.js
 */
StringStream.prototype.shift = function shift(bytes, func) {
    const ret = "";
    const str = this.tap()._selfInstance({
        referrer: this
    });
    let offs = 0;

    const chunkHandler = (chunk) => {
        const length = Math.min(bytes - offs, chunk.length);
        chunk.substr(0, length);
        offs += length;
        if (length >= bytes) {
            unHook()
                .then(
                    () => {
                        str.write(chunk.slice(length));
                        this.pipe(str);
                    }
                );
        }
    };

    const endHandler = (...args) => {
        if (ret.length < bytes) {
            unHook();
        }
        str.end(...args);
    };

    const errorHandler = str.emit.bind(str, "error");

    const unHook = () => {  // jshint ignore:line
        this.removeListener("data", chunkHandler);
        this.removeListener("end", endHandler);
        this.removeListener("error", errorHandler);
        return Promise.resolve(ret)
            .then(func);
    };


    this.on("data", chunkHandler);
    this.on("end", endHandler);
    this.on("error", errorHandler);

    return str;
};

/**
 * Splits the string stream by the specified regexp or string
 *
 * @chainable
 * @param  {RegExp|String} splitter What to split by
 *
 * @test test/methods/string-stream-split.js
 */
StringStream.prototype.split = function split(splitter) {
    if (splitter instanceof RegExp || typeof splitter === "string") {
        return this.tap().pipe(this._selfInstance({
            transform(chunk, encoding, callback) {
                this.buffer += chunk.toString(this.encoding);
                const newChunks = this.buffer.split(splitter);
                while(newChunks.length > 1) {
                    this.push(newChunks.shift());
                }
                this.buffer = newChunks[0];
                callback();
            },
            flush(callback) {
                this.push(this.buffer);
                this.buffer = "";
                callback();
            },
            referrer: this
        }));
    } else if (splitter instanceof Function) {
        return this.tap().pipe(new (this.constructor)({
            transform: splitter,
            referrer: this
        }));
    }
};

/**
 * @meta.noReadme
 * @ignore
 */
StringStream.prototype.toStringStream = function toStringStream(encoding) {
    if (encoding)
        return this.tap().pipe(this._selfInstance(encoding, {
            referrer: this
        }));
    else
        return this;
};

/**
 * Stringifies CSV to DataString using 'papaparse' module.
 *
 * @chainable
 * @memberof DataStream#
 * @param options options for the papaparse.unparse module.
 * @return {StringStream}  stream of parsed items
 *
 * @test test/methods/data-stream-csv.js
 */
DataStream.prototype.CSVStringify = function CSVStringify(options = {}) {
    const Papa = require("papaparse");
    let header = null;
    let start = 1;
    options = Object.assign({
        header: true,
        newline: EOL
    }, options);

    const outOptions = Object.assign({}, options, {
        header: false
    });

    return this
        .timeBatch(16, 64)
        .map((arr) => {
            const out = [];
            if (!header) {
                header = Object.keys(arr[0]);
                if (options.header) out.push(header);
            }
            for (const item of arr)
                out.push(header.map(key => item[key]));

            const x = Papa.unparse(out, outOptions) + options.newline;
            if (start) {
                start = 0;
                return x;
            }
            return x;
        })
        .pipe(new StringStream());
};

/**
 * Performs an operation on every chunk, without changing the stream
 *
 * This is a shorthand for ```stream.on("data", func)``` but with flow control.
 * Warning: this resumes the stream!
 *
 * @chainable
 * @param  {MapCallback} func a callback called for each chunk.
 */
DataStream.prototype.each = function (func) {
    return this.tap().map(
        (a) => Promise.resolve(func(a))
            .then(() => a)
    ).resume();
};

/**
 * A shorthand for streams of Arrays to flatten them.
 *
 * More efficient equivalent of: .flatmap(i => i);
 *
 * @chainable
 * @memberof DataStream#
 * @return {DataStream}
 *
 * @test test/methods/data-stream-flatten.js
 */
DataStream.prototype.flatten = function flatten() {
    return this.into(
        async (ref, out) => {
            let last = true;
            for (const val of out)
                last = ref.write(val);

            return last ? null : ref.whenDrained();
        },
        this._selfInstance()
    );
};

/**
 * @callback IntoCallback
 * @async
 * @param {*} into stream passed to the into method
 * @param {Object} chunk source stream chunk
 * @return {*}  resolution for the old stream (for flow control only)
 */

/**
 * Allows own implementation of stream chaining.
 *
 * The async callback is called on every chunk and should implement writes in it's own way. The
 * resolution will be awaited for flow control. The passed `into` argument is passed as the first
 * argument to every call.
 *
 * It returns the DataStream passed as the second argument.
 *
 * @chainable
 * @param  {IntoCallback} func the method that processes incoming chunks
 * @param  {DataStream} into the DataStream derived class
 *
 * @test test/methods/data-stream-into.js
 */
DataStream.prototype.into = function (func, into) {
    if (!(into instanceof DataStream)) throw new Error("Stream must be passed!");

    if (!into._options.referrer)
        into.setOptions({referrer: this});

    this.tap()
        .catch(e => into.raise(e))
        .pipe(new (this.constructor)({  // TODO: this stream may not be necessary
            promiseTransform: async (chunk) => {
                try {
                    await func(into, chunk);
                } catch(e) {
                    into.raise(e);
                }
            },
            referrer: this
        }))
        .on("end", () => into.end())
        .resume();

    return into;
};

/**
 * Performs the Nagle's algorithm on the data. In essence it waits until we receive some more data and releases them
 * in bulk.
 *
 * @memberof DataStream#
 * @todo needs more work, for now it's simply waiting some time, not checking the queues.
 * @param  {number} [size=32] maximum number of items to wait for
 * @param  {number} [ms=10]   milliseconds to wait for more data
 * @chainable
 * @meta.noreadme
 */
DataStream.prototype.nagle = function nagle(size = 32, ms = 10) {
    return this.timeBatch(size, ms)
        .flatten();
};

/**
 * @callback RemapCallback
 * @param {Function} emit a method to emit objects in the remapped stream
 * @param {*} chunk the chunk from the original stream
 * @returns {Promise|*} promise to be resolved when chunk has been processed
 */

/**
 * Remaps the stream into a new stream.
 *
 * This means that every item may emit as many other items as we like.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {RemapCallback} func A callback that is called on every chunk
 * @param  {class} Clazz Optional DataStream subclass to be constructed
 * @return {DataStream}  a new DataStream of the given class with new chunks
 *
 * @test test/methods/data-stream-remap.js
 */
DataStream.prototype.remap = function remap(func, Clazz) {

    const ref = new (Clazz || this.constructor)({referrer: this});

    return this.into(
        async (str, chunk) => {
            let out = [];
            await func((newChunk) => out.push(newChunk), chunk);

            let last = true;
            for (const val of out)
                last = ref.write(val);

            return last ? null : ref.whenDrained();
        },
        ref
    );
};

/**
 * Shift callback
 *
 * @callback ShiftCallback
 * @param {Array<Object>} shifted an array of shifted chunks
 */

/**
 * Shifts the first n items from the stream and pushes out the remaining ones.
 *
 * @chainable
 * @memberof DataStream#
 * @param {Number} count The number of items to shift.
 * @param {ShiftCallback} func Function that receives an array of shifted items
 *
 * @test test/methods/data-stream-shift.js
 */
DataStream.prototype.shift = function shift(count, func) {
    const ret = [];
    const str = this.tap()._selfInstance({referrer: this});

    const chunkHandler = (chunk) => {
        ret.push(chunk);
        if (ret.length >= count) {
            this.pause();
            unHook().then(
                () => this.resume().pipe(str)
            );
        }
    };

    const endHandler = (...args) => {
        unHook().then(
            () => str.end(...args)
        );
    };

    const errorHandler = str.emit.bind(str, "error");

    let hooked = true;
    const unHook = () => { // jshint ignore:line
        if (hooked) {
            hooked = false;
            this.removeListener("data", chunkHandler);
            this.removeListener("end", endHandler);
            this.removeListener("error", errorHandler);
        }
        return Promise.resolve(ret)
            .then(func);
    };

    this.on("data", chunkHandler);
    this.on("end", endHandler);
    this.on("error", errorHandler);

    return str;
};

/**
 * Aggregates the stream into a single Array
 *
 * In fact it's just a shorthand for reducing the stream into an Array.
 *
 * @async
 * @param  {Array} initial Optional array to begin with.
 * @returns {Array}
 */
DataStream.prototype.toArray =  function toArray(initial) {
    return this.reduce(
        (arr, item) => (arr.push(item), arr),
        initial || []
    );
};

/**
 * Reads the stream until the function outcome is truthy.
 *
 * Works opposite of while.
 *
 * @chainable
 * @param  {FilterCallback} func The condition check
 *
 * @test test/methods/data-stream-until.js
 */
DataStream.prototype.until = function(func) {
    return this.while((...args) => Promise.resolve(func(...args)).then((a) => !a));
};

/**
 * Aggregates chunks in arrays given number of number of items long.
 *
 * This can be used for microbatch processing.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {Number} count How many items to aggregate
 *
 * @test test/methods/data-stream-batch.js
 */
DataStream.prototype.batch = function batch(count) {
    let arr = [];

    const ret = this.tap().pipe(new this.constructor({
        promiseTransform(chunk) {
            arr.push(chunk);
            if (arr.length >= count) {
                const push = arr;
                arr = [];
                return push;
            }
            return Promise.reject(DataStream.filter);
        },
        promiseFlush() {
            if (arr.length > 0) {
                return [arr];
            } else
                return [];
        },
        referrer: this
    }));

    return ret;
};

/**
 * Injects a ```debugger``` statement when called.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {Function} func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain
 * @return {DataStream}  self
 *
 * @test test/methods/data-stream-debug.js
 */
DataStream.prototype.debug = function debug(func) {
    debugger; // eslint-disable-line
    this.use(func);
    return this;
};

/**
 * Called only before the stream ends without passing any items
 *
 * @chainable
 * @memberof DataStream#
 * @param  {Function} callback Function called when stream ends
 *
 * @test test/methods/data-stream-empty.js
 */
DataStream.prototype.empty = function empty(callback) {
    let z = false;
    const promiseTransform = () => {
        z = true;
        this.dropTransform(promiseTransform);
    };

    this.pushTransform({promiseTransform})
        .tap()
        .whenEnd()
        .then(
            () => (z || Promise.resolve().then(callback)),
            () => 0
        );

    return this;
};

const combineStack = (stack, ...errors) => {
    return errors.reduce(
        (stack, trace) => {
            if (!trace) return stack;
            if (trace.indexOf("\n") >= 0)
                return stack + EOL + trace.substr(trace.indexOf("\n") + 1);

            else
                return stack + EOL + trace;
        },
        stack
    );
};

class StreamError extends Error {

    constructor(cause, stream, code = "GENERAL", chunk = null) {
        code = cause.code || code;
        stream = cause.stream || stream;
        chunk = cause.chunk || chunk;

        super(cause.message);

        if (cause instanceof StreamError)
            return cause;

        this.chunk = chunk;
        this.stream = stream;
        this.code = "ERR_SCRAMJET_" + code;
        this.cause = cause;

        const stack = this.stack;
        Object.defineProperty(this, "stack", {
            get: function () {
                return combineStack(
                    stack,
                    "  caused by:",
                    cause.stack,
                    `  --- raised in ${stream.name} constructed ---`,
                    stream.constructed
                );
            }
        });

        /** Needed to fix babel errors. */
        this.constructor = StreamError;
        this.__proto__ = StreamError.prototype;
    }

}

/**
 * Stream errors class
 *
 * @module scramjet/errors
 * @prop {Class.<StreamError>} StreamError
 * @prop {Function} combineStack
 */
module.exports = {StreamError, combineStack};

const getCalleeDirname = function(depth) {
    const p = Error.prepareStackTrace;
    Error.prepareStackTrace = (dummy, stack) => stack;
    const e = new Error();
    Error.captureStackTrace(e, arguments.callee);
    const stack = e.stack;
    Error.prepareStackTrace = p;
    return dirname(stack[depth].getFileName());
};

const AsyncGeneratorFunction = (() => {
    let AsyncGeneratorFunction = function() {};
    try {
        AsyncGeneratorFunction = require("./util/async-generator-constructor"); // eslint-disable-line
    } catch (e) {} // eslint-disable-line

    return AsyncGeneratorFunction;
})();

const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const pipeIfTarget = (stream, target) => (target ? stream.pipe(target) : stream);

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

/**
 * @callback JoinCallback
 * @param {*} prev the chunk before
 * @param {*} next the chunk after
 * @returns {Promise<*>|*}  promise that is resolved with the joining item
 */

/**
 * Method will put the passed object between items. It can also be a function call.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {*|JoinCallback} item An object that should be interweaved between stream items
 *
 * @test test/methods/data-stream-join.js
 */
DataStream.prototype.join = function join(item) {
    const ref = this._selfInstance({referrer: this});

    let prev;
    let consumer;
    if (typeof item !== "function") {
        consumer = (cur) => Promise.all([
            ref.whenWrote(item),
            ref.whenWrote(cur)
        ]);
    } else {
        consumer = cur => Promise.resolve(item(prev, cur))
            .then(joint => Promise.all([
                joint && ref.whenWrote(joint),
                ref.whenWrote(prev = cur)
            ]))
        ;
    }

    this.shift(1, ([first]) => ref.push(prev = first))
        .consume(
            consumer
        )
        .then(
            () => ref.end()
        );
    return ref;
};

/**
 * Allows previewing some of the streams data without removing them from the stream.
 *
 * Important: Peek does not resume the flow.
 *
 * @memberof DataStream#
 * @param  {Number} count The number of items to view before
 * @param  {ShiftCallback} func Function called before other streams
 * @chainable
 */
DataStream.prototype.peek = function peek(count, func) {
    const ref = this._selfInstance({referrer: this});

    this
        .tap()
        .pipe(ref)
        .shift(count, batch => {
            this.unpipe(ref);
            return func(batch);
        });

    return this;
};

/**
 * Rewinds the buffered chunks the specified length backwards. Requires a prior call to {@see DataStream..keep}
 *
 * @chainable
 * @memberof DataStream#
 * @param {number} count Number of objects or -1 for all the buffer
 */
DataStream.prototype.rewind = function rewind(count = -1) {
    if (count < 0)
        count = Infinity;

    if (this.buffer) {
        return this.buffer.tail(count).pipe(this._selfInstance());
    } else {
        throw new Error("Stream not buffered, cannot rewind.");
    }
};

/**
 * Gets a slice of the stream to the callback function.
 *
 * Returns a stream consisting of an array of items with `0` to `start`
 * omitted and `length` items after `start` included. Works similarily to
 * Array.prototype.slice.
 *
 * Takes count from the moment it's called. Any previous items will not be
 * taken into account.
 *
 * @chainable
 * @memberof DataStream#
 * @param {Number} [start=0] omit this number of entries.
 * @param {Number} [length=Infinity] get this number of entries to the resulting stream
 *
 * @test test/methods/data-stream-slice.js
 */
DataStream.prototype.slice = function slice(start = 0, length = Infinity) {
    let n = 0;
    return this.shift(start, () => 0)
        .until(() => n++ >= length);
};

/**
 * Returns an async generator
 *
 * Ready for https://github.com/tc39/proposal-async-iteration
 *
 * @return {Iterable.<Promise.<*>>} Returns an iterator that returns a promise for each item.
 */
DataStream.prototype.toGenerator =  function toGenerator() {
    this.tap();
    const ref = this;
    return function* () {
        let ended = false;
        ref.on("end", () => ended = true);
        while (!ended) {
            yield ref.whenRead();
        }
        return;
    };
};

/**
 * Calls the passed method in place with the stream as first argument, returns result.
 *
 * The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
 * streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
 * from the command line.
 *
 * @chainable
 * @param {Function|String} func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module.
 * @param {*} [...args] any additional args top be passed to the module
 * @test test/methods/data-stream-use.js
 */
DataStream.prototype.use = function(func, ...args) {
    switch (typeof func) {
    case "function":
        return func(this, ...args);
    case "string":
        return require(func.startsWith(".") ? resolve(getCalleeDirname(1), func) : func)(this, ...args);
    default:
        throw new Error("Only function or string allowed.");
    }
};

/**
 * Creates a BufferStream
 *
 * @meta.noReadme
 * @chainable
 * @param  {MapCallback} serializer A method that converts chunks to buffers
 * @return {BufferStream}  the resulting stream
 *
 * @test test/methods/data-stream-tobufferstream.js
 */
DataStream.prototype.bufferify = function (serializer) {
    return this.map(serializer, BufferStream);
};

DataStream.prototype.toBufferStream = DataStream.prototype.bufferify;

/**
 * Delegates work to a specified worker.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {DelegateCallback} delegateFunc A function to be run in the subthread.
 * @param  {WorkerStream}     worker
 * @param  {Array}            [plugins=[]]
 */
DataStream.prototype.delegate = function delegate(delegateFunc, worker, plugins = []) {
    const ret = this._selfInstance({referrer: this});
    return worker.delegate(this, delegateFunc, plugins).pipe(ret);
};

/**
 * Pushes any data at end of stream
 *
 * @chainable
 * @memberof DataStream#
 * @param {*} item list of items to push at end
 * @meta.noreadme
 *
 * @test test/methods/data-stream-endwith.js
 */
DataStream.prototype.endWith = function endWith(...items) {
    // TODO: overhead on unneeded transform, but requires changes in core.
    // TODO: should accept similar args as `from`
    return this.pipe(this._selfInstance({
        referrer: this,
        promiseTransform: (a) => a,
        flushPromise: () => items
    }));
};

/**
 * Create a DataStream from an Array.
 *
 * @param  {Array} arr list of chunks
 * @return {DataStream}
 *
 * @test test/methods/data-stream-fromarray.js
 */
DataStream.fromArray = function fromArray(arr, options) {
    const ret = new this(options);
    arr = arr.slice();
    arr.forEach((item) => ret.write(item));
    ret.end();
    return ret;
};

/**
 * Returns a StringStream containing JSON per item with optional end line
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {Boolean|String} [endline=os.EOL] whether to add endlines (boolean or string as delimiter)
 * @return {StringStream}  output stream
 */
DataStream.prototype.JSONStringify = function JSONStringify(eol = EOL) {
    if (!eol)
        eol = "";

    return this.stringify((item) => JSON.stringify(item) + eol);
};

/**
 * Pulls in any Readable stream, resolves when the pulled stream ends.
 *
 * Does not preserve order, does not end this stream.
 *
 * @async
 * @memberof DataStream#
 * @param {Readable} incoming
 * @returns {Number} resolved when incoming stream ends, rejects on incoming error
 *
 * @example {@include ../samples/data-stream-pull.js}
 */
DataStream.prototype.pull = async function(incoming) {
    return new Promise((res, rej) => {
        incoming.pipe(this, { end: false });
        incoming.on("end", res);
        incoming.on("error", rej);
    });
};

/**
 * Consumes all stream items doing nothing. Resolves when the stream is ended.
 *
 * @async
 */
DataStream.prototype.run = async function () {
    return this.on("data", () => 0).whenEnd();
};

/**
 * Creates a StringStream
 *
 * @chainable
 * @param  {MapCallback} serializer A method that converts chunks to strings
 * @return {StringStream}  the resulting stream
 *
 * @test test/methods/data-stream-tostringstream.js
 */
DataStream.prototype.stringify =  function stringify(serializer) {
    return this.map(serializer, StringStream);
};

DataStream.prototype.toStringStream = DataStream.prototype.stringify;

/**
 * Transforms the stream to a streamed JSON array.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {Iterable} [enclosure='[]'] Any iterable object of two items (begining and end)
 * @return {StringStream}
 * @meta.noreadme
 *
 * @test test/methods/data-stream-tojsonarray.js
 */
DataStream.prototype.toJSONArray = function toJSONArray(enclosure = ["[\n", "\n]"], separator = ",\n", stringify = JSON.stringify) {
    const ref = new StringStream({referrer: this});

    this.shift(1, ([first]) => (ref.push(enclosure[0]), ref.whenWrote(stringify(first))))
        .consume(
            (chunk) => Promise.all([
                ref.whenWrote(separator),
                ref.whenWrote(stringify(chunk))
            ])
        )
        .then(
            () => ref.end(enclosure[1])
        );

    return ref;
};

/**
 * Reads the stream while the function outcome is truthy.
 *
 * Stops reading and emits end as soon as it ends.
 *
 * @chainable
 * @param  {FilterCallback} func The condition check
 *
 * @test test/methods/data-stream-while.js
 */
DataStream.prototype.while = function(func) {
    let condition = true;
    const out = this._selfInstance({
        promiseTransform: func,
        beforeTransform: (chunk) => condition ? chunk : Promise.reject(DataStream.filter),
        afterTransform: (chunk, ret) => {
            if (!ret) {
                condition = false;
                this.unpipe(out);
                out.end();
                return Promise.reject(DataStream.filter);
            } else {
                return condition ? chunk : Promise.reject(DataStream.filter);
            }
        },
        referrer: this
    });

    return this.pipe(out);
};

/**
 * Returns a new stream that will append the passed streams to the callee
 *
 * @chainable
 * @memberof DataStream#
 * @param  {*} streams Streams to be passed
 *
 * @test test/methods/data-stream-concat.js
 */
DataStream.prototype.concat = function concat(...streams) {
    const out = this._selfInstance({referrer: this});

    streams.unshift(this);

    const next = () => {
        if (streams.length)
            streams.shift()
                .on("end", next)
                .pipe(out, {end: !streams.length});
    };
    next();

    return out;
};

/**
 * Distributes processing into multiple subprocesses or threads if you like.
 *
 * @todo Currently order is not kept.
 * @todo Example test breaks travis build
 *
 * @chainable
 * @memberof DataStream#
 * @param {AffinityCallback|Number} [affinity] Number that runs round-robin the callback function that affixes the item to specific streams which must exist in the object for each chunk. Defaults to Round Robin to twice the number of cpu threads.
 * @param {ClusterCallback} clusterFunc stream transforms similar to {@see DataStream#use method}
 * @param {Object} options Options
 *
 * @see {@link ../samples/data-stream-distribute.js}
 */
DataStream.prototype.distribute = function distribute(affinity, clusterFunc = null, {
    plugins = [],
    options = {}
} = {}) {

    if (!clusterFunc && affinity) {
        clusterFunc = affinity;
        affinity = cpus().length * 2;
    }

    if (typeof affinity === "number") {
        const roundRobinLength = affinity;
        let z = 0;
        options.threads = affinity;
        affinity = () => z = ++z % roundRobinLength;
    }

    if (!Array.isArray(clusterFunc))
        clusterFunc = [clusterFunc];

    const streams = this
        .separate(affinity, options.createOptions, this.constructor)
        .cluster(clusterFunc, {
            plugins,
            threads: options.threads,
            StreamClass: this.constructor
        });

    return streams.mux();
};

/**
 * @callback FilterCallback
 * @param {*} chunk the chunk to be filtered or not
 * @returns {Promise|Boolean}  information if the object should remain in
 *                             the filtered stream.
 */

/**
 * Filters object based on the function outcome, just like
 * Array.prototype.filter.
 *
 * @chainable
 * @param  {FilterCallback} func The function that filters the object
 *
 * @test test/methods/data-stream-filter.js
 */
DataStream.prototype.filter = function (func) {
    return this.pipe(this._selfInstance({
        promiseTransform: func,
        afterTransform: (chunk, ret) => ret ? chunk : Promise.reject(DataStream.filter),
        referrer: this
    }));
};

/**
 * Create a DataStream from an Iterator
 *
 * Doesn't end the stream until it reaches end of the iterator.
 *
 * @param  {Iterator} iter the iterator object
 * @return {DataStream}
 *
 * @test test/methods/data-stream-fromiterator.js
 */
DataStream.fromIterator =  function fromIterator(iter, options) {
    return new this(Object.assign({}, options, {
        async parallelRead() {
            const read = await iter.next();
            if (read.done) {
                return read.value ? [await read.value, null] : [null];
            } else {
                return [await read.value];
            }
        }
    }));
};

/**
 * Keep a buffer of n-chunks for use with {@see DataStream..rewind}
 *
 * @chainable
 * @memberof DataStream#
 * @param {number} count Number of objects or -1 for all the stream
 *
 * @test test/methods/data-stream-keep.js
 */
DataStream.prototype.keep = function keep(count = -1) {
    if (count < 0)
        count = Infinity;

    this.pipe(this.buffer = new ReReadable({ length: count, objectMode: true }));

    return this.tap();
};

/**
 * @callback ReduceCallback
 * @param {*} acc the accumulator - the object initially passed or returned
 *                by the previous reduce operation
 * @param {Object} chunk the stream chunk.
 * @return {Promise|*}  accumulator for the next pass
 */

/**
 * Reduces the stream into a given accumulator
 *
 * Works similarly to Array.prototype.reduce, so whatever you return in the
 * former operation will be the first operand to the latter. The result is a
 * promise that's resolved with the return value of the last transform executed.
 *
 * This method is serial - meaning that any processing on an entry will
 * occur only after the previous entry is fully processed. This does mean
 * it's much slower than parallel functions.
 *
 * @async
 * @param  {ReduceCallback} func The into object will be passed as the  first argument, the data object from the stream as the second.
 * @param  {Object} into Any object passed initially to the transform function
 *
 * @test test/methods/data-stream-reduce.js
 */
DataStream.prototype.reduce = function(func, into) {

    let last = Promise.resolve(into);

    return this.tap().pipe(new PromiseTransformStream({
        promiseTransform: (chunk) => {
            return last = last.then((acc) => func(acc, chunk));
        },
        referrer: this,
        initial: into
    }))
        .resume()
        .whenFinished()
        .then(() => last);
};

// TODO: requires rethink/rewrite.

/**
 * An object consisting of multiple streams than can be refined or muxed.
 */
class MultiStream extends EventEmitter {

    /**
     * Crates an instance of MultiStream with the specified stream list
     *
     * @param  {stream.Readable[]} streams the list of readable streams (other
     *                                     objects will be filtered out!)
     * @param  {Object} options Optional options for the super object. ;)
     *
     * @test test/methods/multi-stream-constructor.js
     */
    constructor(streams, ...args) {

        super(args.length ? args[0] : streams);

        /**
         * Array of all streams
         * @type {Array}
         */
        this.streams = [];

        if (Array.isArray(streams))
            streams.forEach(
                (str) => this.add(str)
            );
    }

    /**
     * Returns the current stream length
     * @return {number}
     */
    get length() {
        return this.streams.length;
    }

}

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

/**
 * @module ScramjetCore
 */

const ref = {};
let workerSeq = 0;
const workers = [];

/**
 * StreamWorker class - intended for internal use
 *
 * This class provides control over the subprocesses, incl:
 *  - spawning
 *  - communicating
 *  - delivering streams
 *
 * @internal
 */
class StreamWorker {

    /**
     * Private constructor
     *
     * @private
     */
    constructor(def) {
        if (def !== ref) {
            throw new Error("Private constructor");
        }

        this._refcount = 0;

        this.timeout = 1e3;
        this.child = null;
        this.resolving = null;
        this.ip = "localhost";
        this.port = 0;
    }

    /**
     * Spawns the worker if necessary and provides the port information to it.
     *
     * @async
     * @return {StreamWorker}
     */
    async spawn() {
        return this.resolving || (this.resolving = new Promise((res, rej) => {

            this._child = fork(__dirname + "/stream-child", [this.ip]);

            let resolved = false;
            let rejected = false;

            this._child.once("message", ({port}) => (this.port = +port, resolved = true, res(this)));
            this._child.once("error", (e) => (rejected = true, rej(e)));
            this._child.once("exit", (code) => {
                if (!code) // no error, child exited, clear the promise so that it respawns when needed
                    this.resolving = null;
                else
                    this.resolving = Promise.reject(new Error("Child exited with non-zero status code: " + code));
            });

            setTimeout(() => resolved || rejected || (rejected = true) && rej(new Error("StreamWorker child timeout!")), 1e3);
        }));
    }

    /**
     * Delegates a stream to the child using tcp socket.
     *
     * The stream gets serialized using JSON and passed on to the subprocess.
     * The subprocess then peforms transforms on the stream and pushes them back to the main process.
     * The stream gets deserialized and outputted to the returned DataStream.
     *
     * @param  {DataStream} input stream to be delegated
     * @param  {DataStream~TeeCallback[]|Array} delegateFunc Array of transforms or arrays describing ['module', 'method']
     * @param  {Array} [plugins=[]] List of plugins to load in the child
     * @return {DataStream} stream after transforms and back to the main process.
     */
    delegate(input, delegateFunc, plugins = []) {

        const sock = new net.Socket();

        const _in = new DataStream();

        const _out = _in.JSONStringify()
            .pipe(sock.connect(this.port, this.ip))
            .pipe(new StringStream)
            .JSONParse()
            .filter(
                ({error}) => {
                    if (error) {
                        const err = new Error(error.message);
                        err.stack = "[child]" + error.stack;
                    }
                    return true;
                }
            )
        ;

        _in.unshift({
            type: 0, // 0 - start, 1 - end
            plugins,
            streamClass: input.constructor.name,
            transforms: delegateFunc.map(
                func => typeof func === "function" ? func.toString() : (Array.isArray(func) ? func : [func])
            )
        });

        input.pipe(_in);

        return _out;
    }

    /**
     * Spawns (Preforks) a given number of subprocesses and returns the worker asynchronously.
     *
     * @async
     * @param  {Number}  [count=os.cpus().length] Number of processes to spawn. If other subprocesses are active only the missing ones will be spawned.
     * @return {StreamWorker[]}  list of StreamWorkers
     */
    static async fork(count = os.cpus().length) {

        for (let i = workers.length; i < count; i++)
            workers.push(new StreamWorker(ref));

        return Promise.all(new Array(count).fill(1).map(() => this._getWorker()));
    }

    /**
     * Picks next worker (not necessarly free one!)
     *
     * @async
     * @return {StreamWorker}
     */
    static async _getWorker() {
        // TODO: Use free / not fully utilized workers first.

        return workers[workerSeq = ++workerSeq % workers.length].spawn();
    }

}

/**
 * Distribute options
 *
 * @typedef DistributeOptions
 * @prop {Array} plugins a list of scramjet plugins to load (if omitted, will use just the ones in scramjet itself)
 * @prop {String} StreamClass the class to deserialize the stream to.
 * @prop {Number} threads maximum threads to use - defauls to number of processor threads in os, but it may be sensible to go over this value if you'd intend to run synchronous code.
 */

/**
 * Distributes processing to multiple forked subprocesses.
 *
 * @chainable
 * @memberof MultiStream#
 * @param {Function|String} clusterFunc a cluster callback with all operations working similarily to DataStream::use
 * @param {DistributeOptions} options
 */
MultiStream.prototype.cluster = function cluster(clusterFunc, {plugins = [], threads = cpus().length * 2, StreamClass, createOptions = {}}) {
    const out = new this.constructor();

    StreamWorker.fork(threads);

    this.each(
        (stream) => StreamWorker
            .fork(1)
            .then(
                ([worker]) => out.add(worker.delegate(stream, clusterFunc, plugins)
                    .pipe(new StreamClass(createOptions)))
            )
    );

    return out;
};

MultiStream.prototype.each =  function each(aFunc, rFunc) {
    return Promise.all(
        this.streams.map(
            (s) => {
                return Promise.resolve(s)
                    .then(aFunc)
                ;
            }
        )
    ).then(
        () => {
            this.on(
                "add",
                (stream) => Promise.resolve(stream).then(aFunc)
            );

            if (rFunc)
                this.on(
                    "remove",
                    (stream) => Promise.resolve(stream).then(rFunc)
                );

            return this;
        }
    );
};

/**
 * Filters the stream list and returns a new MultiStream with only the
 * streams for which the callback returned true
 *
 * @chainable
 * @param  {TransformFunction} func Filter ran in Promise::then (so you can
 *                                  return a promise or a boolean)
 * @return {MultiStream}  the filtered instance
 *
 * @test test/methods/multi-stream-filter.js
 */
MultiStream.prototype.filter =  function filter(func) {
    return Promise.all(
        this.streams.map(
            (s) => Promise.resolve(s)
                .then(func)
                .then((o) => o ? s : null)
        )
    ).then(
        (streams) => {
            const out = new (this.constructor)(
                streams.filter((s) => s)
            );
            this.on(
                "add",
                (stream) => Promise.resolve(stream)
                    .then(func)
                    .then(out.add.bind(out))
            );
            this.on(
                "remove", out.remove.bind(out)
            );
            return out;
        }
    );
};

/**
 * Calls Array.prototype.find on the streams
 *
 * @param  {Arguments} args arguments for
 * @return {DataStream}  found DataStream
 */
MultiStream.prototype.find =  function find(...args) {
    return this.streams.find(...args);
};

/**
 * Returns new MultiStream with the streams returned by the transform.
 *
 * Runs callback for every stream, returns a new MultiStream of mapped
 * streams and creates a new multistream consisting of streams returned
 * by the callback.
 *
 * @chainable
 * @param  {MapCallback} aFunc Mapper ran in Promise::then (so you can
 *                                  return a promise or an object)
 * @return {MultiStream}  the mapped instance
 *
 * @test test/methods/multi-stream-map.js
 */
MultiStream.prototype.map =  function map(aFunc, rFunc) {
    return Promise.all(
        this.streams.map(
            (s) => {
                return Promise.resolve(s)
                    .then(aFunc)
                ;
            }
        )
    ).then(
        (streams) => {
            const out = new (this.constructor)(
                streams
            );

            this.on(
                "add",
                (stream) => Promise.resolve(stream)
                    .then(aFunc)
                    .then(out.add.bind(out))
            );

            if (rFunc)
                this.on(
                    "remove",
                    (stream) => Promise.resolve(stream)
                        .then(rFunc)
                        .then(out.remove.bind(out))
                );

            return out;
        }
    );
};

const OUT = Symbol("output stream");



/**
 * Muxes the streams into a single one
 *
 * @todo For now using comparator will not affect the mergesort.
 * @todo Sorting requires all the streams to be constantly flowing, any
 *       single one drain results in draining the muxed too even if there
 *       were possible data on other streams.
 *
 * @param  {ComparatorFunction} cmp Should return -1 0 or 1 depending on the
 *                                  desired order. If passed the chunks will
 *                                  be added in a sorted order.
 * @return {DataStream}  The resulting DataStream
 *
 * @test test/methods/multi-stream-mux.js
 */
MultiStream.prototype.mux =  function mux(cmp, Clazz) {

    this[OUT] = Clazz ? new Clazz() : new DataStream();

    if (!cmp) {

        const unpipeStream = (stream) => {
            if (stream) stream.unpipe(this[OUT]);
            this[OUT].setMaxListeners(this.streams.length);
        };

        const pipeStream = (stream) => {
            this[OUT].setMaxListeners(this.streams.length);
            stream.pipe(this[OUT], {end: false});
        };

        this.on("add", pipeStream);
        this.on("remove", unpipeStream);

        this.streams.forEach(pipeStream);

        this.on("empty", () => this[OUT].end());

        return this[OUT];
    }

    return mergesortStream(this, cmp, 0, Clazz);
};

const DefaultBufferLength = 16;

/**
 * Wraps comparator to accept array like
 *
 * @param {Function} comparator comparator function
 * @return {number} order
 */
const wrapComparator = (comparator) => (a, b) => comparator(a[0], b[0]);
/**
 * The default comparator
 * @param {*} a a
 * @param {*} b b
 * @return {number} order
 */
const DefaultComparator = (a, b) => {
    if (a < b) return -1;
    if (b < a) return 1;
    return 0;
};

/**
 *
 * @template Clazz
 * @param {MultiStream} multi the input multi stream
 * @param {Function} passedComparator the comparator
 * @param {number} bufferLength number of objects to buffer
 * @param {function(): PromiseTransformStream>} Clazz the type of stream it should return
 * @return {function(): Clazz} the merged stream
 */
function mergesortStream(multi, passedComparator, bufferLength, Clazz) {
    bufferLength = bufferLength || DefaultBufferLength;

    const comparator = wrapComparator(passedComparator || DefaultComparator);

    const out = new Clazz();
    const readIndex = new Map();
    const endIndex = new WeakMap();

    const rest = [];

    const onceTouchedStream = (stream) => {
        return Promise.race([
            new Promise((res) => stream.on("readable", res)),
            endIndex.get(stream),
        ]);
    };

    const getMoreItemsForEntry = (stream, arr) => {
        while (arr.length < bufferLength) {
            const haveMore = stream.read();

            if (haveMore !== null)
                arr.push(haveMore);
            else
                break;
        }

        if (arr.length || !readIndex.has(stream))
            return Promise.resolve(arr);

        return onceTouchedStream(stream)
            .then(
                () => getMoreItemsForEntry(stream, arr),
                () => Promise.resolve(arr)
            );
    };

    const getMoreItems = () => {
        const ret = [];
        for (const entry of readIndex.entries())
            ret.push(getMoreItemsForEntry(...entry));


        if (!ret.length)
            return Promise.resolve([]);

        return Promise.all(ret);
    };

    // TODO: rewrite as generator?
    const getSorted = (inArys) => {
        const arr = [];
        const arys = inArys.slice();

        let minLength = 0;
        let j = 0;

        if (rest.length)
            arys.push(rest);


        if (!arys.length)
            return [];

        while (true) {  // eslint-disable-line
            let cnt = 0;

            for (const ary of arys)
                cnt += ary.length > j;

            if (cnt === arys.length) {
                for (let i = 0; i < arys.length; i++)
                    arr.push([arys[i][j], i, j, arys[i].length - j - 1]);

                minLength = ++j;
            } else
                break;
        }

        arr.sort(comparator);

        const ret = [];
        while (minLength > 0 && arr.length > 0) {
            const item = arr.shift();
            arys[item[1]].shift(item[2]);
            ret.push(item[0]);
            minLength = item[3];
        }

        return ret;
    };

    const writeSorted = (sorted) => {
        let ret = true;

        for (let i = 0; i < sorted.length; i++)
            ret = out.write(sorted[i]);


        return ret || new Promise((res) => out.once("drain", () => res(sorted.end)));
    };

    let removing = null;
    let pushing = null;
    const pushMoreItems = () => {
        if (pushing)
            return pushing;

        pushing =
            getMoreItems()
                .then(
                    (arys) => getSorted(arys)
                )
                .then(
                    writeSorted
                )
                .catch(
                    (e) => e instanceof Error ? out.emit("error", e) : (pushing = null, Promise.resolve())
                )
                .then(
                    () => {
                        pushing = null;

                        if (readIndex.size)
                            pushMoreItems();
                        else if (rest.length)
                            return writeSorted(rest.sort(passedComparator));

                        return null;
                    }
                );

        return pushing;
    };

    const onEmpty = () => {
        return Promise.resolve(pushing)
            .then(() => out.end());
    };

    multi.each(
        (addedStream) => {
            const endPromise = new Promise(
                (res, rej) => addedStream.on("end", () => {
                    multi.remove(addedStream);
                    rej();
                })
            );

            endPromise.catch(() => 0);

            readIndex.set(addedStream, []);
            endIndex.set(
                addedStream,
                endPromise
            );
        },
        (removedStream) => {
            removing = Promise.all([
                getMoreItemsForEntry(removedStream, readIndex.get(removedStream))
                    .then(
                        (items) => {
                            readIndex.delete(removedStream);
                            rest.push(...items);
                        }
                    ),
                removing,
            ]).then(
                () => readIndex.size ? pushMoreItems() : onEmpty()
            );
        }
    ).then(
        pushMoreItems
    ).catch(
        (e) => out.emit("error", e)
    );

    return out;
}

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

/**
 * Re-routes streams to a new MultiStream of specified size
 *
 * @meta.noreadme
 * @memberof MultiStream#
 * @todo NYT: not yet tested
 * @todo NYD: not yet documented
 * @param  {Function} [policy=Affinity.RoundRobin] [description]
 * @param  {number} [count=os.cpus().length]       [description]
 * @return {MultiStream}                             [description]
 */
MultiStream.prototype.route = function route(policy, count = cpus().length) {
    const affine = policy(null, count);
    return this.mux().separate(
        async (item) => await affine(item)
    );
};

/**
 * Map stream synchronously
 *
 * @chainable
 * @memberof MultiStream#
 * @param  {Function} transform mapping function ran on every stream (SYNCHRONOUS!)
 */
MultiStream.prototype.smap = function smap(transform) {
    const out = new this.constructor(this.streams.map(transform));
    this.each(
        out.add.bind(out),
        out.remove.bind(out)
    );
    return out;
};

/**
 * Separates execution to multiple streams using the hashes returned by the passed callback.
 *
 * Calls the given callback for a hash, then makes sure all items with the same hash are processed within a single
 * stream. Thanks to that streams can be distributed to multiple threads.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
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

/**
 * Duplicate the stream
 *
 * Creates a duplicate stream instance and passes it to the callback.
 *
 * @chainable
 * @param {TeeCallback|Writable} func The duplicate stream will be passed as first argument.
 *
 * @test test/methods/data-stream-tee.js
 */
DataStream.prototype.tee = function(func) {
    if (func instanceof Writable)
        return (this.tap().pipe(func), this);
    func(this.pipe(this._selfInstance()));
    return this.tap();
};

/**
 * Transforms the stream to a streamed JSON object.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {MapCallback} [entryCallback] async function returning an entry (array of [key, value])
 * @param  {Iterable} [enclosure='{}'] Any iterable object of two items (begining and end)
 * @return {StringStream}
 * @meta.noreadme
 *
 * @test test/methods/data-stream-tojsonobject.js
 */
DataStream.prototype.toJSONObject = function toJSONObject(entryCallback, enclosure = ["{\n","\n}"], separator = ",\n") {
    let ref = this;

    return ref.map((item) => [entryCallback(item), item])
        .toJSONArray(enclosure, separator, ([key, value]) => JSON.stringify(key.toString()) + ":" + JSON.stringify(value));
};

/**
 * Calculates the moving average of all items in the stream.
 *
 * @chainable
 * @param {Function} [valueOf] value of method for array items
 * @return {Promise.<Number>}
 */
WindowStream.prototype.avg = function (valueOf = (x) => +x) {
    let cnt = 0;
    return this.map(
        arr => arr.reduce((a, x) => (cnt * a + valueOf(x)) / ++cnt, 0)
    );
};

/**
 * Calculates moving sum of items, the output stream will contain the moving sum.
 *
 * @chainable
 * @param {Function} [valueOf] value of method for array items
 * @return {Promise.<Number>}
 */
WindowStream.prototype.sum = function(valueOf = (x) => +x) {
    return this.map(
        arr => arr.reduce((a, x) => a + valueOf(x))
    );
};

const {NumberStream} = require("./");

/**
 * A stream for moving window calculation with some simple methods.
 *
 * In essence it's a stream of Array's containing a list of items - a window.
 * It's best used when created by the `DataStream..window`` method.
 *
 * @extends DataStream
 */
class WindowStream extends NumberStream {}

/**
 * Returns a WindowStream of the specified length
 *
 * @memberof DataStream#
 * @chainable
 * @param {Number} length
 * @returns {WindowStream} a stream of array's
 * @meta.noreadme
 */
DataStream.prototype.window = function window(length) {
    if (!(+length > 0))
        throw new Error("Length argument must be a positive integer!");

    const arr = [];
    return this.into(
        (out, chunk) => {
            arr.push(chunk);
            if (arr.length > length)
                arr.shift();

            return out.whenWrote(arr.slice());
        },
        new WindowStream()
    );
};

/**
 * Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
 * provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
 * `reduce` etc.
 *
 * @extends DataStream
 */
class NumberStream$1 extends DataStream {

    /**
    * NumberStream options
    *
    * @typedef NumberStreamOptions
    * @prop {Function} [valueOf=Number..valueOf] value of the data item function.
    * @extends DataStreamOptions
    */

    /**
     * Creates an instance of NumberStream.
     * @param {NumberStreamOptions} options
     * @memberof NumberStream
     */
    constructor(options, ...args) {
        super(options, ...args);
    }

    get _valueOf() {
        return this._options.valueOf || ((x) => +x);
    }

}

/**
 * Calculates the sum of all items in the stream.
 *
 * @async
 * @return {Number}
 */
NumberStream$1.prototype.sum = async function sum() {
    const _valueOf = this._valueOf;
    return this.reduce((a, x) => a + _valueOf(x), 0);
};

/**
 * Calculates the sum of all items in the stream.
 *
 * @async
 * @return {Number}
 */
NumberStream$1.prototype.avg = async function avg() {
    let cnt = 0;
    const _valueOf = this._valueOf;
    return this.reduce((a, x) => (cnt * a + _valueOf(x)) / ++cnt, 0);
};

var index = {
    DataStream,
    StringStream,
    BufferStream,
    WindowStream,
    MultiStream,
    NumberStream: NumberStream$1,
    StreamError,
    ScramjetStream
};

export default index;
