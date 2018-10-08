import {DataStream} from "./";

/**
 * @callback RemapCallback
 * @param {Function} emit a method to emit objects in the remapped stream
 * @param {*} chunk the chunk from the original stream
 * @returns {Promise|*} promise to be resolved when chunk has been processed
 */

/**
 * Remaps the stream into a new stream.
 *
 * This means that every item may emit as many other items as we like.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {RemapCallback} func A callback that is called on every chunk
 * @param  {class} Clazz Optional DataStream subclass to be constructed
 * @return {DataStream}  a new DataStream of the given class with new chunks
 *
 * @example {@link ../samples/data-stream-remap.js}
 */
DataStream.prototype.remap = function remap(func, Clazz) {

    const ref = new (Clazz || this.constructor)({referrer: this});

    return this.into(
        async (str, chunk) => {
            let out = [];
            await func((newChunk) => out.push(newChunk), chunk);

            let last = true;
            for (const val of out)
                last = ref.write(val);

            return last ? null : ref.whenDrained();
        },
        ref
    );
};
