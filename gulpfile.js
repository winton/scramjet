/* eslint-disable node/no-unpublished-require */
const gulp = require("gulp");
const path = require("path");
const shell = require("gulp-shell");
const url = require("url");
const fs = require("fs");
const rimraf = require("rimraf");

const {promisify} = require("util");
const {lint, test_legacy, readme, scm_clean} = require("scramjet-core/scripts/tasks");
const {full_docs, tsd} = require("./scripts/tasks");

const corepath = path.dirname(require.resolve("scramjet-core"));
gulp.task("lint", lint());

process.env.SCRAMJET_TEST_HOME = __dirname;
gulp.task("test_legacy", test_legacy([path.resolve(corepath, "../test/v1/*.js"), "test/v1/*.js"]));

gulp.task("scm_clean", scm_clean());

gulp.task("test_samples", shell.task("node test/samples/test-samples"));

gulp.task("readme", readme({
    files: "src/**/*",
    plugin: ["scramjet-core/jsdoc2md/plugin.js", "jsdoc2md/plugin.js",]
}, path.join(__dirname, "README.md")));

gulp.task("tsd", tsd(".work/index.js", {
    plugins: ["jsdoc2md/plugin-tsd.js"],
    opts: {
        "tags": {
            "allowUnknownTags": true,
            "dictionaries": ["jsdoc","closure"]
        },
        template: "@otris/jsdoc-tsd/src-out/src/core",
        destination: ".d.ts/scramjet.d.ts"
    }
}));

gulp.task("copy_docs", () => {
    return gulp
        .src(path.resolve(corepath, "../docs/*"))
        .pipe(gulp.dest("docs/"));
});

gulp.task("copy_runtimes", () => {
    const runtimes = [
        "src/lib/util/async-generator-constructor.js"
    ];

    return gulp
        .src(runtimes, {base: "."})
        .pipe(gulp.dest("dist/lib/"));
});

gulp.task("copy_bundles", () => {
    const bundles = [
        "node_modules/scramjet-core/lib/**/*",
        "node_modules/scramjet-core/package*",
        "node_modules/scramjet-core/README.md",
        "node_modules/scramjet-core/LICENSE"
    ];

    return gulp
        .src(bundles, {base: "."})
        .pipe(gulp.dest("dist/"));
});

gulp.task("copy_assets", () => {
    const assets = [
        ".d.ts/**/*", "docs/**/*", "README.md", "CHANGELOG.md", "LICENSE"
    ];

    return gulp
        .src(assets, {base: "."})
        .pipe(gulp.dest("dist/"));
});

const distDir = path.resolve(__dirname, "dist/");
gulp.task("make_package", async () => {
    const pkg = require("./package.json");

    pkg.devDependencies = [];
    pkg.module = pkg.module.replace(/^dist\//, "");
    pkg.module = pkg.module.replace(/^dist\//, "");

    pkg.dependencies["scramjet-core"] = url.resolve("file://../", pkg.dependencies["scramjet-core"]);
    delete pkg.scripts;

    (pkg.bundledDependencies = pkg.bundledDependencies || []).push("scramjet-core");

    await promisify(fs.writeFile)("dist/package.json", JSON.stringify(pkg, null, 2));
});

gulp.task("dist_install", shell.task("npm i --production", {cwd: distDir}));

gulp.task("clean", async () => promisify(rimraf)(distDir));

gulp.task("make_docs", full_docs(["lib/*.js"], corepath, {plugin: ["scramjet-core/jsdoc2md/plugin-docs.js"]}, "docs/"));

gulp.task("docs", gulp.series("tsd", "readme", "copy_docs", "make_docs"));
gulp.task("test", gulp.series("test_legacy", "test_samples"));
gulp.task("fulltest", gulp.series("lint", "test"));
gulp.task("default", gulp.series("readme", "docs", "test", "lint"));
gulp.task("prerelease", gulp.series("default", "scm_clean"));

