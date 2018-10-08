import {DataStream} from "./";
import { EOL } from "os";
import { StringStream } from "../string-stream";

/**
 * Stringifies CSV to DataString using 'papaparse' module.
 *
 * @chainable
 * @memberof DataStream#
 * @param options options for the papaparse.unparse module.
 * @return {StringStream}  stream of parsed items
 *
 * @example {@link ../samples/data-stream-csv.js}
 */
DataStream.prototype.CSVStringify = function CSVStringify(options = {}) {
    const Papa = require("papaparse");
    let header = null;
    let start = 1;
    options = Object.assign({
        header: true,
        newline: EOL
    }, options);

    const outOptions = Object.assign({}, options, {
        header: false
    });

    return this
        .timeBatch(16, 64)
        .map((arr) => {
            const out = [];
            if (!header) {
                header = Object.keys(arr[0]);
                if (options.header) out.push(header);
            }
            for (const item of arr)
                out.push(header.map(key => item[key]));

            const x = Papa.unparse(out, outOptions) + options.newline;
            if (start) {
                start = 0;
                return x;
            }
            return x;
        })
        .pipe(new StringStream());
};
