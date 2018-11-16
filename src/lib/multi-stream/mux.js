import {MultiStream} from "./";
import { DataStream } from "../data-stream";
const OUT = Symbol("output stream");



/**
 * Muxes the streams into a single one
 *
 * @todo For now using comparator will not affect the mergesort.
 * @todo Sorting requires all the streams to be constantly flowing, any
 *       single one drain results in draining the muxed too even if there
 *       were possible data on other streams.
 *
 * @param  {ComparatorFunction} cmp Should return -1 0 or 1 depending on the
 *                                  desired order. If passed the chunks will
 *                                  be added in a sorted order.
 * @return {DataStream}  The resulting DataStream
 *
 * @example {@link ../samples/multi-stream-mux.js}
 */
MultiStream.prototype.mux =  function mux(cmp, Clazz) {

    this[OUT] = Clazz ? new Clazz() : new DataStream();

    if (!cmp) {

        const unpipeStream = (stream) => {
            if (stream) stream.unpipe(this[OUT]);
            this[OUT].setMaxListeners(this.streams.length);
        };

        const pipeStream = (stream) => {
            this[OUT].setMaxListeners(this.streams.length);
            stream.pipe(this[OUT], {end: false});
        };

        this.on("add", pipeStream);
        this.on("remove", unpipeStream);

        this.streams.forEach(pipeStream);

        this.on("empty", () => this[OUT].end());

        return this[OUT];
    }

    return mergesortStream(this, cmp, 0, Clazz);
};

const DefaultBufferLength = 16;

/**
 * Wraps comparator to accept array like
 *
 * @param {Function} comparator comparator function
 * @return {number} order
 */
const wrapComparator = (comparator) => (a, b) => comparator(a[0], b[0]);
/**
 * The default comparator
 * @param {*} a a
 * @param {*} b b
 * @return {number} order
 */
const DefaultComparator = (a, b) => {
    if (a < b) return -1;
    if (b < a) return 1;
    return 0;
};

/**
 *
 * @template Clazz
 * @param {MultiStream} multi the input multi stream
 * @param {Function} passedComparator the comparator
 * @param {number} bufferLength number of objects to buffer
 * @param {function(): PromiseTransformStream>} Clazz the type of stream it should return
 * @return {function(): Clazz} the merged stream
 */
function mergesortStream(multi, passedComparator, bufferLength, Clazz) {
    bufferLength = bufferLength || DefaultBufferLength;

    const comparator = wrapComparator(passedComparator || DefaultComparator);

    const out = new Clazz();
    const readIndex = new Map();
    const endIndex = new WeakMap();

    const rest = [];

    const onceTouchedStream = (stream) => {
        return Promise.race([
            new Promise((res) => stream.on("readable", res)),
            endIndex.get(stream),
        ]);
    };

    const getMoreItemsForEntry = (stream, arr) => {
        while (arr.length < bufferLength) {
            const haveMore = stream.read();

            if (haveMore !== null)
                arr.push(haveMore);
            else
                break;
        }

        if (arr.length || !readIndex.has(stream))
            return Promise.resolve(arr);

        return onceTouchedStream(stream)
            .then(
                () => getMoreItemsForEntry(stream, arr),
                () => Promise.resolve(arr)
            );
    };

    const getMoreItems = () => {
        const ret = [];
        for (const entry of readIndex.entries())
            ret.push(getMoreItemsForEntry(...entry));


        if (!ret.length)
            return Promise.resolve([]);

        return Promise.all(ret);
    };

    // TODO: rewrite as generator?
    const getSorted = (inArys) => {
        const arr = [];
        const arys = inArys.slice();

        let minLength = 0;
        let j = 0;

        if (rest.length)
            arys.push(rest);


        if (!arys.length)
            return [];

        while (true) {  // eslint-disable-line
            let cnt = 0;

            for (const ary of arys)
                cnt += ary.length > j;

            if (cnt === arys.length) {
                for (let i = 0; i < arys.length; i++)
                    arr.push([arys[i][j], i, j, arys[i].length - j - 1]);

                minLength = ++j;
            } else
                break;
        }

        arr.sort(comparator);

        const ret = [];
        while (minLength > 0 && arr.length > 0) {
            const item = arr.shift();
            arys[item[1]].shift(item[2]);
            ret.push(item[0]);
            minLength = item[3];
        }

        return ret;
    };

    const writeSorted = (sorted) => {
        let ret = true;

        for (let i = 0; i < sorted.length; i++)
            ret = out.write(sorted[i]);


        return ret || new Promise((res) => out.once("drain", () => res(sorted.end)));
    };

    let removing = null;
    let pushing = null;
    const pushMoreItems = () => {
        if (pushing)
            return pushing;

        pushing =
            getMoreItems()
                .then(
                    (arys) => getSorted(arys)
                )
                .then(
                    writeSorted
                )
                .catch(
                    (e) => e instanceof Error ? out.emit("error", e) : (pushing = null, Promise.resolve())
                )
                .then(
                    () => {
                        pushing = null;

                        if (readIndex.size)
                            pushMoreItems();
                        else if (rest.length)
                            return writeSorted(rest.sort(passedComparator));

                        return null;
                    }
                );

        return pushing;
    };

    const onEmpty = () => {
        return Promise.resolve(pushing)
            .then(() => out.end());
    };

    multi.each(
        (addedStream) => {
            const endPromise = new Promise(
                (res, rej) => addedStream.on("end", () => {
                    multi.remove(addedStream);
                    rej();
                })
            );

            endPromise.catch(() => 0);

            readIndex.set(addedStream, []);
            endIndex.set(
                addedStream,
                endPromise
            );
        },
        (removedStream) => {
            removing = Promise.all([
                getMoreItemsForEntry(removedStream, readIndex.get(removedStream))
                    .then(
                        (items) => {
                            readIndex.delete(removedStream);
                            rest.push(...items);
                        }
                    ),
                removing,
            ]).then(
                () => readIndex.size ? pushMoreItems() : onEmpty()
            );
        }
    ).then(
        pushMoreItems
    ).catch(
        (e) => out.emit("error", e)
    );

    return out;
}
