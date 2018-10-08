import {StringStream} from "./";
import { DataStream } from "../data-stream";


/**
 * Create StringStream from anything.
 *
 * @see module:scramjet.from
 *
 * @param {String|Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} str argument to be turned into new stream
 * @param {StreamOptions|Writable} options
 * @return {StringStream}          new StringStream.
 */
StringStream.prototype.from =  function from(source, options, ...args) {
    try {
        return DataStream.from.call(this, source, options, ...args);
    } catch(e) {
        if (typeof source === "string") {
            return this.fromString(source);
        }
        throw e;
    }
};
