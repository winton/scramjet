import {DataStream} from "./";
import { Writable } from "stream";


/**
 * Duplicate the stream
 *
 * Creates a duplicate stream instance and passes it to the callback.
 *
 * @chainable
 * @param {TeeCallback|Writable} func The duplicate stream will be passed as first argument.
 *
 * @example {@link ../samples/data-stream-tee.js}
 */
DataStream.prototype.tee = function(func) {
    if (func instanceof Writable)
        return (this.tap().pipe(func), this);
    func(this.pipe(this._selfInstance()));
    return this.tap();
};
