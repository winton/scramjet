import {DataStream} from "../data-stream";

/**
 * Simple scramjet stream that by default contains numbers or other containing with `valueOf` method. The streams
 * provides simple methods like `sum`, `average`. It derives from DataStream so it's still fully supporting all `map`,
 * `reduce` etc.
 *
 * @extends DataStream
 */
export class NumberStream extends DataStream {

    /**
    * NumberStream options
    *
    * @typedef NumberStreamOptions
    * @prop {Function} [valueOf=Number..valueOf] value of the data item function.
    * @extends DataStreamOptions
    */

    /**
     * Creates an instance of NumberStream.
     * @param {NumberStreamOptions} options
     * @memberof NumberStream
     */
    constructor(options, ...args) {
        super(options, ...args);
    }

    get _valueOf() {
        return this._options.valueOf || ((x) => +x);
    }

}
