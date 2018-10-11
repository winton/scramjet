import {MultiStream} from "./";
import {StreamWorker} from "../stream-worker";
import { cpus } from "os";

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

