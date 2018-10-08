import {DataStream} from "./";
import {PromiseTransformStream} from "scramjet-core";

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
 * @example {@link ../samples/data-stream-reduce.js}
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
