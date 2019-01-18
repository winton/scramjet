import { EventEmitter } from "events";

/**
 * An object consisting of multiple streams than can be refined or muxed.
 */
export class MultiStream extends EventEmitter {

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
