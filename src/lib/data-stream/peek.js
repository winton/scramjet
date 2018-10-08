import {DataStream} from "./";

/**
 * Allows previewing some of the streams data without removing them from the stream.
 *
 * Important: Peek does not resume the flow.
 *
 * @memberof DataStream#
 * @param  {Number} count The number of items to view before
 * @param  {ShiftCallback} func Function called before other streams
 * @chainable
 */
DataStream.prototype.peek = function peek(count, func) {
    const ref = this._selfInstance({referrer: this});

    this
        .tap()
        .pipe(ref)
        .shift(count, batch => {
            this.unpipe(ref);
            return func(batch);
        });

    return this;
};
