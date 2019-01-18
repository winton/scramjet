import {StringStream} from "./";
import { DataStream } from "../data-stream";


/**
 * @callback ParseCallback
 * @param {String} chunk the transformed chunk
 * @return {Promise}  the promise should be resolved with the parsed object
 */

/**
 * Parses every string to object
 *
 * The method MUST parse EVERY string into a single object, so the string
 * stream here should already be split.
 *
 * @chainable
 * @param  {ParseCallback} parser The transform function
 * @return {DataStream}  The parsed objects stream.
 *
 * @test test/methods/string-stream-parse.js
 */
StringStream.prototype.parse =  function parse(parser, Clazz = DataStream) {
    return this.tap().map(parser, Clazz);
};
