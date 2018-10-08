import { dirname } from "path";

export const getCalleeDirname = function(depth) {
    const p = Error.prepareStackTrace;
    Error.prepareStackTrace = (dummy, stack) => stack;
    const e = new Error();
    Error.captureStackTrace(e, arguments.callee);
    const stack = e.stack;
    Error.prepareStackTrace = p;
    return dirname(stack[depth].getFileName());
};

export const AsyncGeneratorFunction = (() => {
    let AsyncGeneratorFunction = function() {};
    try {
        AsyncGeneratorFunction = require("./util/async-generator-constructor"); // eslint-disable-line
    } catch (e) {} // eslint-disable-line

    return AsyncGeneratorFunction;
})();

export const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

export const pipeIfTarget = (stream, target) => (target ? stream.pipe(target) : stream);
