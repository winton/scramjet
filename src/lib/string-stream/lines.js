import {StringStream} from "./";

/**
 * Splits the string stream by the specified regexp or string
 *
 * @chainable
 * @memberof StringStream#
 * @param  {String} [eol=/\r?\n/] End of line string
 *
 * @example {@link ../samples/string-stream-split.js}
 */
StringStream.prototype.lines = function lines(eol = /\r?\n/) {
    return this.split(eol);
};

