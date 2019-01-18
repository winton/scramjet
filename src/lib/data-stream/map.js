import {DataStream} from "./";

/**
 * @callback MapCallback
 * @param {*} chunk the chunk to be mapped
 * @returns {Promise|*}  the mapped object
 */

/**
 * Transforms stream objects into new ones, just like Array.prototype.map
 * does.
 *
 * @param {MapCallback} func The function that creates the new object
 * @param {Class} Clazz (optional) The class to be mapped to.
 * @chainable
 *
 * @test test/methods/data-stream-map.js
 */
DataStream.prototype.map = function (func, Clazz) {
    Clazz = Clazz || this.constructor;
    return this.pipe(new Clazz({
        promiseTransform: func,
        referrer: this
    }));
};
