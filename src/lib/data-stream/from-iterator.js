import {DataStream} from "./";

/**
 * Create a DataStream from an Iterator
 *
 * Doesn't end the stream until it reaches end of the iterator.
 *
 * @param  {Iterator} iter the iterator object
 * @return {DataStream}
 *
 * @example {@link ../samples/data-stream-fromiterator.js}
 */
DataStream.prototype.fromIterator =  function fromIterator(iter, options) {
    return new this(Object.assign({}, options, {
        async parallelRead() {
            const read = await iter.next();
            if (read.done) {
                return read.value ? [read.value, null] : [null];
            } else {
                return [read.value];
            }
        }
    }));
};

