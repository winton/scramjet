import {DataStream} from "./";

/**
 * Called only before the stream ends without passing any items
 *
 * @chainable
 * @memberof DataStream#
 * @param  {Function} callback Function called when stream ends
 *
 * @test test/methods/data-stream-empty.js
 */
DataStream.prototype.empty = function empty(callback) {
    let z = false;
    const promiseTransform = () => {
        z = true;
        this.dropTransform(promiseTransform);
    };

    this.pushTransform({promiseTransform})
        .tap()
        .whenEnd()
        .then(
            () => (z || Promise.resolve().then(callback)),
            () => 0
        );

    return this;
};
