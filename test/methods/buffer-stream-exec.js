#!/usr/bin/env node
// module: string-stream, method: exec

const {platform, EOL: _EOL} = require("os");
const {resolve, relative} = require("path");
const {unlink} = require("fs");
const {promisify} = require("util");

const {BufferStream} = require("../../");
exports.log = console.log.bind(console);
const [executable, EOL] = !`${process.env.SHELL}`.includes("sh") && platform() === "win32"
    ? [relative(".", "./lib/test-exec.cmd"), Buffer.from(_EOL)]
    : [relative(".", "./lib/test-exec.sh"), Buffer.from("\n")];

exports.test = {
    shell: {
        basic(test) {
            test.expect(2);

            BufferStream
                .from([
                    Buffer.from(["a1", EOL]),
                    Buffer.from(["b1", EOL]),
                    Buffer.from(["c2", EOL]),
                    Buffer.from(["c1", EOL])
                ])
                .exec(executable)
                .use(stream => {
                    test.ok(stream instanceof BufferStream, "Returns BufferStream");

                    return stream;
                })
                .toArray()
                .then(arr => test.deepEqual(arr, ["c2", "c1", ""], "Should execute the grep test"))
                .then(() => promisify(unlink)(resolve(__dirname, `${executable}.did`)))
                .catch(err => test.fail(err))
                .then(() => test.done())
            ;
        }
    }
};
