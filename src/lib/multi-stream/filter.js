import {MultiStream} from "./";

/**
 * Filters the stream list and returns a new MultiStream with only the
 * streams for which the callback returned true
 *
 * @chainable
 * @param  {TransformFunction} func Filter ran in Promise::then (so you can
 *                                  return a promise or a boolean)
 * @return {MultiStream}  the filtered instance
 *
 * @example {@link ../samples/multi-stream-filter.js}
 */
MultiStream.prototype.filter =  function filter(func) {
    return Promise.all(
        this.streams.map(
            (s) => Promise.resolve(s)
                .then(func)
                .then((o) => o ? s : null)
        )
    ).then(
        (streams) => {
            const out = new (this.constructor)(
                streams.filter((s) => s)
            );
            this.on(
                "add",
                (stream) => Promise.resolve(stream)
                    .then(func)
                    .then(out.add.bind(out))
            );
            this.on(
                "remove", out.remove.bind(out)
            );
            return out;
        }
    );
};
