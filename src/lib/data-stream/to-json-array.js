import {DataStream} from "./";
import {StringStream} from "../string-stream";

/**
 * Transforms the stream to a streamed JSON array.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {Iterable} [enclosure='[]'] Any iterable object of two items (begining and end)
 * @return {StringStream}
 * @meta.noreadme
 *
 * @example {@link ../samples/data-stream-tojsonarray.js}
 */
DataStream.prototype.toJSONArray = function toJSONArray(enclosure = ["[\n", "\n]"], separator = ",\n", stringify = JSON.stringify) {
    const ref = new StringStream({referrer: this});

    this.shift(1, ([first]) => (ref.push(enclosure[0]), ref.whenWrote(stringify(first))))
        .consume(
            (chunk) => Promise.all([
                ref.whenWrote(separator),
                ref.whenWrote(stringify(chunk))
            ])
        )
        .then(
            () => ref.end(enclosure[1])
        );

    return ref;
};
