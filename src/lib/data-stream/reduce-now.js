import {DataStream} from "./";
import { EventEmitter } from "events";


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
