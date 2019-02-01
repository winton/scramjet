import {DataStream} from "./";

/**
 * Shift callback
 *
 * @callback ShiftCallback
 * @param {Array<Object>} shifted an array of shifted chunks
 */

/**
 * Shifts the first n items from the stream and pushes out the remaining ones.
 *
 * @chainable
 * @param {Number} count The number of items to shift.
 * @param {ShiftCallback} func Function that receives an array of shifted items
 *
 * @test test/methods/data-stream-shift.js
 */
DataStream.prototype.shift = function shift(count, func) {
    const ret = [];
    const str = this.tap()._selfInstance({referrer: this});

    const chunkHandler = (chunk) => {
        ret.push(chunk);
        if (ret.length >= count) {
            this.pause();
            unHook().then(
                () => this.resume().pipe(str)
            );
        }
    };

    const endHandler = (...args) => {
        unHook().then(
            () => str.end(...args)
        );
    };

    const errorHandler = str.emit.bind(str, "error");

    let hooked = true;
    const unHook = () => { // jshint ignore:line
        if (hooked) {
            hooked = false;
            this.removeListener("data", chunkHandler);
            this.removeListener("end", endHandler);
            this.removeListener("error", errorHandler);
        }
        return Promise.resolve(ret)
            .then(func);
    };

    this.on("data", chunkHandler);
    this.on("end", endHandler);
    this.on("error", errorHandler);

    return str;
};
