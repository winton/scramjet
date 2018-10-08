import {DataStream} from "./";


/**
 * Pushes any data at call time (essentially at the beginning of the stream)
 *
 * This is a synchronous only function.
 *
 * @chainable
 * @memberof DataStream#
 * @param {*} item list of items to unshift (you can pass more items)
 */
DataStream.prototype.unshift = function unshift(...items) {
    items.forEach(
        item => this.write(item)
    );
    return this.tap();
};
