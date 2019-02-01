![Scramjet Logo](https://signicode.com/scramjet-logo-light.svg)

**Version 4**

[![Master Build Status](https://travis-ci.org/signicode/scramjet.svg?branch=master)](https://travis-ci.org/signicode/scramjet)
[![Develop Build Status](https://travis-ci.org/signicode/scramjet.svg?branch=develop)](https://travis-ci.org/signicode/scramjet)
[![Dependencies](https://david-dm.org/signicode/scramjet/status.svg)](https://david-dm.org/signicode/scramjet)
[![Dev Dependencies](https://david-dm.org/signicode/scramjet/dev-status.svg)](https://david-dm.org/signicode/scramjet?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/signicode/scramjet/badge.svg)](https://snyk.io/test/github/signicode/scramjet)
[![Greenkeeper badge](https://badges.greenkeeper.io/signicode/scramjet.svg)](https://greenkeeper.io/)
[![DeepScan grade](https://deepscan.io/api/projects/2632/branches/17801/badge/grade.svg)](https://deepscan.io/dashboard#view=project&pid=2632&bid=17801)

## What does it do?
Scramjet is a fast, simple, multi-threaded functional stream programming framework written on top of node.js object
streams. The code is written by chaining functions that transform the streamed data, including well known map, filter and
reduce and fully compatible with ES7 async/await. Thanks to it some built in optimizations scramjet is much faster and much
much simpler than similar frameworks when using asynchronous operations.

The main advantage of scramjet is running asynchronous operations on your data streams. First of all it allows you to
perform the transformations both synchronously and asynchronously by using the same API - so now you can "map" your
stream from whatever source and call any number of API's consecutively.

The benchmarks are published in the [scramjet-benchmark repo](https://github.com/signicode/scramjet-benchmark).

## Example

How about a full API to API migration, reading a long list of items from one API and checking them one after another,
pushing them to another API? With simultaneous request control? And outputting the log of the conversion? Easy!

```javascript
const request = require("request");
const rp = require("request-promise-native");
const { StringStream } = require("scramjet");

StringStream.from(                                 // fetch your API to a scramjet stream
    request("https://api.example.org/v1/shows/list")
)
    .setOptions({maxParallel: 4})                  // set your options
    .lines()                                       // split the stream by line
    .parse(theirShow => {                          // parse to your requirement
        return {
            id: theirShow.id,
            title: theirShow.name,
            url: theirShow.url
        };
    })
    .map(myShow => rp({                            // parse to your requirement
        method: "POST",
        simple: true,
        uri: `http://api.local/set/${myShow.id}`,
        body: JSON.stringify(myShow)
    }))
    .map(resp => `+ Update succeeded "${resp}"`)  // make your logs
    .catch(err => `! Error occured ${err.uri}`)
    .toStringStream()
    .append("\n")
    .pipe(process.stdout)   // pipe to any output
;

```

## Usage

Scramjet uses functional programming to run transformations on your data streams in a fashion very similar to the well
known event-stream node module. Most transformations are done by passing a transform function. You can write your
function in three ways:

1. Synchronous

 Example: a simple stream transform that outputs a stream of objects of the same id property and the length of the value string.

 ```javascript
DataStream
    .from(items)
    .map(
        (item) => ({id: item.id, length: item.value.length})
    )
 ```

2. Asynchronous using ES2015 async await

Example: A simple stream that uses `Fetch API` to get all the contents of all entries in the stream

```javascript
StringStream
    .from(urls)
    .map(
        async (url) => fetch(url).then(res => res.json())
    )
    .JSONParse()
```

3. Asynchronous using Promises

 Example: A simple stream that fetches an url mentioned in the incoming object

 ```javascript
    datastream.map(
        (item) => new Promise((resolve, reject) => {
            request(item.url, (err, res, data) => {
                if (err)
                    reject(err); // will emit an "error" event on the stream
                else
                    resolve(data);
            });
        })
    )
 ```

The actual logic of this transform function is as if you passed your function to the `then` method of a Promise
resolved with the data from the input stream.

4. Streams with multi-threading

To distribute your code among the processor cores, just use the method ```distribute```:

 ```javascript
    datastream.distribute(
        16, // number of threads
        (stream) => {
            // multi-threaded code goes here.
            // it MUST return a valid stream back to the main thread.
        }
    )
 ```

## Typescript support

Scramjet aims to be fully documented and expose TypeScript declarations. First version to include  definitions in `.d.ts`
folder is 4.15.0. More TypeScript support will be added with next versions, so feel free to report issues in GitHub.

## Detailed docs

Here's the list of the exposed classes and methods, please review the specific documentation for details:

* [```scramjet```](docs/index.md) - module exports explained
* [```scramjet.DataStream```](docs/data-stream.md) - the base class for all scramjet classes, object stream.
* [```scramjet.BufferStream```](docs/buffer-stream.md) - a stream of Buffers.
* [```scramjet.StringStream```](docs/string-stream.md) - a stream of Strings.
* [```scramjet.NumberStream```](docs/number-stream.md) - a stream of Numbers
* [```scramjet.MultiStream```](docs/multi-stream.md) - A group of streams (for multi-threading and muxing).
* [more on plugins](docs/plugins.md) - a description and link.

Note that:

* Most of the methods take a callback argument that operates on the stream items.
* The callback, unless it's stated otherwise, will receive an argument with the next chunk.
* If you want to perform your operations asynchronously, return a Promise, otherwise just return the right value.

## CLI

Check out the command line interface for simplified scramjet usage with [scramjet-cli](https://www.npmjs.com/package/scramjet-cli)

    $ sjr -i http://datasource.org/file.csv ./transform-module-1 ./transform-module-1 | gzip > logs.gz

## Quick reference of some methods

### BufferStream

A factilitation stream created for easy splitting or parsing buffers.

Useful for working on built-in Node.js streams from files, parsing binary formats etc.

A simple use case would be:

```javascript
 fs.createReadStream('pixels.rgba')
     .pipe(new BufferStream)         // pipe a buffer stream into scramjet
     .breakup(4)                     // split into 4 byte fragments
     .parse(buf => [
         buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
         buf.readInt8(1),            // values from 0-255 in an array.
         buf.readInt8(2),
         buf.readInt8(3)
     ]);
```

[Detailed BufferStream docs here](docs/constructor.md)

**Most popular methods:**

* `new exports.BufferStream(opts)` - Creates the BufferStream
* [`bufferStream.breakup(number) : BufferStream ↺`](docs/breakup.md#BufferStream+breakup) - Breaks up a stream apart into chunks of the specified length
* [`bufferStream.parse(parser) : DataStream`](docs/parse.md#BufferStream+parse) - Parses every buffer to object
* [`bufferStream.shift(chars, func) : BufferStream ↺`](docs/shift.md#BufferStream+shift) - Shift given number of bytes from the original stream
* [`bufferStream.split(splitter) : BufferStream ↺`](docs/split.md#BufferStream+split) - Splits the buffer stream into buffer objects
* [`bufferStream.stringify(encoding) : StringStream`](docs/stringify.md#BufferStream+stringify) - Creates a string stream from the given buffer stream
* [`BufferStream:from(str, options) : BufferStream`](docs/from.md#BufferStream.from) - Create BufferStream from anything.

### DataStream

DataStream is the primary stream type for Scramjet. When you parse your
stream, just pipe it you can then perform calculations on the data objects
streamed through your flow.

Use as:

```javascript
const { DataStream } = require('scramjet');

await (DataStream.from(aStream) // create a DataStream
    .map(findInFiles)           // read some data asynchronously
    .map(sendToAPI)             // send the data somewhere
    .run());                    // wait until end
```

[Detailed DataStream docs here](docs/constructor.md)

**Most popular methods:**

* [`dataStream.accumulate(func, into) : Promise ⇄`](docs/accumulate.md#DataStream+DataStream+accumulate) - Accumulates data into the object.
* [`dataStream.assign(func) ↺`](docs/assign.md#DataStream+DataStream+assign) - Transforms stream objects by assigning the properties from the returned
* [`dataStream.batch(count) ↺`](docs/batch.md#DataStream+DataStream+batch) - Aggregates chunks in arrays given number of number of items long.
* [`dataStream.bufferify(serializer) : BufferStream ↺`](docs/bufferify.md#DataStream+bufferify) - Creates a BufferStream
* [`dataStream.concat(streams) ↺`](docs/concat.md#DataStream+DataStream+concat) - Returns a new stream that will append the passed streams to the callee
* [`~~dataStream.consume(func) ⇄~~`](docs/consume.md#DataStream+DataStream+consume) - Consumes the stream by running each callback
* [`dataStream.CSVStringify(options) : StringStream ↺`](docs/csv-stringify.md#DataStream+DataStream+CSVStringify) - Stringifies CSV to DataString using 'papaparse' module.
* [`dataStream.debug(func) : DataStream ↺`](docs/debug.md#DataStream+DataStream+debug) - Injects a ```debugger``` statement when called.
* [`dataStream.delegate(delegateFunc, worker, [plugins]) ↺`](docs/delegate.md#DataStream+DataStream+delegate) - Delegates work to a specified worker.
* [`dataStream.distribute([affinity], clusterFunc, options) ↺`](docs/distribute.md#DataStream+DataStream+distribute) - Distributes processing into multiple subprocesses or threads if you like.
* [`dataStream.do(func) ↺`](docs/do.md#DataStream+do) - Perform an asynchroneous operation without changing or resuming the stream.
* [`dataStream.each(func) ↺`](docs/each.md#DataStream+each) - Performs an operation on every chunk, without changing the stream
* [`dataStream.empty(callback) ↺`](docs/empty.md#DataStream+DataStream+empty) - Called only before the stream ends without passing any items
* [`dataStream.endWith(item) ↺`](docs/end-with.md#DataStream+DataStream+endWith) - Pushes any data at end of stream
* [`dataStream.filter(func) ↺`](docs/filter.md#DataStream+filter) - Filters object based on the function outcome, just like
* [`dataStream.flatMap(func, Clazz) : DataStream ↺`](docs/flat-map.md#DataStream+DataStream+flatMap) - Takes any method that returns any iterable and flattens the result.
* [`dataStream.flatten() : DataStream ↺`](docs/flatten.md#DataStream+DataStream+flatten) - A shorthand for streams of Arrays to flatten them.
* [`dataStream.into(func, into) ↺`](docs/into.md#DataStream+into) - Allows own implementation of stream chaining.
* [`dataStream.join(item) ↺`](docs/join.md#DataStream+DataStream+join) - Method will put the passed object between items. It can also be a function call.
* [`dataStream.JSONStringify([endline]) : StringStream ↺`](docs/json-stringify.md#DataStream+DataStream+JSONStringify) - Returns a StringStream containing JSON per item with optional end line
* [`dataStream.keep(count) ↺`](docs/keep.md#DataStream+DataStream+keep) - Keep a buffer of n-chunks for use with {@see DataStream..rewind}
* [`dataStream.map(func, Clazz) ↺`](docs/map.md#DataStream+map) - Transforms stream objects into new ones, just like Array.prototype.map
* [`dataStream.nagle([size], [ms]) ↺`](docs/nagle.md#DataStream+DataStream+nagle) - Performs the Nagle's algorithm on the data. In essence it waits until we receive some more data and releases them
* [`dataStream.peek(count, func) ↺`](docs/peek.md#DataStream+DataStream+peek) - Allows previewing some of the streams data without removing them from the stream.
* [`dataStream.pull(incoming) : Number ⇄`](docs/pull.md#DataStream+DataStream+pull) - Pulls in any Readable stream, resolves when the pulled stream ends.
* [`dataStream.reduceNow(func, into) : * ↺`](docs/reduce-now.md#DataStream+DataStream+reduceNow) - Reduces the stream into the given object, returning it immediately.
* [`dataStream.reduce(func, into) ⇄`](docs/reduce.md#DataStream+reduce) - Reduces the stream into a given accumulator
* [`dataStream.remap(func, Clazz) : DataStream ↺`](docs/remap.md#DataStream+DataStream+remap) - Remaps the stream into a new stream.
* [`dataStream.rewind(count) ↺`](docs/rewind.md#DataStream+DataStream+rewind) - Rewinds the buffered chunks the specified length backwards. Requires a prior call to {@see DataStream..keep}
* [`dataStream.run() ⇄`](docs/run.md#DataStream+run) - Consumes all stream items doing nothing. Resolves when the stream is ended.
* [`dataStream.separateInto(streams, affinity) ↺`](docs/separate-into.md#DataStream+DataStream+separateInto) - Seprates stream into a hash of streams. Does not create new streams!
* [`dataStream.separate(affinity, createOptions) : MultiStream ↺`](docs/separate.md#DataStream+DataStream+separate) - Separates execution to multiple streams using the hashes returned by the passed callback.
* [`dataStream.shift(count, func) ↺`](docs/shift.md#DataStream+DataStream+shift) - Shifts the first n items from the stream and pushes out the remaining ones.
* [`dataStream.slice([start], [length]) ↺`](docs/slice.md#DataStream+DataStream+slice) - Gets a slice of the stream to the callback function.
* [`dataStream.stringify(serializer) : StringStream ↺`](docs/stringify.md#DataStream+stringify) - Creates a StringStream
* [`dataStream.tee(func) ↺`](docs/tee.md#DataStream+tee) - Duplicate the stream
* [`dataStream.timeBatch(ms, count) ↺`](docs/time-batch.md#DataStream+DataStream+timeBatch) - Aggregates chunks to arrays not delaying output by more than the given number of ms.
* [`dataStream.toArray(initial) : Array ⇄`](docs/to-array.md#DataStream+toArray) - Aggregates the stream into a single Array
* [`dataStream.toGenerator() : Iterable.<Promise.<*>>`](docs/to-generator.md#DataStream+toGenerator) - Returns an async generator
* [`dataStream.toJSONArray([enclosure]) : StringStream ↺`](docs/to-json-array.md#DataStream+DataStream+toJSONArray) - Transforms the stream to a streamed JSON array.
* [`dataStream.toJSONObject([entryCallback], [enclosure]) : StringStream ↺`](docs/to-json-object.md#DataStream+DataStream+toJSONObject) - Transforms the stream to a streamed JSON object.
* [`dataStream.unshift(item) ↺`](docs/unshift.md#DataStream+DataStream+unshift) - Pushes any data at call time (essentially at the beginning of the stream)
* [`dataStream.until(func) ↺`](docs/until.md#DataStream+until) - Reads the stream until the function outcome is truthy.
* [`dataStream.use(func) ↺`](docs/use.md#DataStream+use) - Calls the passed method in place with the stream as first argument, returns result.
* [`dataStream.while(func) ↺`](docs/while.md#DataStream+while) - Reads the stream while the function outcome is truthy.
* [`dataStream.window(length) : WindowStream ↺`](docs/window.md#DataStream+DataStream+window) - Returns a WindowStream of the specified length
* [`dataStream.toBufferStream(serializer) : BufferStream ↺`](docs/bufferify.md#DataStream+toBufferStream) - Creates a BufferStream
* [`dataStream.toStringStream(serializer) : StringStream ↺`](docs/stringify.md#DataStream+toStringStream) - Creates a StringStream
* [`DataStream:fromArray(arr) : DataStream`](docs/from-array.md#DataStream.fromArray) - Create a DataStream from an Array.
* [`DataStream:fromIterator(iter) : DataStream`](docs/from-iterator.md#DataStream.fromIterator) - Create a DataStream from an Iterator
* [`DataStream:from(str, options) : DataStream`](docs/from.md#DataStream.from) - Returns a DataStream from pretty much anything sensibly possible.

### MultiStream

An object consisting of multiple streams than can be refined or muxed.

[Detailed MultiStream docs here](docs/constructor.md)

**Most popular methods:**

* `new exports.MultiStream(streams, options)` - Crates an instance of MultiStream with the specified stream list
* [`multiStream.streams : Array`](docs/constructor.md#MultiStream+streams) - Array of all streams
* [`multiStream.length : number`](docs/constructor.md#MultiStream+length) - Returns the current stream length
* [`multiStream.add(stream)`](docs/add.md#MultiStream+add) - Adds a stream to the MultiStream
* [`multiStream.cluster(clusterFunc, options) ↺`](docs/cluster.md#MultiStream+MultiStream+cluster) - Distributes processing to multiple forked subprocesses.
* [`multiStream.filter(func) : MultiStream ↺`](docs/filter.md#MultiStream+filter) - Filters the stream list and returns a new MultiStream with only the
* [`multiStream.find(args) : DataStream`](docs/find.md#MultiStream+find) - Calls Array.prototype.find on the streams
* [`multiStream.map(aFunc) : MultiStream ↺`](docs/map.md#MultiStream+map) - Returns new MultiStream with the streams returned by the transform.
* [`multiStream.mux(cmp) : DataStream`](docs/mux.md#MultiStream+mux) - Muxes the streams into a single one
* [`multiStream.remove(stream)`](docs/remove.md#MultiStream+remove) - Removes a stream from the MultiStream
* [`multiStream.route([policy], [count]) : MultiStream`](docs/route.md#MultiStream+MultiStream+route) - Re-routes streams to a new MultiStream of specified size
* [`multiStream.smap(transform) ↺`](docs/smap.md#MultiStream+MultiStream+smap) - Map stream synchronously

### NumberStream

Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
`reduce` etc.

[Detailed NumberStream docs here](docs/constructor.md)

**Most popular methods:**

* `new exports.NumberStream(options)` - Creates an instance of NumberStream.
* [`numberStream.avg() : Number ⇄`](docs/avg.md#NumberStream+avg) - Calculates the sum of all items in the stream.
* [`numberStream.sum() : Number ⇄`](docs/sum.md#NumberStream+sum) - Calculates the sum of all items in the stream.

### StringStream

A stream of string objects for further transformation on top of DataStream.

Example:

```javascript
StringStream.fromString()
```

[Detailed StringStream docs here](docs/constructor.md)

**Most popular methods:**

* `new exports.StringStream(encoding)` - Constructs the stream with the given encoding
* [`stringStream.append(arg) ↺`](docs/append.md#StringStream+StringStream+append) - Appends given argument to all the items.
* [`stringStream.toBufferStream() : BufferStream ↺`](docs/bufferify.md#StringStream+toBufferStream) - Transforms the StringStream to BufferStream
* [`stringStream.CSVParse(options) : DataStream ↺`](docs/csv-parse.md#StringStream+StringStream+CSVParse) - Parses CSV to DataString using 'papaparse' module.
* [`stringStream.fromString(str, encoding) : StringStream`](docs/from-string.md#StringStream+fromString) - Creates a StringStream and writes a specific string.
* [`stringStream.from(str, options) : StringStream`](docs/from.md#StringStream+from) - Create StringStream from anything.
* [`stringStream.JSONParse(perLine) : DataStream ↺`](docs/json-parse.md#StringStream+StringStream+JSONParse) - Parses each entry as JSON.
* [`stringStream.lines([eol]) ↺`](docs/lines.md#StringStream+StringStream+lines) - Splits the string stream by the specified regexp or string
* [`stringStream.match(matcher) ↺`](docs/match.md#StringStream+match) - Finds matches in the string stream and streams the match results
* [`stringStream.parse(parser) : DataStream ↺`](docs/parse.md#StringStream+parse) - Parses every string to object
* [`stringStream.prepend(arg) ↺`](docs/prepend.md#StringStream+StringStream+prepend) - Prepends given argument to all the items.
* [`stringStream.replace(matcher) ↺`](docs/replace.md#StringStream+replace) - Finds matches in the string stream and streams the match results
* [`stringStream.shift(bytes, func) ↺`](docs/shift.md#StringStream+shift) - Shifts given length of chars from the original stream
* [`stringStream.split(splitter) ↺`](docs/split.md#StringStream+split) - Splits the string stream by the specified regexp or string
* [`stringStream.pop(bytes, func) ↺`](docs/shift.md#StringStream+pop) - Shifts given length of chars from the original stream

### WindowStream

A stream for moving window calculation with some simple methods.

In essence it's a stream of Array's containing a list of items - a window.
It's best used when created by the `DataStream..window`` method.

[Detailed WindowStream docs here](docs/constructor.md)

**Most popular methods:**

* [`windowStream.avg([valueOf]) : Promise.<Number> ↺`](docs/avg.md#WindowStream+avg) - Calculates the moving average of all items in the stream.
* [`windowStream.sum([valueOf]) : Promise.<Number> ↺`](docs/sum.md#WindowStream+sum) - Calculates moving sum of items, the output stream will contain the moving sum.

### :StreamWorker

StreamWorker class - intended for internal use

This class provides control over the subprocesses, incl:
 - spawning
 - communicating
 - delivering streams

[Detailed :StreamWorker docs here](docs/stream-worker.md)

**Most popular methods:**

* `new exports.StreamWorker()` - Private constructor
* [`streamWorker.spawn() : StreamWorker ⇄`](docs/stream-worker.md#module_ScramjetCore.StreamWorker+spawn) - Spawns the worker if necessary and provides the port information to it.
* [`streamWorker.delegate(input, delegateFunc, [plugins]) : DataStream`](docs/stream-worker.md#module_ScramjetCore.StreamWorker+delegate) - Delegates a stream to the child using tcp socket.
* [`StreamWorker:fork([count]) : Array.<StreamWorker> ⇄`](docs/stream-worker.md#module_ScramjetCore.StreamWorker.fork) - Spawns (Preforks) a given number of subprocesses and returns the worker asynchronously.
* [`StreamWorker:_getWorker() : StreamWorker ⇄`](docs/stream-worker.md#module_ScramjetCore.StreamWorker._getWorker) - Picks next worker (not necessarly free one!)



## Scramjet core

Don't like dependencies? Scramjet packs just a couple of those, but if you are really really annoyed by second depth of
deps, please try [scramjet-core](https://www.npmjs.com/package/scramjet-core).

Only the most vital methods there, but the library is dependency free.

## License and contributions

As of version 2.0 Scramjet is MIT Licensed.

## Help wanted

The project need's your help! There's lots of work to do - transforming and muxing, joining and splitting, browserifying, modularizing, documenting and issuing those issues.

If you want to help and be part of the Scramjet team, please reach out to me, signicode on Github or email me: scramjet@signicode.com.
