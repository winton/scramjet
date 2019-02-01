import {DataStream} from "./";

/**
 * Injects a ```debugger``` statement when called.
 *
 * @meta.noreadme
 * @chainable
 * @param  {Function} func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain
 * @return {DataStream}  self
 *
 * @test test/methods/data-stream-debug.js
 */
DataStream.prototype.debug = function debug(func) {
    debugger; // eslint-disable-line
    this.use(func);
    return this;
};
