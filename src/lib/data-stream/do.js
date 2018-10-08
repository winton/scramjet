import {DataStream} from "./";

/**
 * @callback DoCallback
 * @async
 * @param {Object} chunk source stream chunk
 */

/**
 * Perform an asynchroneous operation without changing or resuming the stream.
 *
 * In essence the stream will use the call to keep the backpressure, but the resolving value
 * has no impact on the streamed data (except for possile mutation of the chunk itself)
 *
 * @chainable
 * @param {DoCallback} func the async function
 */
DataStream.prototype.do = function(func) {
    return this.map(async (chunk) => (await func(chunk), chunk));
};

// TODO: rethink
