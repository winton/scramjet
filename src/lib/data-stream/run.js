import {DataStream} from "./";

/**
 * Consumes all stream items doing nothing. Resolves when the stream is ended.
 *
 * @async
 */
DataStream.prototype.run = async function () {
    return this.on("data", () => 0).whenEnd();
};
