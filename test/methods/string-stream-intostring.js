#!/usr/bin/env node
// module: string-stream, method: parse


const {StringStream} = require("../../");   // eslint-disable-line

const defer = async () => new Promise(res => setImmediate(res));
/** @returns {StringStream} */
const getStream = () => StringStream
    .from(function*() {
        for (let i = 0; i < 10; i++) {
            yield defer().then("def abc");
        }
    });

exports.test = async (test) => {
    test.equals(await (getStream().intoString()), "def abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abc");
    test.done();
};

exports.log = console.log.bind(console);
