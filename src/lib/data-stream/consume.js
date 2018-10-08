import {DataStream} from "./";

/**
 * @callback ConsumeCallback
 * @param {*} chunk the stream chunk
 * @return {Promise|*} resolved when all operations are completed
 */

/**
 * Consumes the stream by running each callback
 * @deprecated use {@link DataStream#each} instead
 *
 * @async
 * @memberof DataStream#
 * @param  {Function}  func the consument
 * @meta.noreadme
 */
DataStream.prototype.consume = async function consume(func) {
    return this.tap()
        .each(func)
        .whenEnd();
};

