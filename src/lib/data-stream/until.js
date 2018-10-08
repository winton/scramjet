import {DataStream} from "./";

/**
 * Reads the stream until the function outcome is truthy.
 *
 * Works opposite of while.
 *
 * @chainable
 * @param  {FilterCallback} func The condition check
 *
 * @example {@link ../samples/data-stream-until.js}
 */
DataStream.prototype.until = function(func) {
    return this.while((...args) => Promise.resolve(func(...args)).then((a) => !a));
};
