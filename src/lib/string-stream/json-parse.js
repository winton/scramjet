import {StringStream} from "./";

/**
 * Parses each entry as JSON.
 * Ignores empty lines
 *
 * @chainable
 * @memberof StringStream#
 * @param {Boolean} perLine instructs to split per line
 * @return {DataStream}  stream of parsed items
 */
StringStream.prototype.JSONParse = function JSONParse(perLine = true) {
    let str = this;
    if (perLine) {
        str = str.lines();
    }

    return str.filter(a => a !== "").parse(JSON.parse);
};
