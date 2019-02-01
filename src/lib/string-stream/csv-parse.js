import {StringStream} from "./";
import { DataStream } from "../data-stream";

/**
 * Parses CSV to DataString using 'papaparse' module.
 *
 * @chainable
 * @param options options for the papaparse.parse method.
 * @return {DataStream}  stream of parsed items
 * @test test/methods/data-stream-separate.js
 */
StringStream.prototype.CSVParse = function CSVParse(options = {}) {
    const out = new DataStream();
    require("papaparse").parse(this, Object.assign(options, {
        chunk: async ({data, errors}, parser) => {
            if (errors.length) {
                return out.raise(Object.assign(new Error(), errors[0]));
            }

            if (!out.write(data)) {
                parser.pause();
                await out.whenDrained();
                parser.resume();
            }
        },
        complete: () => {
            out.end();
        },
        error: (e) => {
            out.emit("error", e);
        }
    }));

    return out.flatten();
};
