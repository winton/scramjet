import {MultiStream} from "./";

/**
 * Calls Array.prototype.find on the streams
 *
 * @param  {Arguments} args arguments for
 * @return {DataStream}  found DataStream
 */
MultiStream.prototype.find =  function find(...args) {
    return this.streams.find(...args);
};
