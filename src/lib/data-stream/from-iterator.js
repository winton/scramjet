import {DataStream} from ".";

/**
 * Create a DataStream from an Iterator
 *
 * Doesn't end the stream until it reaches end of the iterator.
 *
 * @param  {Iterator} iter the iterator object
 * @return {DataStream}
 *
 * @test test/methods/data-stream-fromiterator.js
 */
DataStream.fromIterator =  function fromIterator(iter, options) {
    return new this(Object.assign({}, options, {
        async parallelRead() {
            const read = await iter.next();
            if (read.done) {
                return read.value ? [await read.value, null] : [null];
            } else {
                return [await read.value];
            }
        }
    }));
};

