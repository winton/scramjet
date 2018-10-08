import {MultiStream} from "./";

/**
 * Returns new MultiStream with the streams returned by the transform.
 *
 * Runs callback for every stream, returns a new MultiStream of mapped
 * streams and creates a new multistream consisting of streams returned
 * by the callback.
 *
 * @chainable
 * @param  {MapCallback} aFunc Mapper ran in Promise::then (so you can
 *                                  return a promise or an object)
 * @return {MultiStream}  the mapped instance
 *
 * @example {@link ../samples/multi-stream-map.js}
 */
MultiStream.prototype.map =  function map(aFunc, rFunc) {
    return Promise.all(
        this.streams.map(
            (s) => {
                return Promise.resolve(s)
                    .then(aFunc)
                ;
            }
        )
    ).then(
        (streams) => {
            const out = new (this.constructor)(
                streams
            );

            this.on(
                "add",
                (stream) => Promise.resolve(stream)
                    .then(aFunc)
                    .then(out.add.bind(out))
            );

            if (rFunc)
                this.on(
                    "remove",
                    (stream) => Promise.resolve(stream)
                        .then(rFunc)
                        .then(out.remove.bind(out))
                );

            return out;
        }
    );
};

