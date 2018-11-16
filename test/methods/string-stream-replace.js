#!/usr/bin/env node
// module: string-stream, method: parse

const {StringStream} = require("../../");   // eslint-disable-line

const defer = async () => new Promise(res => setImmediate(res));
/** @returns {StringStream} */
const getStream = () => StringStream
    .from(function* () {
        for (let i = 0; i < 10; i++) {
            console.log('zzz');
            yield defer().then(() => `def 1-${i} abcdef 2-${i} abc`);
        }
        return;
    });
const getString = async () => (await (getStream().toArray())).join("");


exports.test = {
    async string_string(test) {
        test.expect(2);

        const fullString = await (getString().whenRead());
        const expectedString = fullString.replace("cd", "xy");

        const testString = await (getStream().replace("cd", "xy").toArray());

        console.log(testString.join(""));

        test.equals(expectedString, testString.join(""));
    }
};

exports.log = console.log.bind(console);
