import {DataStream} from "./";
import {PromiseTransformStream} from "scramjet-core";

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
