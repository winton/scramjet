import {DataStream} from "./";


/**
 * A shorthand for streams of Arrays to flatten them.
 *
 * More efficient equivalent of: .flatmap(i => i);
 *
 * @chainable
 * @return {DataStream}
 *
 * @test test/methods/data-stream-flatten.js
 */
DataStream.prototype.flatten = function flatten() {
    return this.into(
        async (ref, out) => {
            let last = true;
            for (const val of out)
                last = ref.write(val);

            return last ? null : ref.whenDrained();
        },
        this._selfInstance()
    );
};
