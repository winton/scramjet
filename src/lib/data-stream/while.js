import {DataStream} from "./";

/**
 * Reads the stream while the function outcome is truthy.
 *
 * Stops reading and emits end as soon as it ends.
 *
 * @chainable
 * @param  {FilterCallback} func The condition check
 *
 * @test test/methods/data-stream-while.js
 */
DataStream.prototype.while = function(func) {
    let condition = true;
    const out = this._selfInstance({
        promiseTransform: func,
        beforeTransform: (chunk) => condition ? chunk : Promise.reject(DataStream.filter),
        afterTransform: (chunk, ret) => {
            if (!ret) {
                condition = false;
                this.unpipe(out);
                out.end();
                return Promise.reject(DataStream.filter);
            } else {
                return condition ? chunk : Promise.reject(DataStream.filter);
            }
        },
        referrer: this
    });

    return this.pipe(out);
};
