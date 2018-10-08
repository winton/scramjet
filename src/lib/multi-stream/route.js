import {MultiStream} from "./";
import { cpus } from "os";

/**
 * Re-routes streams to a new MultiStream of specified size
 *
 * @meta.noreadme
 * @memberof MultiStream#
 * @todo NYT: not yet tested
 * @todo NYD: not yet documented
 * @param  {Function} [policy=Affinity.RoundRobin] [description]
 * @param  {number} [count=os.cpus().length]       [description]
 * @return {MultiStream}                             [description]
 */
MultiStream.prototype.route = function route(policy, count = cpus().length) {
    const affine = policy(null, count);
    return this.mux().separate(
        async (item) => await affine(item)
    );
};
