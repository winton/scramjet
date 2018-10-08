import {DataStream} from "./";

/**
 * Returns an async generator
 *
 * Ready for https://github.com/tc39/proposal-async-iteration
 *
 * @return {Iterable.<Promise.<*>>} Returns an iterator that returns a promise for each item.
 */
DataStream.prototype.toGenerator =  function toGenerator() {
    this.tap();
    const ref = this;
    return function* () {
        let ended = false;
        ref.on("end", () => ended = true);
        while (!ended) {
            yield ref.whenRead();
        }
        return;
    };
};
