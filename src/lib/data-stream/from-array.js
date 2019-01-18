import {DataStream} from ".";

/**
 * Create a DataStream from an Array.
 *
 * @param  {Array} arr list of chunks
 * @return {DataStream}
 *
 * @test test/methods/data-stream-fromarray.js
 */
DataStream.fromArray = function fromArray(arr, options) {
    const ret = new this(options);
    arr = arr.slice();
    arr.forEach((item) => ret.write(item));
    ret.end();
    return ret;
};
