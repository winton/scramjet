import {MultiStream} from "./";
import { DataStream } from "../data-stream";
import {mergesortStream} from "../util/merge-sort";
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
 * @example {@link ../samples/multi-stream-mux.js}
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
