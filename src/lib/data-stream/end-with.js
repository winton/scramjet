import {DataStream} from ".";

/**
 * Pushes any data at end of stream
 *
 * @chainable
 * @param {*} item list of items to push at end
 * @meta.noreadme
 *
 * @test test/methods/data-stream-endwith.js
 */
DataStream.prototype.endWith = function endWith(...items) {
    // TODO: overhead on unneeded transform, but requires changes in core.
    // TODO: should accept similar args as `from`
    return this.pipe(this._selfInstance({
        referrer: this,
        promiseTransform: (a) => a,
        flushPromise: () => items
    }));
};
