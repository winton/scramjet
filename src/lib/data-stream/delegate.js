import {DataStream} from "./";

/**
 * Delegates work to a specified worker.
 *
 * @meta.noreadme
 * @chainable
 * @param  {DelegateCallback} delegateFunc A function to be run in the subthread.
 * @param  {WorkerStream}     worker
 * @param  {Array}            [plugins=[]]
 */
DataStream.prototype.delegate = function delegate(delegateFunc, worker, plugins = []) {
    const ret = this._selfInstance({referrer: this});
    return worker.delegate(this, delegateFunc, plugins).pipe(ret);
};
