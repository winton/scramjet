import {DataStream} from "./";
import { cpus } from "os";

/**
 * Distributes processing into multiple subprocesses or threads if you like.
 *
 * @todo Currently order is not kept.
 * @todo Example test breaks travis build
 *
 * @chainable
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
