import {DataStream} from ".";

/**
 * Aggregates chunks to arrays not delaying output by more than the given number of ms.
 *
 * @meta.noreadme
 * @chainable
 * @memberof DataStream#
 * @param  {Number} ms    Maximum ammount of milliseconds
 * @param  {Number} count Maximum number of items in batch (otherwise no limit)
 *
 * @test test/methods/data-stream-timebatch.js
 */
DataStream.prototype.timeBatch = function timeBatch(ms, count = Infinity) {
    let arr = [];

    const setTimeout = this.setTimeout;
    const clearTimeout = this.clearTimeout;

    let ret = this._selfInstance({referrer: this});

    let pushTimeout = null;

    const push = () => {
        if (pushTimeout) {
            clearTimeout(pushTimeout);
            pushTimeout = null;
        }
        const last = ret.whenWrote(arr);
        arr = [];
        return last;
    };

    this.consume(async (chunk) => {
        arr.push(chunk);
        if (arr.length >= count) {
            await push();
        } else if (!pushTimeout) {
            pushTimeout = setTimeout(push, ms);
        }
    }).then(async () => {
        if (arr.length) {
            clearTimeout(pushTimeout);
            await ret.whenWrote(arr);
        }
        ret.end();
    });

    return ret;
};
