const {NumberStream} = require("./");

/**
 * A stream for moving window calculation with some simple methods.
 *
 * In essence it's a stream of Array's containing a list of items - a window.
 * It's best used when created by the `DataStream..window`` method.
 *
 * @extends DataStream
 */
class WindowStream extends NumberStream {}

module.exports = WindowStream;
