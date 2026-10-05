#!/usr/bin/env node
/*
 * Checks the web game code against the Skylight frame's WebView (Chromium 39, 2014).
 *  - Every script must parse as ES5 (no let/const, arrow functions, template literals, classes...).
 *  - Flags runtime APIs that Chromium 39 lacks (Array.find/includes, Object.assign, fetch...).
 *  - Flags CSS the old engine can't use (variables, grid, gap, clamp, env, unprefixed animation).
 * Usage: node tools/check-es5.js [files...]   (default: app/src/main/assets/www/*.html and *.js)
 * Needs the "acorn" npm package (the cloud session hook installs it; locally: npm i -g acorn).
 */
"use strict";
var fs = require("fs");
var path = require("path");
var acorn;
try { acorn = require("acorn"); } catch (e) {
  console.error("acorn not found. Install it with: npm install -g acorn  (then set NODE_PATH to the global node_modules)");
  process.exit(2);
}

var WWW = path.join(__dirname, "..", "app", "src", "main", "assets", "www");
var files = process.argv.slice(2);
if (!files.length) {
  files = fs.readdirSync(WWW)
    .filter(function (f) { return /\.(html|js)$/.test(f); })
    .map(function (f) { return path.join(WWW, f); });
}

var JS_RULES = [
  [/\.find\s*\(/, "Array.prototype.find (Chrome 45)"],
  [/\.findIndex\s*\(/, "Array.prototype.findIndex (Chrome 45)"],
  [/\.includes\s*\(/, "Array/String includes (Chrome 41/47)"],
  [/\.startsWith\s*\(/, "String.startsWith (Chrome 41)"],
  [/\.endsWith\s*\(/, "String.endsWith (Chrome 41)"],
  [/\.repeat\s*\(/, "String.repeat (Chrome 41)"],
  [/\.padStart\s*\(|\.padEnd\s*\(/, "String.padStart/padEnd (Chrome 57)"],
  [/Object\.assign\s*\(/, "Object.assign (Chrome 45)"],
  [/Object\.(values|entries)\s*\(/, "Object.values/entries (Chrome 54)"],
  [/Array\.from\s*\(|Array\.of\s*\(/, "Array.from/of (Chrome 45)"],
  [/\bfetch\s*\(/, "fetch (Chrome 42); use XMLHttpRequest"],
  [/querySelectorAll\([^)]*\)\s*\.forEach/, "NodeList.forEach (Chrome 51)"],
  [/\.closest\s*\(/, "Element.closest (Chrome 41)"],
  [/\.classList\.toggle\([^,)]*,/, "classList.toggle with a second argument is unreliable on old WebViews"],
  [/\bnew\s+(Map|Set|WeakMap|Symbol)\b/, "Map/Set/Symbol: avoid on Chromium 39"]
];

var CSS_RULES = [
  [/var\(\s*--/, "CSS variables (Chrome 49)"],
  [/display\s*:\s*(-webkit-)?(inline-)?grid\b/, "CSS grid (Chrome 57)"],
  [/(^|[;{\s])(row-|column-)?gap\s*:/, "flex/grid gap (Chrome 84)"],
  [/\bclamp\s*\(/, "clamp() (Chrome 79)"],
  [/\benv\s*\(/, "env() (Chrome 69)"],
  [/\b(min|max)\s*\(/, "CSS min()/max() (Chrome 79)"]
];

function lineOf(text, index) { return text.slice(0, index).split("\n").length; }

var problems = 0;
function report(file, line, msg) {
  problems++;
  console.log(path.relative(process.cwd(), file) + ":" + line + ": " + msg);
}

function stripComments(code) {
  // Keep line numbers: replace comment bodies with spaces/newlines.
  return code.replace(/\/\*[\s\S]*?\*\//g, function (m) { return m.replace(/[^\n]/g, " "); })
             .replace(/(^|[^:\\"'])\/\/[^\n]*/g, function (m, p) { return p + m.slice(p.length).replace(/./g, " "); });
}

function checkJs(file, code, baseLine) {
  try {
    acorn.parse(code, { ecmaVersion: 5, sourceType: "script", locations: true });
  } catch (e) {
    var l = e.loc ? e.loc.line + baseLine - 1 : baseLine;
    report(file, l, "not ES5: " + e.message.replace(/\s*\(\d+:\d+\)$/, ""));
  }
  var lines = stripComments(code).split("\n");
  lines.forEach(function (ln, i) {
    JS_RULES.forEach(function (r) { if (r[0].test(ln)) report(file, baseLine + i, r[1]); });
  });
}

function checkCss(file, css, baseLine) {
  var clean = css.replace(/\/\*[\s\S]*?\*\//g, function (m) { return m.replace(/[^\n]/g, " "); });
  clean.split("\n").forEach(function (ln, i) {
    CSS_RULES.forEach(function (r) { if (r[0].test(ln)) report(file, baseLine + i, r[1]); });
    if (/(^|[^-])@keyframes/.test(ln) && clean.indexOf("@-webkit-keyframes") < 0)
      report(file, baseLine + i, "@keyframes needs an @-webkit-keyframes twin");
    if (/(^|[;{\s])animation(-name)?\s*:/.test(ln) && !/-webkit-animation/.test(ln))
      report(file, baseLine + i, "animation needs a -webkit-animation twin on the same line");
    // Inside an unprefixed @keyframes line, "transform" is the twin of its @-webkit-keyframes copy.
    if (/(^|[;{\s])transform\s*:/.test(ln) && !/-webkit-transform/.test(ln) && !/(^|[^-])@keyframes/.test(ln))
      report(file, baseLine + i, "transform needs a -webkit-transform twin on the same line");
  });
}

files.forEach(function (file) {
  var text = fs.readFileSync(file, "utf8");
  if (/\.js$/.test(file)) { checkJs(file, text, 1); return; }
  var m, re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((m = re.exec(text))) {
    if (/\bsrc\s*=/.test(m[1]) || /type\s*=\s*["']?(?!text\/javascript)[a-z]+\/(?!javascript)/i.test(m[1])) continue;
    checkJs(file, m[2], lineOf(text, m.index + m[0].indexOf(">") + 1));
  }
  re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = re.exec(text))) checkCss(file, m[1], lineOf(text, m.index + m[0].indexOf(">") + 1));
  re = /\sstyle\s*=\s*"([^"]*)"/gi;
  while ((m = re.exec(text))) checkCss(file, m[1], lineOf(text, m.index));
});

if (problems) { console.log(problems + " problem(s) found."); process.exit(1); }
console.log("OK: " + files.length + " file(s) are safe for Chromium 39.");
