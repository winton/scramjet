import {DataStream} from "./";


/**
 * @callback JoinCallback
 * @param {*} prev the chunk before
 * @param {*} next the chunk after
 * @returns {Promise<*>|*}  promise that is resolved with the joining item
 */

/**
 * Method will put the passed object between items. It can also be a function call.
 *
 * @chainable
 * @memberof DataStream#
 * @param  {*|JoinCallback} item An object that should be interweaved between stream items
 *
 * @example {@link ../samples/data-stream-join.js}
 */
DataStream.prototype.join = function join(item) {
    const ref = this._selfInstance({referrer: this});

    let prev;
    let consumer;
    if (typeof item !== "function") {
        consumer = (cur) => Promise.all([
            ref.whenWrote(item),
            ref.whenWrote(cur)
        ]);
    } else {
        consumer = cur => Promise.resolve(item(prev, cur))
            .then(joint => Promise.all([
                joint && ref.whenWrote(joint),
                ref.whenWrote(prev = cur)
            ]))
        ;
    }

    this.shift(1, ([first]) => ref.push(prev = first))
        .consume(
            consumer
        )
        .then(
            () => ref.end()
        );
    return ref;
};
