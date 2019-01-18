import {DataStream} from "./";
import { resolve } from "path";
import { getCalleeDirname } from "../util";


/**
 * Calls the passed method in place with the stream as first argument, returns result.
 *
 * The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
 * streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
 * from the command line.
 *
 * @chainable
 * @param {Function|String} func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module.
 * @param {*} [...args] any additional args top be passed to the module
 * @test test/methods/data-stream-use.js
 */
DataStream.prototype.use = function(func, ...args) {
    switch (typeof func) {
    case "function":
        return func(this, ...args);
    case "string":
        return require(func.startsWith(".") ? resolve(getCalleeDirname(1), func) : func)(this, ...args);
    default:
        throw new Error("Only function or string allowed.");
    }
};
