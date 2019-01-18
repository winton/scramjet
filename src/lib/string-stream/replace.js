import {StringStream} from ".";


/**
 * Finds matches in the string stream and streams the match results
 *
 * @chainable
 * @param  {RegExp} matcher A function that will be called for every
 *                             stream chunk.
 *
 * @test test/methods/string-stream-match.js
 */
StringStream.prototype.replace = function replace(needle, replacement, {windowSize = -2} = {}) {
    let replacing = "";
    let fullIndex = 0;

    if (windowSize < 0) {
        windowSize = `${needle}`.length * -windowSize;
    }

    // if regex with global?

    this.pipe(new this.constructor({
        promiseTransform(chunk) {

            const oldLength = replacing.length - windowSize;
            replacing += chunk;
            const match = replacing.match(needle);

            if (match) {
                const prev = replacing.slice(0, oldLength);
                replacing = replacing.slice(oldLength);
                return prev;
            } else {
                const newIndex = match ? match.index : -1;
                const prev = replacing.slice(0, newIndex);
                const advance = newIndex + match[0].length;
                fullIndex += advance;

                let after;
                if (typeof replacement === "function") {
                    after = replacement(...match, fullIndex, this);
                } else {
                    after = replacement;
                }

                replacing = replacing.slice(advance);

                return prev + after;
            }
        },
        promiseFlush() {
            return replacing.replace(needle, replacement);
        }
    }));
};
