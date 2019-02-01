import {DataStream} from "./";
import { EOL } from "os";

/**
 * Returns a StringStream containing JSON per item with optional end line
 *
 * @meta.noreadme
 * @chainable
 * @param  {Boolean|String} [endline=os.EOL] whether to add endlines (boolean or string as delimiter)
 * @return {StringStream}  output stream
 */
DataStream.prototype.JSONStringify = function JSONStringify(eol = EOL) {
    if (!eol)
        eol = "";

    return this.stringify((item) => JSON.stringify(item) + eol);
};
