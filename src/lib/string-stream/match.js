import {StringStream} from "./";


/**
 * Finds matches in the string stream and streams the match results
 *
 * @chainable
 * @param  {RegExp} matcher A function that will be called for every
 *                             stream chunk.
 *
 * @example {@link ../samples/string-stream-match.js}
 */
StringStream.prototype.match = function match(matcher) {
    if (matcher instanceof RegExp) {
        const replaceRegex = (matcher.source.search(/\((?!\?)/g) > -1) ?
            new RegExp("[\\s\\S]*?" + matcher.source, (matcher.ignoreCase ? "i" : "") + (matcher.multiline ? "m" : "") + (matcher.unicode ? "u" : "") + "g") :
            new RegExp("[\\s\\S]*?(" + matcher.source + ")", (matcher.ignoreCase ? "i" : "") + (matcher.multiline ? "m" : "") + (matcher.unicode ? "u" : "") + "g")
            ;

        return this.tap().pipe(this._selfInstance({
            transform(chunk, encoding, callback) {
                this.buffer = (this.buffer || "") + chunk.toString("utf-8");
                this.buffer = this.buffer.replace(replaceRegex, (...match) => {
                    this.push(match.slice(1, match.length - 2).join(""));
                    return "";
                });

                callback();
            },
            referrer: this
        }));

    }
    throw new Error("Mathcher must be a RegExp!");
};
