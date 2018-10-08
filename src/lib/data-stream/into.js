import {DataStream} from "./";

/**
 * @callback IntoCallback
 * @async
 * @param {*} into stream passed to the into method
 * @param {Object} chunk source stream chunk
 * @return {*}  resolution for the old stream (for flow control only)
 */

/**
 * Allows own implementation of stream chaining.
 *
 * The async callback is called on every chunk and should implement writes in it's own way. The
 * resolution will be awaited for flow control. The passed `into` argument is passed as the first
 * argument to every call.
 *
 * It returns the DataStream passed as the second argument.
 *
 * @chainable
 * @param  {IntoCallback} func the method that processes incoming chunks
 * @param  {DataStream} into the DataStream derived class
 *
 * @example {@link ../samples/data-stream-into.js}
 */
DataStream.prototype.into = function (func, into) {
    if (!(into instanceof DataStream)) throw new Error("Stream must be passed!");

    if (!into._options.referrer)
        into.setOptions({referrer: this});

    this.tap()
        .catch(e => into.raise(e))
        .pipe(new (this.constructor)({  // TODO: this stream may not be necessary
            promiseTransform: async (chunk) => {
                try {
                    await func(into, chunk);
                } catch(e) {
                    into.raise(e);
                }
            },
            referrer: this
        }))
        .on("end", () => into.end())
        .resume();

    return into;
};
