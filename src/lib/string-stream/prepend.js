import {StringStream} from "./";

/**
 * Prepends given argument to all the items.
 *
 * @chainable
 * @param {Function|String} arg the argument to prepend. If function passed then it will be called and resolved
 *                              and the resolution will be prepended.
 *
 * @test test/methods/string-stream-prepend.js
 */
StringStream.prototype.prepend = function prepend(arg) {
    return typeof arg === "function" ? this.map(item => Promise.resolve(item).then(arg).then((result) => result + item)) : this.map(item => arg + item);
};
