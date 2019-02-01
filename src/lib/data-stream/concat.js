import {DataStream} from "./";

/**
 * Returns a new stream that will append the passed streams to the callee
 *
 * @chainable
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
