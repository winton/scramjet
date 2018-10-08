import {StringStream} from "./";

/**
 * Appends given argument to all the items.
 *
 * @chainable
 * @memberof StringStream#
 * @param {Function|String} arg the argument to append. If function passed then it will be called and resolved and the resolution will be appended.
 *
 * @example {@link ../samples/string-stream-append.js}
 */
StringStream.prototype.append = function append(arg) {
    return typeof arg === "function" ? this.map(item => Promise.resolve(item).then(arg).then((result) => item + result)) : this.map(item => item + arg);
};
