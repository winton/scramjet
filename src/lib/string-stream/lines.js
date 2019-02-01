import {StringStream} from "./";

/**
 * Splits the string stream by the specified regexp or string
 *
 * @chainable
 * @param  {String} [eol=/\r?\n/] End of line string
 *
 * @test test/methods/string-stream-split.js
 */
StringStream.prototype.lines = function lines(eol = /\r?\n/) {
    return this.split(eol);
};

