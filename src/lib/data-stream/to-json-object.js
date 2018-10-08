import {DataStream} from "./";

/**
 * Transforms the stream to a streamed JSON object.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {MapCallback} [entryCallback] async function returning an entry (array of [key, value])
 * @param  {Iterable} [enclosure='{}'] Any iterable object of two items (begining and end)
 * @return {StringStream}
 * @meta.noreadme
 *
 * @example {@link ../samples/data-stream-tojsonobject.js}
 */
DataStream.prototype.toJSONObject = function toJSONObject(entryCallback, enclosure = ["{\n","\n}"], separator = ",\n") {
    let ref = this;

    return ref.map((item) => [entryCallback(item), item])
        .toJSONArray(enclosure, separator, ([key, value]) => JSON.stringify(key.toString()) + ":" + JSON.stringify(value));
};
