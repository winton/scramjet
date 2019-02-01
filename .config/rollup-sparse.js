import pkg from '../package.json';
import { resolve } from 'path';
import npmResolve from 'rollup-plugin-node-resolve';
import license from 'rollup-plugin-license';
// import { terser } from "rollup-plugin-terser";
import { eslint } from "rollup-plugin-eslint";

export default [
    {
        input: 'src/index.js',
        external: Object.keys(pkg.dependencies),
        output: [
            { file: '.work/index.js', format: 'cjs' },
        ],
        plugins: [
            eslint({
                "config": "../.eslintrc"
            }),
            npmResolve({
                // use "module" field for ES6 module if possible
                module: true, // Default: true

                // use "main" field or index.js, even if it's not an ES6 module
                // (needs to be converted from CommonJS to ES6
                // – see https://github.com/rollup/rollup-plugin-commonjs
                main: true,  // Default: true

                // some package.json files have a `browser` field which
                // specifies alternative files to load for people bundling
                // for the browser. If that's you, use this option, otherwise
                // pkg.browser will be ignored
                browser: false,  // Default: false

                // whether to prefer built-in modules (e.g. `fs`, `path`) or
                // local ones with the same names
                preferBuiltins: false,  // Default: true

                // Lock the module search in this path (like a chroot). Module defined
                // outside this path will be marked as external
                jail: resolve(__dirname, '../'), // Default: '/'

                // If true, inspect resolved files to check that they are
                // ES2015 modules
                // modulesOnly: true, // Default: false
            }),
            // terser({}),
            license({
                sourcemap: true,
                cwd: '../', // Default is process.cwd()

                banner: {
                    file: resolve(__dirname, '../LICENSE'),
                    encoding: 'utf-8', // Default is utf-8
                }
            })
        ]
    }
];
