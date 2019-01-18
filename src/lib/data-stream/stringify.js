import {DataStream} from "./";
import { StringStream } from "../string-stream";

/**
 * Creates a StringStream
 *
 * @chainable
 * @param  {MapCallback} serializer A method that converts chunks to strings
 * @return {StringStream}  the resulting stream
 *
 * @test test/methods/data-stream-tostringstream.js
 */
DataStream.prototype.stringify =  function stringify(serializer) {
    return this.map(serializer, StringStream);
};

DataStream.prototype.toStringStream = DataStream.prototype.stringify;
