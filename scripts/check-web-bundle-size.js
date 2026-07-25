#!/usr/bin/env node

const { existsSync, readFileSync, statSync } = require("fs");
const { resolve } = require("path");
const { gzipSync } = require("zlib");

const budgets = {
  initialJavaScriptGzip: 900_000,
  initialJavaScriptRaw: 3_500_000,
  stylesheetRaw: 100_000
};
const distDirectory = resolve(process.cwd(), "dist");
const entryHtmlPath = resolve(distDirectory, "projects.html");

if (!existsSync(entryHtmlPath)) {
  fail("Missing dist/projects.html. Run `npm run build` first.");
}

const html = readFileSync(entryHtmlPath, "utf8");
const scriptPaths = getAssetPaths(html, /src="([^"]+\.js)"/g);
const stylesheetPaths = getAssetPaths(html, /href="([^"]+\.css)"/g);
const localFontPreloadPaths = getAssetPaths(
  html,
  /<link(?=[^>]*rel="preload")(?=[^>]*as="font")[^>]*href="([^"]+)"[^>]*>/g
);
const initialJavaScriptRaw = getRawSize(scriptPaths);
const initialJavaScriptGzip = getGzipSize(scriptPaths);
const initialJavaScriptSource = scriptPaths
  .map((scriptPath) => readFileSync(toLocalPath(scriptPath), "utf8"))
  .join("\n");
const stylesheetRaw = getRawSize(stylesheetPaths);
const results = [
  ["Initial JavaScript", initialJavaScriptRaw, budgets.initialJavaScriptRaw],
  [
    "Initial JavaScript (gzip)",
    initialJavaScriptGzip,
    budgets.initialJavaScriptGzip
  ],
  ["Initial CSS", stylesheetRaw, budgets.stylesheetRaw]
];

for (const [label, actual, budget] of results) {
  console.log(`${label}: ${formatBytes(actual)} / ${formatBytes(budget)}`);
}

console.log(`Local font preloads: ${localFontPreloadPaths.length} / 0`);

const forbiddenInitialModules = [
  "@sentry-internal/replay",
  "react-native-reanimated",
  "react-native-worklets"
].filter((moduleName) => initialJavaScriptSource.includes(moduleName));

console.log(
  `Forbidden initial modules: ${
    forbiddenInitialModules.length > 0
      ? forbiddenInitialModules.join(", ")
      : "none"
  }`
);

const exceeded = results.filter(([, actual, budget]) => actual > budget);

if (exceeded.length > 0) {
  fail(
    `Web bundle budget exceeded: ${exceeded
      .map(([label]) => label)
      .join(", ")}.`
  );
}

if (localFontPreloadPaths.length > 0) {
  fail("Web export must not preload native local font assets.");
}

if (forbiddenInitialModules.length > 0) {
  fail(
    `Web export must not include optional initial modules: ${forbiddenInitialModules.join(
      ", "
    )}.`
  );
}

function getAssetPaths(source, pattern) {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[1]))];
}

function getRawSize(paths) {
  return paths.reduce(
    (total, assetPath) => total + statSync(toLocalPath(assetPath)).size,
    0
  );
}

function getGzipSize(paths) {
  return paths.reduce(
    (total, assetPath) =>
      total + gzipSync(readFileSync(toLocalPath(assetPath))).length,
    0
  );
}

function toLocalPath(assetPath) {
  return resolve(distDirectory, assetPath.replace(/^\//, ""));
}

function formatBytes(value) {
  return `${(value / 1024).toFixed(1)} KiB`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
