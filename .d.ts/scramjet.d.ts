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
 */
declare class DataStream<T> {
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
     * .map(findInFiles)           // read some data asynchronously
     * .map(sendToAPI)             // send the data somewhere
     * .run());                    // wait until end
     * ```
     */
    constructor();

    /**
     * Accumulates data into the object.
     * 
     * Works very similarily to reduce, but result of previous operations have
     * no influence over the accumulator in the next one.
     * 
     * Method is parallel
     * @param func The accumulation function
     * @param into Accumulator object
     */
    accumulate<S>(func: AccumulateCallback<T, S>, into: any): Promise.<Array.<S>>;

    /**
     * Consumes the stream by running each callback
     * @deprecated use {@link DataStream#each} instead
     * @param func the consument
     */
    consume(func: Function): Promise;

    /**
     * Perform an asynchroneous operation without changing or resuming the stream.
     * 
     * In essence the stream will use the call to keep the backpressure, but the resolving value
     * has no impact on the streamed data (except for possile mutation of the chunk itself)
     * @param func the async function
     */
    do(func: DoCallback): DataStream;

    /**
     * Takes any method that returns any iterable and flattens the result.
     * 
     * The passed callback must return an iterable (otherwise an error will be emitted). The resulting stream will
     * consist of all the items of the returned iterables, one iterable after another.
     * @param func A callback that is called on every chunk
     * @param Clazz Optional DataStream subclass to be constructed
     */
    flatMap(func: FlatMapCallback, Clazz: class): DataStream;

    /**
     * Transforms stream objects into new ones, just like Array.prototype.map
     * does.
     * @param func The function that creates the new object
     * @param Clazz (optional) The class to be mapped to.
     */
    map(func: MapCallback, Clazz: Class): DataStream;

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
     * @param func The into object will be passed as the first
     *        argument, the data object from the stream as the second.
     * @param into Any object passed initally to the transform
     *        function
     */
    reduceNow(func: ReduceCallback, into: any | EventEmitter): any;

    /**
     * Seprates stream into a hash of streams. Does not create new streams!
     * @param streams the object hash of streams. Keys must be the outputs of the affinity function
     * @param affinity the callback function that affixes the item to specific streams which must exist in the object for each chunk.
     */
    separateInto(streams: Object<DataStream>, affinity: AffinityCallback): DataStream;

    /**
     * Aggregates chunks to arrays not delaying output by more than the given number of ms.
     * @param ms Maximum ammount of milliseconds
     * @param count Maximum number of items in batch (otherwise no limit)
     */
    timeBatch(ms: Number, count: Number): DataStream;

    /**
     * Pushes any data at call time (essentially at the beginning of the stream)
     * 
     * This is a synchronous only function.
     * @param item list of items to unshift (you can pass more items)
     */
    unshift(item: any): DataStream;

    /**
     * Transforms stream objects by assigning the properties from the returned
     * data along with data from original ones.
     * 
     * The original objects are unaltered.
     * @param func The function that returns new object properties or just the new properties
     */
    assign(func: DataStream.MapCallback | Object): DataStream;

    /**
     * Stringifies CSV to DataString using 'papaparse' module.
     * @param options options for the papaparse.unparse module.
     */
    CSVStringify(options: any): StringStream;

    /**
     * Performs an operation on every chunk, without changing the stream
     * 
     * This is a shorthand for ```stream.on("data", func)``` but with flow control.
     * Warning: this resumes the stream!
     * @param func a callback called for each chunk.
     */
    each(func: MapCallback): DataStream;

    /**
     * A shorthand for streams of Arrays to flatten them.
     * 
     * More efficient equivalent of: .flatmap(i => i);
     */
    flatten(): DataStream;

    /**
     * Allows own implementation of stream chaining.
     * 
     * The async callback is called on every chunk and should implement writes in it's own way. The
     * resolution will be awaited for flow control. The passed `into` argument is passed as the first
     * argument to every call.
     * 
     * It returns the DataStream passed as the second argument.
     * @param func the method that processes incoming chunks
     * @param into the DataStream derived class
     */
    into(func: IntoCallback, into: DataStream): DataStream;

    /**
     * Performs the Nagle's algorithm on the data. In essence it waits until we receive some more data and releases them
     * in bulk.
     * @todo needs more work, for now it's simply waiting some time, not checking the queues.
     * @param size maximum number of items to wait for
     * @param ms milliseconds to wait for more data
     */
    nagle(size?: number, ms?: number): DataStream;

    /**
     * Remaps the stream into a new stream.
     * 
     * This means that every item may emit as many other items as we like.
     * @param func A callback that is called on every chunk
     * @param Clazz Optional DataStream subclass to be constructed
     */
    remap(func: RemapCallback, Clazz: class): DataStream;

    /**
     * Shifts the first n items from the stream and pushes out the remaining ones.
     * @param count The number of items to shift.
     * @param func Function that receives an array of shifted items
     */
    shift(count: Number, func: ShiftCallback): DataStream;

    /**
     * Aggregates the stream into a single Array
     * 
     * In fact it's just a shorthand for reducing the stream into an Array.
     * @param initial Optional array to begin with.
     * @returns
     */
    toArray(initial: any[]): any[];

    /**
     * Reads the stream until the function outcome is truthy.
     * 
     * Works opposite of while.
     * @param func The condition check
     */
    until(func: FilterCallback): DataStream;

    /**
     * Aggregates chunks in arrays given number of number of items long.
     * 
     * This can be used for microbatch processing.
     * @param count How many items to aggregate
     * @returns
     */
    batch(count: Number): DataStream.<Array.<T>>;

    /**
     * Injects a ```debugger``` statement when called.
     * @param func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain
     */
    debug(func: Function): DataStream;

    /**
     * Called only before the stream ends without passing any items
     * @param callback Function called when stream ends
     */
    empty(callback: Function): DataStream;

    /**
     * Returns a DataStream from pretty much anything sensibly possible.
     * 
     * Depending on type:
     * * `self` will return self immediately
     * * `Readable` stream will get piped to the current stream with errors forwarded
     * * `Array` will get iterated and all items will be pushed to the returned stream.
     * The stream will also be ended in such case.
     * * `GeneratorFunction` will get executed to return the iterator which will be used as source for items
     * * `AsyncGeneratorFunction` will also work as above (including generators) in node v10.
     * * `Iterable`s iterator will be used as a source for streams
     * 
     * You can also pass a `Function` or `AsyncFunction` that will result in anything passed to `from`
     * subsequently. You can use your stream immediately though.
     * @param str argument to be turned into new stream
     * @param options
     */
    static from(str: any[] | Iterable | AsyncGeneratorFunction | GeneratorFunction | AsyncFunction | Function | String | Readable, options: StreamOptions | Writable): DataStream;

    /**
     * Method will put the passed object between items. It can also be a function call.
     * @param item An object that should be interweaved between stream items
     */
    join(item: any | JoinCallback): DataStream;

    /**
     * Allows previewing some of the streams data without removing them from the stream.
     * 
     * Important: Peek does not resume the flow.
     * @param count The number of items to view before
     * @param func Function called before other streams
     */
    peek(count: Number, func: ShiftCallback): DataStream;

    /**
     * Rewinds the buffered chunks the specified length backwards. Requires a prior call to {@see DataStream..keep}
     * @param count Number of objects or -1 for all the buffer
     */
    rewind(count: number): DataStream;

    /**
     * Gets a slice of the stream to the callback function.
     * 
     * Returns a stream consisting of an array of items with `0` to `start`
     * omitted and `length` items after `start` included. Works similarily to
     * Array.prototype.slice.
     * 
     * Takes count from the moment it's called. Any previous items will not be
     * taken into account.
     * @param start omit this number of entries.
     * @param length get this number of entries to the resulting stream
     */
    slice(start?: Number, length?: Number): DataStream;

    /**
     * Returns an async generator
     * 
     * Ready for https://github.com/tc39/proposal-async-iteration
     */
    toGenerator(): Iterable.<Promise.<*>>;

    /**
     * Calls the passed method in place with the stream as first argument, returns result.
     * 
     * The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
     * streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
     * from the command line.
     * @param func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module.
     * @param ...args any additional args top be passed to the module
     */
    use(func: Function | String, ...args?: any): DataStream;

    /**
     * Creates a BufferStream
     * @param serializer A method that converts chunks to buffers
     */
    bufferify(serializer: MapCallback): BufferStream;

    /**
     * Delegates work to a specified worker.
     * @param delegateFunc A function to be run in the subthread.
     * @param worker
     * @param plugins
     */
    delegate(delegateFunc: DelegateCallback, worker: WorkerStream, plugins?: any[]): DataStream;

    /**
     * Pushes any data at end of stream
     * @param item list of items to push at end
     */
    endWith(item: any): DataStream;

    /**
     * Create a DataStream from an Array.
     * @param arr list of chunks
     */
    static fromArray(arr: any[]): DataStream;

    /**
     * Returns a StringStream containing JSON per item with optional end line
     * @param endline whether to add endlines (boolean or string as delimiter)
     */
    JSONStringify(endline?: Boolean | String): StringStream;

    /**
     * Pulls in any Readable stream, resolves when the pulled stream ends.
     * 
     * Does not preserve order, does not end this stream.
     * @param incoming
     * @returns resolved when incoming stream ends, rejects on incoming error
     */
    pull(incoming: Readable): Number;

    /**
     * Consumes all stream items doing nothing. Resolves when the stream is ended.
     */
    run(): Promise;

    /**
     * Creates a StringStream
     * @param serializer A method that converts chunks to strings
     */
    stringify(serializer: MapCallback): StringStream;

    /**
     * Transforms the stream to a streamed JSON array.
     * @param enclosure Any iterable object of two items (begining and end)
     */
    toJSONArray(enclosure?: Iterable): StringStream;

    /**
     * Reads the stream while the function outcome is truthy.
     * 
     * Stops reading and emits end as soon as it ends.
     * @param func The condition check
     */
    while(func: FilterCallback): DataStream;

    /**
     * Returns a new stream that will append the passed streams to the callee
     * @param streams Streams to be passed
     */
    concat(streams: any): DataStream;

    /**
     * Distributes processing into multiple subprocesses or threads if you like.
     * @todo Currently order is not kept.
     * @todo Example test breaks travis build
     * @param affinity Number that runs round-robin the callback function that affixes the item to specific streams which must exist in the object for each chunk. Defaults to Round Robin to twice the number of cpu threads.
     * @param clusterFunc stream transforms similar to {@see DataStream#use method}
     * @param options Options
     * @see
     */
    distribute(affinity?: AffinityCallback | Number, clusterFunc: ClusterCallback, options: Object): DataStream;

    /**
     * Filters object based on the function outcome, just like
     * Array.prototype.filter.
     * @param func The function that filters the object
     */
    filter(func: FilterCallback): DataStream;

    /**
     * Create a DataStream from an Iterator
     * 
     * Doesn't end the stream until it reaches end of the iterator.
     * @param iter the iterator object
     */
    static fromIterator(iter: Iterator): DataStream;

    /**
     * Keep a buffer of n-chunks for use with {@see DataStream..rewind}
     * @param count Number of objects or -1 for all the stream
     */
    keep(count: number): DataStream;

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
     * @param func The into object will be passed as the  first argument, the data object from the stream as the second.
     * @param into Any object passed initially to the transform function
     */
    reduce(func: ReduceCallback, into: Object): Promise;

    /**
     * Creates a BufferStream
     * @param serializer A method that converts chunks to buffers
     */
    toBufferStream(serializer: MapCallback): BufferStream;

    /**
     * Creates a StringStream
     * @param serializer A method that converts chunks to strings
     */
    toStringStream(serializer: MapCallback): StringStream;

}

/**
 * 
 * @param acc Accumulator passed to accumulate function
 * @param chunk the stream chunk
 */
declare type AccumulateCallback<T,S> = (acc: any, chunk: T)=>Promise<S> | S;

/**
 * 
 * @param chunk the stream chunk
 */
declare type ConsumeCallback = (chunk: any)=>Promise | any;

/**
 * 
 * @param chunk source stream chunk
 */
declare type DoCallback = (chunk: Object)=>void;

/**
 * 
 * @param chunk the chunk from the original stream
 * @returns promise to be resolved when chunk has been processed
 */
declare type FlatMapCallback = (chunk: any)=>Promise<Iterable> | Iterable;

/**
 * 
 * @param chunk the chunk to be mapped
 * @returns the mapped object
 */
declare type MapCallback = (chunk: any)=>Promise | any;

/**
 * A stream of string objects for further transformation on top of DataStream.
 * 
 * Example:
 * 
 * ```javascript
 * StringStream.fromString()
 * ```
 */
declare class StringStream {
    /**
     * A stream of string objects for further transformation on top of DataStream.
     * 
     * Example:
     * 
     * ```javascript
     * StringStream.fromString()
     * ```
     */
    constructor(encoding: String);

    /**
     * Appends given argument to all the items.
     * @param arg the argument to append. If function passed then it will be called and resolved and the resolution will be appended.
     */
    append(arg: Function | String): StringStream;

    /**
     * Transforms the StringStream to BufferStream
     * 
     * Creates a buffer stream from the given string stream. Still it returns a
     * DataStream derivative and isn't the typical node.js stream so you can do
     * all your transforms when you like.
     */
    toBufferStream(): BufferStream;

    /**
     * Parses CSV to DataString using 'papaparse' module.
     * @param options options for the papaparse.parse method.
     */
    CSVParse(options: any): DataStream;

    /**
     * Create StringStream from anything.
     * @see module:scramjet.from
     * @param str argument to be turned into new stream
     * @param options
     */
    from(str: String | any[] | Iterable | AsyncGeneratorFunction | GeneratorFunction | AsyncFunction | Function | Readable, options: StreamOptions | Writable): StringStream;

    /**
     * Creates a StringStream and writes a specific string.
     * @param str the string to push the your stream
     * @param encoding optional encoding
     */
    fromString(str: String, encoding: String): StringStream;

    /**
     * Parses each entry as JSON.
     * Ignores empty lines
     * @param perLine instructs to split per line
     */
    JSONParse(perLine: Boolean): DataStream;

    /**
     * Splits the string stream by the specified regexp or string
     * @param eol End of line string
     */
    lines(eol?: String): StringStream;

    /**
     * Finds matches in the string stream and streams the match results
     * @param matcher A function that will be called for every
     *        stream chunk.
     */
    match(matcher: RegExp): StringStream;

    /**
     * Parses every string to object
     * 
     * The method MUST parse EVERY string into a single object, so the string
     * stream here should already be split.
     * @param parser The transform function
     */
    parse(parser: ParseCallback): DataStream;

    /**
     * Prepends given argument to all the items.
     * @param arg the argument to prepend. If function passed then it will be called and resolved
     *        and the resolution will be prepended.
     */
    prepend(arg: Function | String): StringStream;

    /**
     * Finds matches in the string stream and streams the match results
     * @param matcher A function that will be called for every
     *        stream chunk.
     */
    replace(matcher: RegExp): StringStream;

    /**
     * Shifts given length of chars from the original stream
     * 
     * Works the same way as {@see DataStream.shift}, but in this case extracts
     * the given number of characters.
     * @param bytes The number of characters to shift.
     * @param func Function that receives a string of shifted chars.
     */
    shift(bytes: Number, func: ShiftCallback): StringStream;

    /**
     * Splits the string stream by the specified regexp or string
     * @param splitter What to split by
     */
    split(splitter: RegExp | String): StringStream;

    /**
     * Shifts given length of chars from the original stream
     * 
     * Works the same way as {@see DataStream.shift}, but in this case extracts
     * the given number of characters.
     * @param bytes The number of characters to shift.
     * @param func Function that receives a string of shifted chars.
     */
    pop(bytes: Number, func: ShiftCallback): StringStream;

}

/**
 * Alias for {@link StringStream#parse}
 */
declare function toDataStream(): void;

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
 */
declare class BufferStream {
    /**
     * A factilitation stream created for easy splitting or parsing buffers.
     * 
     * Useful for working on built-in Node.js streams from files, parsing binary formats etc.
     * 
     * A simple use case would be:
     * 
     * ```javascript
     * fs.createReadStream('pixels.rgba')
     * .pipe(new BufferStream)         // pipe a buffer stream into scramjet
     * .breakup(4)                     // split into 4 byte fragments
     * .parse(buf => [
     * buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
     * buf.readInt8(1),            // values from 0-255 in an array.
     * buf.readInt8(2),
     * buf.readInt8(3)
     * ]);
     * ```
     */
    constructor(opts: object);

    /**
     * Breaks up a stream apart into chunks of the specified length
     * @param number the desired chunk length
     */
    breakup(number: Number): BufferStream;

    /**
     * Create BufferStream from anything.
     * @see module:scramjet.from
     * @param str argument to be turned into new stream
     * @param options
     */
    static from(str: any[] | Iterable | AsyncGeneratorFunction | GeneratorFunction | AsyncFunction | Function | Readable, options: StreamOptions | Writable): BufferStream;

    /**
     * Parses every buffer to object
     * 
     * The method MUST parse EVERY buffer into a single object, so the buffer
     * stream here should already be split or broken up.
     * @param parser The transform function
     */
    parse(parser: ParseCallback): DataStream;

    /**
     * Shift given number of bytes from the original stream
     * 
     * Works the same way as {@see DataStream.shift}, but in this case extracts
     * the given number of bytes.
     * @param chars The number of bytes to shift
     * @param func Function that receives a string of shifted bytes
     */
    shift(chars: Number, func: ShiftCallback): BufferStream;

    /**
     * Splits the buffer stream into buffer objects
     * @param splitter the buffer or string that the stream
     *        should be split by.
     */
    split(splitter: String | Buffer): BufferStream;

    /**
     * Creates a string stream from the given buffer stream
     * 
     * Still it returns a DataStream derivative and isn't the typical node.js
     * stream so you can do all your transforms when you like.
     * @param encoding The encoding to be used to convert the buffers
     *        to streams.
     */
    stringify(encoding: String): StringStream;

}

/**
 * 
 * @param chunk the transformed chunk
 */
declare type ParseCallback = (chunk: Buffer)=>Promise;

/**
 * Shift callback
 * @param shifted shifted bytes
 */
declare type ShiftCallback = (shifted: Buffer)=>void;

/**
 * Alias for {@link BufferStream#stringify}
 */
declare function toStringStream(): void;

/**
 * 
 * @param into stream passed to the into method
 * @param chunk source stream chunk
 */
declare type IntoCallback = (into: any, chunk: Object)=>any;

/**
 * 
 * @param emit a method to emit objects in the remapped stream
 * @param chunk the chunk from the original stream
 * @returns promise to be resolved when chunk has been processed
 */
declare type RemapCallback = (emit: Function, chunk: any)=>Promise | any;

/**
 * 
 * @param prev the chunk before
 * @param next the chunk after
 * @returns promise that is resolved with the joining item
 */
declare type JoinCallback = (prev: any, next: any)=>Promise<any> | any;

/**
 * 
 * @param chunk the chunk to be filtered or not
 * @returns information if the object should remain in
 *          the filtered stream.
 */
declare type FilterCallback = (chunk: any)=>Promise | Boolean;

/**
 * 
 * @param acc the accumulator - the object initially passed or returned
 *        by the previous reduce operation
 * @param chunk the stream chunk.
 */
declare type ReduceCallback = (acc: any, chunk: Object)=>Promise | any;

/**
 * An object consisting of multiple streams than can be refined or muxed.
 */
declare class MultiStream {
    /**
     * An object consisting of multiple streams than can be refined or muxed.
     */
    constructor(streams: any[], options: Object);

    /**
     * Array of all streams
     */
    streams: any[];

    /**
     * Returns the current stream length
     */
    length: any;

    /**
     * Adds a stream to the MultiStream
     * 
     * If the stream was muxed, filtered or mapped, this stream will undergo the
     * same transorms and conditions as if it was added in constructor.
     * @param stream [description]
     */
    add(stream: stream.Readable): void;

}

declare module 'scramjet' {
    /**
     * StreamWorker class - intended for internal use
     * 
     * This class provides control over the subprocesses, incl:
     *  - spawning
     *  - communicating
     *  - delivering streams
     */
    class StreamWorker {
        /**
         * StreamWorker class - intended for internal use
         * 
         * This class provides control over the subprocesses, incl:
         * - spawning
         * - communicating
         * - delivering streams
         */
        constructor();

        /**
         * Spawns the worker if necessary and provides the port information to it.
         */
        spawn(): StreamWorker;

        /**
         * Delegates a stream to the child using tcp socket.
         * 
         * The stream gets serialized using JSON and passed on to the subprocess.
         * The subprocess then peforms transforms on the stream and pushes them back to the main process.
         * The stream gets deserialized and outputted to the returned DataStream.
         * @param input stream to be delegated
         * @param delegateFunc Array of transforms or arrays describing ['module', 'method']
         * @param plugins List of plugins to load in the child
         */
        delegate(input: DataStream, delegateFunc: any[] | any[], plugins?: any[]): DataStream;

        /**
         * Spawns (Preforks) a given number of subprocesses and returns the worker asynchronously.
         * @param count Number of processes to spawn. If other subprocesses are active only the missing ones will be spawned.
         */
        static fork(count?: Number): StreamWorker[];

        /**
         * Picks next worker (not necessarly free one!)
         */
        static _getWorker(): StreamWorker;

    }

    /**
     * Distribute options
     */
    interface DistributeOptions {
        /**
         * a list of scramjet plugins to load (if omitted, will use just the ones in scramjet itself)
         */
        plugins: any[];
        /**
         * the class to deserialize the stream to.
         */
        StreamClass: String;
        /**
         * maximum threads to use - defauls to number of processor threads in os, but it may be sensible to go over this value if you'd intend to run synchronous code.
         */
        threads: Number;
    }

    /**
     * Wraps comparator to accept array like
     * @param comparator comparator function
     */
    function wrapComparator(comparator: Function): number;

    /**
     * The default comparator
     * @param a a
     * @param b b
     */
    function DefaultComparator(a: any, b: any): number;

    /**
     * 
     * @param multi the input multi stream
     * @param passedComparator the comparator
     * @param bufferLength number of objects to buffer
     * @param Clazz the type of stream it should return
     */
    function mergesortStream<Clazz>(multi: MultiStream, passedComparator: Function, bufferLength: number, Clazz: Function): Function;

    /**
     * Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
     * provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
     * `reduce` etc.
     */
    class NumberStream {
        /**
         * Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
         * provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
         * `reduce` etc.
         */
        constructor(options: NumberStreamOptions);

        /**
         * Calculates the sum of all items in the stream.
         */
        sum(): Number;

        /**
         * Calculates the sum of all items in the stream.
         */
        avg(): Number;

    }

    /**
     * NumberStream options
     */
    interface NumberStreamOptions {
        /**
         * value of the data item function.
         */
        valueOf?: Function;
    }

    /**
     * A stream for moving window calculation with some simple methods.
     * 
     * In essence it's a stream of Array's containing a list of items - a window.
     * It's best used when created by the `DataStream..window`` method.
     */
    class WindowStream {
        /**
         * A stream for moving window calculation with some simple methods.
         * 
         * In essence it's a stream of Array's containing a list of items - a window.
         * It's best used when created by the `DataStream..window`` method.
         */
        constructor();

        /**
         * Calculates the moving average of all items in the stream.
         * @param valueOf value of method for array items
         */
        avg(valueOf?: Function): Promise<Number>;

        /**
         * Calculates moving sum of items, the output stream will contain the moving sum.
         * @param valueOf value of method for array items
         */
        sum(valueOf?: Function): Promise<Number>;

    }

}

/**
 * StreamWorker class - intended for internal use
 * 
 * This class provides control over the subprocesses, incl:
 *  - spawning
 *  - communicating
 *  - delivering streams
 */
declare class StreamWorker {
    /**
     * StreamWorker class - intended for internal use
     * 
     * This class provides control over the subprocesses, incl:
     * - spawning
     * - communicating
     * - delivering streams
     */
    constructor();

    /**
     * Spawns the worker if necessary and provides the port information to it.
     */
    spawn(): StreamWorker;

    /**
     * Delegates a stream to the child using tcp socket.
     * 
     * The stream gets serialized using JSON and passed on to the subprocess.
     * The subprocess then peforms transforms on the stream and pushes them back to the main process.
     * The stream gets deserialized and outputted to the returned DataStream.
     * @param input stream to be delegated
     * @param delegateFunc Array of transforms or arrays describing ['module', 'method']
     * @param plugins List of plugins to load in the child
     */
    delegate(input: DataStream, delegateFunc: any[] | any[], plugins?: any[]): DataStream;

    /**
     * Spawns (Preforks) a given number of subprocesses and returns the worker asynchronously.
     * @param count Number of processes to spawn. If other subprocesses are active only the missing ones will be spawned.
     */
    static fork(count?: Number): StreamWorker[];

    /**
     * Picks next worker (not necessarly free one!)
     */
    static _getWorker(): StreamWorker;

}

/**
 * Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
 * provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
 * `reduce` etc.
 */
declare class NumberStream {
    /**
     * Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
     * provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
     * `reduce` etc.
     */
    constructor(options: NumberStreamOptions);

    /**
     * Calculates the sum of all items in the stream.
     */
    sum(): Number;

    /**
     * Calculates the sum of all items in the stream.
     */
    avg(): Number;

}

/**
 * A stream for moving window calculation with some simple methods.
 * 
 * In essence it's a stream of Array's containing a list of items - a window.
 * It's best used when created by the `DataStream..window`` method.
 */
declare class WindowStream {
    /**
     * A stream for moving window calculation with some simple methods.
     * 
     * In essence it's a stream of Array's containing a list of items - a window.
     * It's best used when created by the `DataStream..window`` method.
     */
    constructor();

    /**
     * Calculates the moving average of all items in the stream.
     * @param valueOf value of method for array items
     */
    avg(valueOf?: Function): Promise<Number>;

    /**
     * Calculates moving sum of items, the output stream will contain the moving sum.
     * @param valueOf value of method for array items
     */
    sum(valueOf?: Function): Promise<Number>;

}

