import {DataStream} from "./";

/**
 * Seprates stream into a hash of streams. Does not create new streams!
 *
 * @chainable
 * @meta.noreadme
 * @param {Object<DataStream>} streams the object hash of streams. Keys must be the outputs of the affinity function
 * @param {AffinityCallback} affinity the callback function that affixes the item to specific streams which must exist in the object for each chunk.
 */
DataStream.prototype.separateInto = function separateInto(streams, affinity) {
    this.consume(
        async (chunk) => {
            const streamId = await affinity(chunk);
            const found = streams[streamId];

            if (found) {
                return found.whenWrote(chunk);
            }

            throw new Error("Output for " + streamId + " not found in " + JSON.stringify(chunk));
        }
    );
    return this;
};
