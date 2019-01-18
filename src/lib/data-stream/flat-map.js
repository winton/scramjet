import {DataStream} from "./";

/**
 * Takes any method that returns any iterable and flattens the result.
 *
 * The passed callback must return an iterable (otherwise an error will be emitted). The resulting stream will
 * consist of all the items of the returned iterables, one iterable after another.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {FlatMapCallback} func A callback that is called on every chunk
 * @param  {class} Clazz Optional DataStream subclass to be constructed
 * @return {DataStream}  a new DataStream of the given class with new chunks
 *
 * @test test/methods/data-stream-flatmap.js
 */
DataStream.prototype.flatMap = function flatMap(func, Clazz = DataStream) {
    const ref = new Clazz({referrer: this});

    return this.into(
        async (ref, chunk) => {
            const out = await func(chunk);

            let last = true;
            for (const val of out)
                last = ref.write(val);

            return last ? null : ref.whenDrained();
        },
        ref
    );
};

/**
 * @callback FlatMapCallback
 * @param {*} chunk the chunk from the original stream
 * @returns {Promise<Iterable>|Iterable}  promise to be resolved when chunk has been processed
 */
