import {MultiStream} from "./";

/**
 * Map stream synchronously
 *
 * @chainable
 * @memberof MultiStream#
 * @param  {Function} transform mapping function ran on every stream (SYNCHRONOUS!)
 */
MultiStream.prototype.smap = function smap(transform) {
    const out = new this.constructor(this.streams.map(transform));
    this.each(
        out.add.bind(out),
        out.remove.bind(out)
    );
    return out;
};
