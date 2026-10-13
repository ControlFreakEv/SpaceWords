#!/usr/bin/env node
/*
 * Plays the web games in headless Chromium at the frame's 1280x800 and checks them.
 *   node tools/web-test.js [screenshot-dir]
 * Needs Playwright with Chromium (preinstalled in Claude Code cloud sessions).
 * Note: this is modern Chromium, not the frame's Chromium 39, so also run tools/check-es5.js.
 */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
let playwright;
try { playwright = require("playwright"); }
catch (e) { playwright = require(path.join(require("child_process").execSync("npm root -g").toString().trim(), "playwright")); }

const WWW = path.join(__dirname, "..", "app", "src", "main", "assets", "www");
const SHOTS = process.argv[2] || null;
const TYPES = { ".html":"text/html", ".js":"application/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".ttf":"font/ttf", ".mp3":"audio/mpeg" };
const phrases = JSON.parse(fs.readFileSync(path.join(WWW, "phrases.json"), "utf8"));
let failures = 0;
function fail(msg){ failures++; console.log("FAIL " + msg); }
function ok(msg){ console.log("ok   " + msg); }

const server = http.createServer((req, res) => {
  const p = path.join(WWW, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" }); res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/audio|mp3|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  // Fast-forward the pauses between rounds.
  await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => st(f, d >= 1500 ? 5 : d, ...a); });
  const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + ".png") }); } };

  // Pickers
  for (const p of ["index.html", "words.html", "math.html"]) {
    await page.goto(base + p); await page.waitForTimeout(150);
    const n = await page.locator("[data-go]").count();
    n >= 2 ? ok(p + ": " + n + " buttons") : fail(p + " has " + n + " buttons");
    await shot(p.replace(".html", ""));
  }
  await page.goto(base + "index.html"); await page.click("text=Math games"); await page.waitForURL(/math\.html/);
  await page.click("text=Rocket Math"); await page.waitForURL(/math-game\.html\?g=ops/); ok("index -> math -> Rocket Math navigation");

  for (const g of ["count", "ops", "pattern"]) {
    await page.goto(base + "math-game.html?g=" + g); await page.waitForTimeout(150);
    await shot(g + "-levels");
    const levels = await page.evaluate(() => MathGame.game().levels.length);

    // Generated questions: answers, options and speech keys.
    const report = await page.evaluate(g => {
      const out = { bad: [], keys: {} }, G = MathGame.game(), top = g === "pattern" ? 999 : 100;   // patterns go up to 999
      G.levels.forEach((lv, li) => lv.rounds.forEach((mk, ri) => {
        for (let t = 0; t < 150; t++) {
          const R = mk();
          const where = "L" + (li + 1) + " round " + ri + ": " + R.hint;
          (R.say || []).concat(R.answerSay || []).forEach(k => out.keys[k] = 1);
          if (typeof R.answer === "number" && !(Number.isInteger(R.answer) && R.answer >= 0 && R.answer <= top)) out.bad.push(where + " answer " + R.answer);
          if (R.kind === "pad" && R.prompt.indexOf('id="entry"') < 0) out.bad.push(where + " keypad round without an answer box");
          const checkOpts = (opts, ans, w) => {
            const vals = opts.map(o => o.val);
            if (vals.indexOf(ans) < 0) out.bad.push(w + " answer missing from choices " + vals);
            if (new Set(vals).size !== vals.length) out.bad.push(w + " repeated choices " + vals);
            if (vals.some(v => typeof v === "number" && (v < 0 || v > top))) out.bad.push(w + " choice out of range " + vals);
          };
          if (R.kind === "choice") checkOpts(R.options, R.answer, where);
          if (R.kind === "steps") {   // carrying in 2 parts: ones, then tens (with the carried 1)
            R.steps.forEach((st, k) => { checkOpts(st.options, st.answer, where + " part " + (k + 1)); st.say.concat(st.doneSay || []).forEach(x => out.keys[x] = 1); });
            const t = R.steps[0].answer, u = R.steps[1].answer;
            if (t < 10 || u * 10 + t % 10 !== R.answer) out.bad.push(where + " carry parts " + t + ", " + u + " don't make " + R.answer);
          }
        }
      }));
      out.bad = out.bad.slice(0, 15);
      out.keys = Object.keys(out.keys);
      return out;
    }, g);
    report.bad.length ? report.bad.forEach(b => fail(g + " " + b)) : ok(g + ": 150 generated questions per round type look right");
    const missing = report.keys.filter(k => !(k in phrases));
    missing.length ? fail(g + " speech keys missing from phrases.json: " + missing.join(", ")) : ok(g + ": all " + report.keys.length + " speech keys exist");

    // Play every level start to finish.
    for (let i = 0; i < levels; i++) {
      await page.evaluate(i => MathGame.start(i), i);
      for (let r = 0; r < 10; r++) {
        const R = await page.evaluate(() => { const R = MathGame.state().R; return { kind: R.kind, answer: R.answer, vals: R.options ? R.options.map(o => o.val) : null, steps: R.steps ? R.steps.map(st => [st.answer, st.options.map(o => o.val)]) : null }; });
        if (r === 0) await shot(g + "-L" + (i + 1));
        if (R.kind === "choice") await page.locator(".choice").nth(R.vals.indexOf(R.answer)).click();
        else if (R.kind === "steps") {
          for (let k = 0; k < R.steps.length; k++) {
            await page.waitForFunction(k => MathGame.state().R.step === k && !MathGame.state().R.busy, k, { timeout: 3000 });
            await page.locator(".choice").nth(R.steps[k][1].indexOf(R.steps[k][0])).click();
          }
        }
        else { for (const d of String(R.answer)) await page.locator(".key", { hasText: new RegExp("^" + d + "$") }).click(); await page.locator(".key.go").click(); }
        await page.waitForFunction(r => { const s = MathGame.state(); return s.round > r || document.getElementById("end").className.indexOf("on") >= 0; }, r, { timeout: 3000 });
      }
      const end = await page.evaluate(() => [document.getElementById("end").className.indexOf("on") >= 0, MathGame.state().stars]);
      end[0] && end[1] === 10 ? ok(g + " level " + (i + 1) + ": played 10 rounds, 10 stars") : fail(g + " level " + (i + 1) + " ended " + JSON.stringify(end));
    }
    await shot(g + "-end");
    const saved = await page.evaluate(g => localStorage.getItem("math:" + g + ":best"), g);
    saved && Object.keys(JSON.parse(saved)).length === levels ? ok(g + ": stars saved " + saved) : fail(g + " stars not saved: " + saved);
  }

  // Alien Patterns: every round has a rule, the rule really makes the sequence (rebuilt here from
  // rule.kind and its numbers), the step labels and the Rule line match it, and everything said has a clip.
  await page.goto(base + "math-game.html?g=pattern");
  const ruleCheck = await page.evaluate(() => {
    const bad = [], keys = {}, kinds = {}, MI = "−";
    const signed = d => (d >= 0 ? "+" : MI) + Math.abs(d);
    const numSay = v => v <= 100 ? ["n_" + v] : ["n_" + Math.floor(v / 100), "m_hundred"].concat(v % 100 ? ["n_" + v % 100] : []);
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    // the next number from the rule: i is the index of the number being made
    const next = (r, out, i) => {
      const p = out[i - 1];
      switch (r.kind) {
        case "arith": case "parity": return p + r.d;
        case "times": return r.div ? p / r.m : p * r.m;
        case "affine": return p * r.m + r.c;
        case "grow": return p + r.d0 + (i - 1) * r.c;
        case "fib": return out[i - 2] + p;
        case "square": return (r.k + i) * (r.k + i);
        case "tri": return (r.k + i) * (r.k + i + 1) / 2;
        case "alt": return p + (i % 2 ? r.a : r.b);
        case "two": return out[i - 2] + (i % 2 ? r.db : r.da);
      }
      return NaN;
    };
    // fewest numbers that must be showing for the rule to be the only sensible one
    const MIN_SHOWN = { arith: 3, parity: 3, times: 3, affine: 4, grow: 5, fib: 5, square: 4, tri: 4, alt: 5, two: 6 };
    const apply = (v, label) => { let x = v, m, re = /([+−×÷])(\d+)/g, used = "";
      while ((m = re.exec(label))) { const k = +m[2]; used += m[0]; x = m[1] === "+" ? x + k : m[1] === MI ? x - k : m[1] === "×" ? x * k : x / k; }
      return used === label ? x : NaN; };
    const check = (R, where) => {
      const r = R.rule;
      if (!r || !r.html || !r.say || !r.say.length) { bad.push(where + ": no rule"); return; }
      r.say.forEach(k => keys[k] = 1);
      (R.say || []).concat(R.answerSay || []).forEach(k => keys[k] = 1);
      if (r.kind === "repeat") return;
      const v = R.seq, h = R.hide, w = where + " [" + v + "] " + r.kind;
      kinds[r.kind] = 1;
      if (!v || !(h >= 0 && h < v.length)) { bad.push(w + ": no sequence"); return; }
      if (v.some(x => !Number.isInteger(x) || x < 0 || x > 999)) bad.push(w + ": numbers must be whole, 0 to 999");
      if (R.answer !== v[h]) bad.push(w + ": answer " + R.answer + " is not the blank");
      if (!same(R.answerSay, numSay(R.answer))) bad.push(w + ": answer said as " + R.answerSay);
      if (R.hint.indexOf("next") >= 0 && !same(R.say, [].concat(...v.slice(0, h).map(numSay), ["m_next"]))) bad.push(w + ": says " + R.say);
      if (!(r.kind in MIN_SHOWN)) { bad.push(w + ": unknown rule kind"); return; }
      for (let i = r.kind === "fib" || r.kind === "two" ? 2 : 1; i < v.length; i++)
        if (next(r, v, i) !== v[i]) { bad.push(w + ": number " + (i + 1) + " doesn't follow the rule"); break; }
      if (v.length - 1 < MIN_SHOWN[r.kind]) bad.push(w + ": too few numbers showing");
      if (r.kind === "square" && v[0] !== r.k * r.k || r.kind === "tri" && v[0] !== r.k * (r.k + 1) / 2) bad.push(w + ": wrong start");
      if (r.kind === "fib" && !(v[0] >= 1 && v[1] >= v[0])) bad.push(w + ": should start small, then bigger");
      if (r.kind === "two" && Math.abs(v[0] - v[1]) < 10) bad.push(w + ": the two patterns are too close");
      if (r.kind === "parity" && (Math.abs(r.d) !== 2 || v[0] % 2 !== (r.odd ? 1 : 0))) bad.push(w + ": odd/even mixed up");
      if (r.kind === "grow" && (!r.d0 || !r.c || Math.sign(r.d0 + (v.length - 2) * r.c) !== Math.sign(r.d0))) bad.push(w + ": jumps change direction");
      if (r.kind === "alt" && r.a === r.b) bad.push(w + ": both steps the same");
      // step labels: each one turns a number into the next
      const d = document.createElement("div"); d.innerHTML = R.prompt;
      const shown = [...d.querySelectorAll(".step")].map(e => e.textContent), bubs = [...d.querySelectorAll(".bub")];
      if (bubs.length !== v.length || bubs[h].id !== "entry") bad.push(w + ": blank in the wrong place");
      bubs.forEach((b, i) => { if (i !== h && (b.textContent !== String(v[i]) || b.getAttribute("data-say") !== numSay(v[i]).join(" "))) bad.push(w + ": bubble " + i + " shows/says the wrong number"); });
      if (r.kind === "two") { if (r.steps || shown.length) bad.push(w + ": two patterns have no single step"); }
      else if (!r.steps || r.steps.length !== v.length - 1 || !same(shown, r.steps)) bad.push(w + ": step labels missing");
      else r.steps.forEach((s, i) => { if (apply(v[i], s) !== v[i + 1]) bad.push(w + ": step " + s + " doesn't take " + v[i] + " to " + v[i + 1]); });
      // the Rule line and what's said
      const html = r.html, op = (x, y) => [x >= 0 ? "m_plus" : "m_minus"].concat(numSay(Math.abs(x)));
      const want = {
        arith: () => html === signed(r.d) + " each time" && same(r.say, ["m_rule"].concat(op(r.d))),
        parity: () => html.indexOf(r.odd ? "Odd" : "Even") === 0 && html.indexOf(signed(r.d)) > 0 && same(r.say, [r.odd ? "m_odd_nums" : "m_even_nums", "m_rule"].concat(op(r.d))),
        times: () => html === (r.div ? "÷" : "×") + r.m + " each time" && same(r.say, ["m_rule", r.div ? "m_div" : "m_times", "n_" + r.m]),
        affine: () => html.indexOf("×" + r.m + ", then " + signed(r.c)) === 0 && same(r.say, ["m_rule", "m_times", "n_" + r.m, "m_then"].concat(op(r.c))),
        grow: () => html.indexOf([r.d0, r.d0 + r.c, r.d0 + 2 * r.c].map(signed).join(", ")) === 0 && html.indexOf("is " + Math.abs(r.c) + (r.c * r.d0 > 0 ? " bigger" : " smaller")) > 0 &&
          same(r.say, [r.c * r.d0 < 0 ? "m_rule_shrink" : Math.abs(r.c) === 1 ? "m_rule_grow" : "m_rule_grow2"]) && (r.c * r.d0 > 0 || Math.abs(r.c) === 1),
        fib: () => html.indexOf(v[v.length - 3] + " + " + v[v.length - 2] + " = " + v[v.length - 1]) > 0 && same(r.say, ["m_rule_fib"]),
        square: () => html.indexOf(r.k + "×" + r.k) > 0 && html.indexOf((r.k + 4) + "×" + (r.k + 4)) > 0 && same(r.say, ["m_rule_square"]),
        tri: () => html.indexOf("Triangle") === 0 && same(r.say, ["m_rule_triangle"]),
        alt: () => html.indexOf(signed(r.a) + ", then " + signed(r.b)) === 0 && same(r.say, ["m_rule"].concat(op(r.a), ["m_then"], op(r.b))),
        two: () => { const t = document.createElement("div"); t.innerHTML = html;
          return t.textContent === "Two patterns: " + [v[0], v[2], v[4]].join(", ") + "... and " + [v[1], v[3], v[5]].join(", ") + "..." && same(r.say, ["m_rule_two"]); }
      };
      if (!want[r.kind]()) bad.push(w + ": Rule line or its words are wrong: " + html + " / " + r.say);
      // choices: 4 different numbers, one of them the answer
      if (R.kind === "choice") {
        const vals = R.options.map(o => o.val);
        if (vals.length !== 4 || new Set(vals).size !== 4 || vals.indexOf(R.answer) < 0 || vals.some(x => !Number.isInteger(x) || x < 0 || x > 999)) bad.push(w + ": choices " + vals);
      } else if (R.kind !== "pad") bad.push(w + ": kind " + R.kind);
    };
    const levels = MathGame.game().levels, distinct = [];
    levels.forEach((lv, li) => {
      const seen = new Set();
      lv.rounds.forEach((mk, ri) => { for (let t = 0; t < 400; t++) { const R = mk(); seen.add(R.hint + "|" + R.prompt); check(R, "L" + (li + 1) + " round " + ri); } });
      distinct.push(seen.size);
    });
    MathGame.busters.forEach(type => { for (let t = 0; t < 300; t++) check(MathGame.makers.rBuster(t % 2 === 0, type), "buster " + type); });
    return { bad: bad.slice(0, 8), nbad: bad.length, keys: Object.keys(keys), kinds: Object.keys(kinds).sort(), distinct };
  });
  ruleCheck.bad.length ? fail("pattern rules (" + ruleCheck.nbad + "): " + ruleCheck.bad.join("; ")) : ok("Alien Patterns: every sequence follows its rule; steps, Rule line, words and choices match (" + ruleCheck.kinds.join(", ") + ")");
  const ruleMissing = ruleCheck.keys.filter(k => !(k in phrases));
  ruleMissing.length ? fail("rule clips missing: " + ruleMissing.join(", ")) : ok("every pattern round can be said (" + ruleCheck.keys.length + " clips)");
  // plenty of different questions (4,000 sampled per level)
  const MIN_DISTINCT = [1000, 1000, 1000, 1000, 1500], dd = ruleCheck.distinct;
  dd.every((c, i) => c >= MIN_DISTINCT[i]) ? ok("Alien Patterns: different questions in 4,000 tries per level: " + dd.join(", ")) : fail("Alien Patterns: too few different questions: " + dd.join(", "));
  // the row of numbers stays on one line, clear of the keypad, and the Rule line fits once it's solved
  const fit = await page.evaluate(async () => {
    await document.fonts.ready;
    const bad = [], W = innerWidth, H = innerHeight, levels = MathGame.game().levels;
    const makers = [];
    MathGame.busters.forEach(type => { makers.push([4, () => MathGame.makers.rBuster(false, type), type]); makers.push([4, () => MathGame.makers.rBuster(true, type), type + " keypad"]); });
    levels.forEach((lv, li) => lv.rounds.forEach((mk, ri) => makers.push([li, mk, "L" + (li + 1) + " round " + ri])));
    makers.forEach(([li, mk, name]) => { for (let t = 0; t < 12; t++) {
      const R = mk();
      MathGame.start(li, () => R);
      const seq = document.querySelector("#stage .seq"), box = seq.getBoundingClientRect(), pad = document.querySelector("#stage .pad");
      const tops = new Set([...seq.querySelectorAll(".bub")].map(b => Math.round(b.getBoundingClientRect().top)));
      const where = name + " [" + (R.seq || "pictures") + "]";
      if (tops.size !== 1 && R.seq) bad.push(where + ": numbers on " + tops.size + " lines");
      if (box.left < 0 || box.right > W || (pad && box.right > pad.getBoundingClientRect().left)) bad.push(where + ": row doesn't fit");
      // solve it, then measure the Rule line
      if (R.kind === "choice") document.querySelectorAll("#stage .choice")[R.options.map(o => o.val).indexOf(R.answer)].click();
      else { String(R.answer).split("").forEach(d => [...document.querySelectorAll(".key")].filter(k => k.textContent === d)[0].click()); document.querySelector(".key.go").click(); }
      const rule = document.querySelector("#stage .rule");
      if (!rule) { bad.push(where + ": no Rule line"); continue; }
      const rb = rule.getBoundingClientRect();
      if (rb.left < 0 || rb.right > W || rb.bottom > H || (pad && rb.right > pad.getBoundingClientRect().left) || rb.height > 0.12 * H) bad.push(where + ": Rule line doesn't fit (" + rule.textContent + ")");
    } });
    return { bad: bad.slice(0, 8), n: makers.length * 12 };
  });
  fit.bad.length ? fail("pattern layout: " + fit.bad.join("; ")) : ok("Alien Patterns: " + fit.n + " rounds fit on screen, rows on one line, Rule line clear of the keypad");
  for (const lv of [0, 3, 4]) {
    await page.evaluate(i => MathGame.start(i), lv);
    // the test speeds up long timers, so record the rule line the moment it appears
    await page.evaluate(() => { window.__rule = null; new MutationObserver(() => { const r = document.querySelector(".rule"); if (r && !window.__rule) window.__rule = r.textContent; })
      .observe(document.getElementById("stage"), { childList: true, subtree: true }); });
    const R = await page.evaluate(() => { const R = MathGame.state().R; return { kind: R.kind, answer: R.answer, vals: R.options ? R.options.map(o => o.val) : null }; });
    if (R.kind === "choice") await page.locator(".choice").nth(R.vals.indexOf(R.answer)).click();
    else { for (const d of String(R.answer)) await page.locator(".key", { hasText: new RegExp("^" + d + "$") }).click(); await page.locator(".key.go").click(); }
    await page.waitForTimeout(150);
    const shown = await page.evaluate(() => window.__rule);
    shown ? ok("pattern level " + (lv + 1) + " shows its rule: " + shown) : fail("pattern level " + (lv + 1) + ": no rule shown after a right answer");
    await shot("pattern-rule-L" + (lv + 1));
  }

  // Mistakes: a wrong choice dims, three wrong keypad answers reveal the answer.
  await page.goto(base + "math-game.html?g=count"); await page.evaluate(() => MathGame.start(0));
  const R0 = await page.evaluate(() => { const R = MathGame.state().R; return R.options.map(o => o.val).indexOf(R.answer); });
  await page.locator(".choice").nth(R0 === 0 ? 1 : 0).click(); await page.waitForTimeout(500);
  (await page.locator(".choice.dim").count()) === 1 ? ok("wrong choice is dimmed") : fail("wrong choice not dimmed");
  await page.evaluate(() => MathGame.start(4));
  for (let r = 0; r < 10; r++) {
    const kind = await page.evaluate(() => MathGame.state().R.kind);
    if (kind === "pad") {
      const ans = await page.evaluate(() => MathGame.state().R.answer);
      const wrongDigit = String((ans + 1) % 10);
      // three wrong answers, read straight away (the test's fast timers move on to the next round quickly)
      const shown = await page.evaluate(d => {
        const keys = Array.from(document.querySelectorAll(".pad .key")), go = document.querySelector(".pad .key.go");
        for (let t = 0; t < 3; t++) { keys.filter(b => b.textContent === d)[0].click(); go.click(); }
        return document.getElementById("entry").textContent;
      }, wrongDigit);
      await shot("keypad-reveal");
      shown === String(ans) ? ok("keypad reveals the answer after 3 misses") : fail("keypad reveal shows " + shown + " not " + ans);
      break;
    }
    const v = await page.evaluate(() => { const R = MathGame.state().R; return R.options.map(o => o.val).indexOf(R.answer); });
    await page.locator(".choice").nth(v).click();
    await page.waitForFunction(r => MathGame.state().round > r, r);
  }

  // Word games: start the first level and let a round or two run (speech keys must exist).
  for (const w of ["picture-planet.html", "saucer.html"]) {
    await page.goto(base + w); await page.waitForTimeout(200);
    await page.locator("#path button").first().click(); await page.waitForTimeout(3800);
    const shown = await page.evaluate(() => document.getElementById("game").className.indexOf("on") >= 0);
    shown ? ok(w + ": level 1 starts") : fail(w + ": level 1 did not start");
    await shot(w.replace(".html", "") + "-round");
  }
  const literalKeys = [];
  for (const w of ["picture-planet.html", "saucer.html", "math-game.html", "match.html", "sound-lab.html", "compound.html", "class-words.html", "wordsearch.html"]) {
    const src = fs.readFileSync(path.join(WWW, w), "utf8"), re = /"((?:[pmi])_[a-z_]+)"/g; let m;
    while ((m = re.exec(src))) if (!/_$/.test(m[1])) literalKeys.push(m[1]);
  }
  const missingLit = literalKeys.filter(k => !(k in phrases));
  missingLit.length ? fail("spoken keys in the pages missing from phrases.json: " + missingLit.join(", ")) : ok("all " + literalKeys.length + " spoken keys written in the pages exist");

  // Picture Planet's words = Connect the Pairs' words: same levels, pictures exist, nothing repeats, every word can be said.
  {
    const ppSrc = fs.readFileSync(path.join(WWW, "picture-planet.html"), "utf8"), mSrc = fs.readFileSync(path.join(WWW, "match.html"), "utf8");
    const raw = JSON.parse(ppSrc.match(/^var RAW = (\[.*\]);$/m)[1]);
    const conn = JSON.parse(mSrc.match(/var PICTURES = (\[[\s\S]*?\]);/)[1]).map(l => l.split("|").map(p => p.split(" ")));
    JSON.stringify(raw) === JSON.stringify(conn) ? ok("Picture Planet and Connect the Pairs use the same " + raw.map(l => l.length).join("/") + " words")
      : fail("Picture Planet's RAW and Connect the Pairs' PICTURES differ");
    const all = [].concat.apply([], raw), bad = [], seenW = {}, seenP = {};
    all.forEach(([w, c]) => {
      if (seenW[w]) bad.push("word " + w + " twice"); if (seenP[c]) bad.push("picture " + c + " twice (" + seenP[c] + ", " + w + ")");
      seenW[w] = 1; seenP[c] = w;
      if (!fs.existsSync(path.join(WWW, "emoji", c + ".svg"))) bad.push("no emoji/" + c + ".svg for " + w);
      const k = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!(("w_" + k) in phrases) || !(("ws_" + k) in phrases)) bad.push(w + " lacks w_/ws_ phrases");
    });
    bad.length ? fail("picture words: " + bad.join("; ")) : ok("all " + all.length + " picture words have a picture and clips, none repeats");
  }

  // Match games: board rules, then play every level.
  for (const g of ["connect", "rhyme"]) {
    await page.goto(base + "match.html?g=" + g); await page.waitForTimeout(150);
    await shot("match-" + g + "-levels");
    const rep = await page.evaluate(() => {
      const out = { bad: [], keys: {} }, G = MatchGame.game();
      G.pool.forEach((pool, li) => {
        for (let t = 0; t < 200; t++) {
          const b = MatchGame.makeBoard(li);
          if (b.length !== G.sizes[li]) out.bad.push("L" + (li + 1) + " board has " + b.length + " pairs");
          const tags = b.map(p => p.tag), words = [].concat.apply([], b.map(p => [p.a, p.b]));
          if (new Set(tags).size !== tags.length) out.bad.push("L" + (li + 1) + " repeated sound " + tags);
          if (new Set(words).size !== words.length) out.bad.push("L" + (li + 1) + " repeated word " + words);
          b.forEach(p => { out.keys[Speech.key(p.a)] = 1; if (G.instr === "i_rhyme") out.keys[Speech.key(p.b)] = 1; });
        }
      });
      out.bad = out.bad.slice(0, 10); out.keys = Object.keys(out.keys); return out;
    });
    rep.bad.length ? rep.bad.forEach(b => fail(g + " " + b)) : ok(g + ": 200 boards per level follow the rules");
    const miss = rep.keys.filter(k => !(k in phrases));
    miss.length ? fail(g + " words without clips: " + miss.join(", ")) : ok(g + ": all " + rep.keys.length + " words have clips");

    for (let i = 0; i < 5; i++) {
      await page.evaluate(i => MatchGame.start(i), i);
      for (let bd = 0; bd < 5; bd++) {
        const n = await page.evaluate(() => MatchGame.state().pairs.length);
        for (let k = 0; k < n; k++) {
          await page.evaluate(k => {
            const p = MatchGame.state().pairs[k], cols = document.querySelectorAll(".col");
            const find = c => Array.prototype.filter.call(cols[c].children, e => e.pair === p)[0];
            find(1).click(); find(0).click();   // right side first: either order works
          }, k);
          if (i === 4 && bd === 0 && k === 1) await shot("match-" + g + "-L5-partial");
          if (i === 0 && bd === 0 && k === 0) await shot("match-" + g + "-L1-partial");
        }
        await page.waitForFunction(bd => { const s = MatchGame.state(); return s.board > bd || document.getElementById("end").className.indexOf("on") >= 0; }, bd, { timeout: 4000 });
      }
      const end = await page.evaluate(() => [document.getElementById("end").className.indexOf("on") >= 0, MatchGame.state().stars]);
      end[0] && end[1] === 5 ? ok(g + " level " + (i + 1) + ": 5 boards, 5 stars") : fail(g + " level " + (i + 1) + " ended " + JSON.stringify(end));
    }
    // a wrong pair shakes and counts a mistake
    await page.evaluate(() => MatchGame.start(0));
    const wrongOk = await page.evaluate(() => {
      const st = MatchGame.state(), cols = document.querySelectorAll(".col");
      const l = cols[0].children[0], r = Array.prototype.filter.call(cols[1].children, e => e.pair !== l.pair)[0];
      l.click(); r.click();
      return st.mistakes === 1 && l.className.indexOf("nope") >= 0 && st.matched === 0;
    });
    wrongOk ? ok(g + ": wrong pair shakes and counts a mistake") : fail(g + ": wrong pair not handled");
  }
  // Rhyming Pairs pool: per level each word once, enough sounds for varied boards, clips for every
  // word, and words that end in the same rime spelling (-at, -ight, -unny) share a sound tag, so a
  // board can't hold two pairs that rhyme with each other. The rime runs from the last vowel group
  // (y counts after the first letter; a final silent e reaches back one group); two-syllable words
  // reach back one more group (bunny: unny). Same spelling, different sound, checked by ear:
  const RIME_OK = ["key they", "go two"], wkey = w => "w_" + w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rime = w => {
    const g = [], v = j => /[aeiou]/.test(w[j]) || (w[j] === "y" && j > 0);
    for (let i = 0; i < w.length; ) { if (v(i)) { g.push(i); while (i < w.length && v(i)) i++; } else i++; }
    if (g.length > 1 && /e$/.test(w) && g[g.length - 1] === w.length - 1) g.pop();
    return w.slice(g.length > 1 ? g[g.length - 2] : g[0]);
  };
  const rhymePool = await page.evaluate(() => { const G = MatchGame.game(); return { pool: G.pool, sizes: G.sizes }; });
  const rhymeBad = [];
  rhymePool.pool.forEach((pairs, li) => {
    const L = "L" + (li + 1) + " ", tagOf = {}, byRime = {}, tags = {};
    pairs.forEach(p => {
      tags[p.tag] = 1;
      [p.a, p.b].forEach(w => {
        if (tagOf[w]) rhymeBad.push(L + "repeats " + w);
        tagOf[w] = p.tag;
        if (!(wkey(w) in phrases) || !(("ws_" + wkey(w).slice(2)) in phrases)) rhymeBad.push(L + w + " has no w_/ws_ phrase");
        (byRime[rime(w)] = byRime[rime(w)] || []).push(w);
      });
    });
    const nTags = Object.keys(tags).length;
    if (nTags < 3 * rhymePool.sizes[li]) rhymeBad.push(L + "has " + nTags + " sounds, needs " + 3 * rhymePool.sizes[li]);
    Object.keys(byRime).forEach(r => byRime[r].forEach(a => byRime[r].forEach(b => {
      if (a < b && tagOf[a] !== tagOf[b] && RIME_OK.indexOf(a + " " + b) < 0)
        rhymeBad.push(L + a + " (" + tagOf[a] + ") and " + b + " (" + tagOf[b] + ") both end in -" + r + " but have different sounds");
    })));
  });
  rhymeBad.length ? rhymeBad.slice(0, 20).forEach(b => fail("rhyme pool: " + b))
    : ok("rhyme pool: " + rhymePool.pool.map(p => p.length).join("/") + " pairs; no repeats, enough sounds, phrases, same rime = same sound");
  // Sound Lab: play every level by tapping the marked answer.
  await page.goto(base + "sound-lab.html"); await page.waitForTimeout(150); await shot("sound-levels");
  for (let i = 0; i < 5; i++) {
    await page.evaluate(i => SoundLab.start(i), i);
    for (let r = 0; r < 10; r++) {
      if (r === 0) await shot("sound-L" + (i + 1));
      await page.locator("[data-ok]").first().click();
      if (r === 0) { await page.waitForTimeout(120); await shot("sound-L" + (i + 1) + "-answered"); }
      await page.waitForFunction(r => { const s = SoundLab.state(); return s.round > r || document.getElementById("end").className.indexOf("on") >= 0; }, r, { timeout: 4000 });
    }
    const end = await page.evaluate(() => [document.getElementById("end").className.indexOf("on") >= 0, SoundLab.state().stars]);
    end[0] && end[1] === 10 ? ok("sound lab level " + (i + 1) + ": 10 rounds, 10 stars") : fail("sound lab level " + (i + 1) + " ended " + JSON.stringify(end));
  }
  // Syllable clips must start like the syllable on screen (ba-na-na must not be "buh nan uh").
  const sylBad = await page.evaluate(() => {
    const bad = [], same = { c: "k", ph: "f" };
    SoundLab.data.SYLL.forEach(e => {
      const [spec, said] = e.split("|"), shown = SoundLab.plain(spec.replace(/-/g, "~")).split("~"), parts = said.split(" ");
      if (shown.length !== parts.length) { bad.push(spec + ": " + shown.length + " syllables shown, " + parts.length + " clips"); return; }
      shown.forEach((sh, i) => {
        const onset = s => (s.match(/^(ph|[^aeiou]*)/) || [""])[0], a = onset(sh), b = onset(parts[i]);
        const norm = x => x.replace(/^ph/, "f").replace(/^c/, "k");
        if (norm(a).charAt(0) !== norm(b).charAt(0)) bad.push(sh + " is said as \"" + parts[i] + "\"");
      });
    });
    return bad;
  });
  sylBad.length ? fail("syllable clips don't match the syllables shown: " + sylBad.join("; ")) : ok("every syllable clip starts like the syllable on screen");

  // Sound Lab word lists: no repeats, notation marks exactly what each round expects, every word and syllable has its clips.
  const sld = await page.evaluate(() => {
    const d = SoundLab.data, out = { parsed: {}, team: SoundLab.TEAM_VOWEL, r: SoundLab.R_KEY };
    const specs = [].concat(d.CVC, [].concat.apply([], d.MAGIC), d.TEAMS, d.BOSSY, d.SYLL.map(e => e.split("|")[0]));
    // only parse balanced notation (an unclosed bracket would make parse() loop)
    const balanced = /^([a-z\-]|\[[a-z]+\]|\{[a-z]+\}|<[a-z]+>|\([a-z]+\)|\^[a-z]+\^)+$/;
    specs.forEach(s => { out.parsed[s] = balanced.test(s) ? { parts: SoundLab.parse(s), plain: SoundLab.plain(s) } : { parts: [], plain: "" }; });
    out.data = d; return out;
  });
  const slBad = [], slKeys = new Set(), V = "aeiou";
  const marked = s => sld.parsed[s].parts.filter(p => p.kind !== "c");
  const word = s => { slKeys.add("w_" + sld.parsed[s].plain); slKeys.add("ws_" + sld.parsed[s].plain); };
  const dupes = (name, list) => { const seen = {}; list.forEach(x => { if (seen[x]) slBad.push(name + " repeats " + x); seen[x] = 1; }); };
  const wellFormed = s => {
    const P = sld.parsed[s];
    if (!/^[a-z\[\]{}<>()^\-]+$/.test(s) || !/^[a-z]+$/.test(P.plain) || P.parts.map(p => p.text).join("") !== P.plain) return slBad.push(s + ": notation doesn't parse");
    P.parts.forEach(p => {
      const okPart = p.kind === "c" ? p.text.length === 1 : p.kind === "short" || p.kind === "long" ? p.text.length === 1 && V.indexOf(p.text) >= 0 :
        p.kind === "silent" ? p.text === "e" : p.kind === "team" ? p.text in sld.team : p.text in sld.r;
      if (!okPart) slBad.push(s + ": bad " + p.kind + " part \"" + p.text + "\"");
    });
  };
  // consonant letters in one-vowel words must not be vowels (qu is fine)
  const bareVowel = s => sld.parsed[s].parts.some((p, i, a) => p.kind === "c" && V.indexOf(p.text) >= 0 && !(p.text === "u" && i > 0 && a[i - 1].text === "q"));
  const sd = sld.data;
  dupes("SWAP", sd.SWAP.map(f => f.split(":")[0]));
  sd.SWAP.forEach(f => {
    const m = f.match(/^([a-z]+)_([a-z]+):([aeiou]+)$/);
    if (!m || m[3].split("").sort().join("") !== m[3] || /(.)\1/.test(m[3])) return slBad.push("SWAP " + f + ": bad frame");
    m[3].split("").forEach(v => { slKeys.add("w_" + m[1] + v + m[2]); slKeys.add("ws_" + m[1] + v + m[2]); });
  });
  dupes("CVC", sd.CVC);
  sd.CVC.forEach(s => { wellFormed(s); word(s); const m = marked(s); if (m.length !== 1 || m[0].kind !== "short" || bareVowel(s)) slBad.push("CVC " + s + ": needs exactly one short vowel"); });
  dupes("MAGIC", [].concat.apply([], sd.MAGIC));
  sd.MAGIC.forEach(pr => {
    pr.forEach(s => { wellFormed(s); word(s); });
    const a = marked(pr[0]), b = marked(pr[1]), pb = sld.parsed[pr[1]].parts;
    if (a.length !== 1 || a[0].kind !== "short" || bareVowel(pr[0]) || b.length !== 2 || b[0].kind !== "long" || b[1].kind !== "silent" ||
        pb[pb.length - 1] !== b[1] || a[0].text !== b[0].text || sld.parsed[pr[1]].plain !== sld.parsed[pr[0]].plain + "e") slBad.push("MAGIC " + pr.join("/") + ": not a short / long + silent e pair");
  });
  dupes("TEAMS", sd.TEAMS);
  sd.TEAMS.forEach(s => { wellFormed(s); word(s); const m = marked(s); if (m.length !== 1 || m[0].kind !== "team" || bareVowel(s)) slBad.push("TEAMS " + s + ": needs exactly one vowel team"); });
  dupes("BOSSY", sd.BOSSY);
  sd.BOSSY.forEach(s => {
    wellFormed(s); word(s); const m = marked(s), P = sld.parsed[s].parts;
    const extra = m.filter(p => p.kind !== "r");
    if (m.length - extra.length !== 1 || extra.some(p => p.kind !== "silent" || p !== P[P.length - 1]) || bareVowel(s)) slBad.push("BOSSY " + s + ": needs exactly one bossy R");
  });
  dupes("SYLL", sd.SYLL.map(e => sld.parsed[e.split("|")[0]].plain));
  sd.SYLL.forEach(e => {
    const [spec, said] = e.split("|"), parts = said.split(" "), P = sld.parsed[spec].parts;
    wellFormed(spec); word(spec);
    const n = P.length ? P[P.length - 1].syl + 1 : 0;
    if (n < 1 || n > 4 || parts.length !== n) slBad.push("SYLL " + e + ": " + n + " syllables, " + parts.length + " clips (1 to 4)");
    for (let i = 0; i < n; i++) if (!/[aeiouy]/.test(P.filter(p => p.syl === i).map(p => p.text).join(""))) slBad.push("SYLL " + spec + ": syllable " + (i + 1) + " has no vowel");
    parts.forEach(x => slKeys.add("sy_" + x.toLowerCase().replace(/[^a-z]/g, "")));
  });
  slBad.length ? fail("sound lab lists: " + slBad.slice(0, 12).join("; ")) : ok("sound lab lists: no repeats, notation right (" + ["SWAP", "CVC", "MAGIC", "TEAMS", "BOSSY", "SYLL"].map(k => k + " " + sd[k].length).join(", ") + ")");
  const slMissing = [...slKeys].filter(k => !(k in phrases));
  slMissing.length ? fail("sound lab words/syllables missing from phrases.json: " + slMissing.slice(0, 20).join(", ")) : ok("sound lab: all " + slKeys.size + " word, slow word and syllable keys exist");

  // Speech waits: say(keys, done) calls done once, after the last clip.
  const doneOk = await page.evaluate(() => new Promise(res => { let n = 0; Speech.say(["sy_bah", "sy_nah", "sy_nuh"], () => n++); setTimeout(() => res(n), 3000); }));
  doneOk === 1 ? ok("Speech.say calls its done callback once") : fail("Speech.say done callback ran " + doneOk + " times");

  // Swap round: a wrong vowel says the word it made and costs the gold star.
  for (let t = 0; t < 30; t++) {
    await page.evaluate(() => SoundLab.start(0));
    const isSwap = await page.evaluate(() => /make the word/.test(SoundLab.state().R.hint));
    if (!isSwap) continue;
    const wrongBtn = page.locator(".choice.vowel:not(.dim):not([data-ok])").first();
    if (await wrongBtn.count() === 0) continue;
    await wrongBtn.click();
    const tip = await page.evaluate(() => document.querySelector(".tip").textContent);
    await shot("sound-swap-wrong");
    await page.locator("[data-ok]").first().click();
    const res = await page.evaluate(tip => [SoundLab.state().results[0], tip], tip);
    res[0] === "ok" && /That makes/.test(res[1]) ? ok("swap: wrong vowel explains itself and costs the gold star") : fail("swap wrong vowel: " + JSON.stringify(res));
    break;
  }

  // Compound Words: wrong choices never make real words, match boards pair up only one way, play every level.
  await page.goto(base + "compound.html"); await page.waitForTimeout(150); await shot("compound-levels");
  const cw = await page.evaluate(() => {
    const d = Compound.data, all = d.PIC.concat(d.MID, d.BIG), bad = [];
    for (let t = 0; t < all.length * 3; t++) {
      const c = all[t % all.length], wrong = Compound.wrongSeconds(c.a, c.b, all, 3);
      if (wrong.length !== 3) bad.push("only " + wrong.length + " wrong choices for " + c.w);
      wrong.forEach(b => { if (d.KNOWN[c.a + b]) bad.push(c.a + "+" + b); });
      [d.PIC, d.MID, d.BIG].forEach(pool => {
        const set = Compound.matchSet(pool, 4);
        if (set.length !== 4) bad.push("short match board");
        set.forEach(x => set.forEach(y => { if (x !== y && d.KNOWN[x.a + y.b]) bad.push("ambiguous " + x.a + "+" + y.b); }));
      });
    }
    return bad.slice(0, 10);
  });
  cw.length ? cw.forEach(b => fail("compound: " + b)) : ok("compound: wrong choices never make real words; match boards pair up one way");
  // The word lists: no repeats, a picture file for every picture puzzle, a clip (normal and slow) for every word said.
  const cdata = await page.evaluate(() => {
    const d = Compound.data, list = L => L.map(c => [c.a, c.b, c.w, c.img]);
    return { PIC: list(d.PIC), MID: list(d.MID), BIG: list(d.BIG), NOT: d.NOT, KNOWN: Object.keys(d.KNOWN) };
  });
  const cbad = [], ckeys = new Set();
  for (const name of ["PIC", "MID", "BIG"]) {
    const L = cdata[name], seen = new Set();
    L.forEach(([a, b, w, img]) => {
      if (seen.has(w)) cbad.push(name + " repeats " + w);
      seen.add(w);
      if (!a || !b || !/^[a-z]+$/.test(w)) cbad.push(name + " bad entry " + a + "+" + b);
      if (name === "PIC" && (!img || !fs.existsSync(path.join(WWW, "emoji", img + ".svg")))) cbad.push("no picture for " + w + " (" + img + ")");
      [a, b, w].forEach(x => { ckeys.add("w_" + x); ckeys.add("ws_" + x); });
    });
  }
  if (new Set(cdata.NOT).size !== cdata.NOT.length) cbad.push("NOT has repeats");
  const cknown = new Set(cdata.KNOWN);
  cdata.NOT.forEach(w => { if (cknown.has(w)) cbad.push("NOT word is a compound: " + w); });
  const cmiss = [...ckeys].filter(k => !(k in phrases));
  if (cmiss.length) cbad.push("words without clips: " + cmiss.join(", "));
  cbad.length ? cbad.slice(0, 10).forEach(b => fail("compound: " + b))
    : ok("compound: " + cdata.PIC.length + " picture, " + cdata.MID.length + " middle, " + cdata.BIG.length + " big words, " + cdata.NOT.length +
      " not-compounds: no repeats, every picture there, all " + ckeys.size + " word clips listed");
  // Generated rounds of every level, built off screen: one right answer each, and a wrong one never makes a real word.
  const crounds = await page.evaluate(() => {
    const d = Compound.data, bad = [], said = {};
    let n = 0;
    Compound.levels.forEach((lv, li) => {
      for (let t = 0; t < 600; t++) {
        const R = lv.rounds[t % lv.rounds.length](), st = document.createElement("div");
        R.build(st); n++;
        const tag = "L" + (li + 1) + " ";
        st.querySelectorAll("[data-say]").forEach(e => { said[e.getAttribute("data-say")] = 1; });
        R.say.forEach(k => { said[k] = 1; });
        if (R.pairs) {
          const p = R.pairs;
          if (p.length !== 4) bad.push(tag + "match board has " + p.length + " pairs");
          if (new Set(p.map(x => x.a)).size !== p.length || new Set(p.map(x => x.b)).size !== p.length) bad.push(tag + "match board repeats a half");
          p.forEach(x => p.forEach(y => { if (x !== y && d.KNOWN[x.a + y.b]) bad.push(tag + "match board also makes " + x.a + y.b); }));
          continue;
        }
        const oks = st.querySelectorAll("[data-ok]");
        if (oks.length !== 1) { bad.push(tag + oks.length + " right answers"); continue; }
        if (st.querySelector(".gap")) continue;  // split it: one right cut
        const ch = [].map.call(st.querySelectorAll(".choice"), b => b.textContent), right = oks[0].textContent;
        if (new Set(ch).size !== ch.length || ch.length !== (R.say[0] === "i_cbuild" ? 4 : 3)) bad.push(tag + "choices " + ch.join("/"));
        if (R.say[0] === "i_cpic" && !st.querySelector("img.pic")) bad.push(tag + "picture puzzle without a picture");
        const half = st.querySelector(".eqrow .half");
        if (half) ch.forEach(b => { if (b !== right && d.KNOWN[half.textContent + b]) bad.push(tag + half.textContent + " + " + b + " is a word too"); });
        else ch.forEach(w => { if ((w === right) !== !!d.KNOWN[w]) bad.push(tag + "which: " + w); });
      }
    });
    return { n: n, bad: bad.slice(0, 10), said: Object.keys(said) };
  });
  const csaid = crounds.said.filter(k => !(k in phrases));
  crounds.bad.forEach(b => fail("compound: " + b));
  csaid.length ? fail("compound rounds say keys missing from phrases.json: " + csaid.join(", ")) : null;
  if (!crounds.bad.length && !csaid.length) ok("compound: " + crounds.n + " generated rounds each have one right answer; wrong choices make no real word; " + crounds.said.length + " keys said exist");
  for (let i = 0; i < 5; i++) {
    await page.evaluate(i => Compound.start(i), i);
    for (let r = 0; r < 10; r++) {
      if (r === 0) await shot("compound-L" + (i + 1));
      const R = await page.evaluate(() => { const R = Compound.state().R; return R.pairs ? R.pairs.map(p => p.w) : null; });
      if (R) {
        for (const w of R) { await page.locator('.hb[data-side="L"][data-pair="' + w + '"]').click(); await page.locator('.hb[data-side="R"][data-pair="' + w + '"]').click(); }
      } else await page.locator("[data-ok]").first().click();
      await page.waitForFunction(r => { const s = Compound.state(); return s.round > r || document.getElementById("end").className.indexOf("on") >= 0; }, r, { timeout: 4000 });
    }
    const end = await page.evaluate(() => [document.getElementById("end").className.indexOf("on") >= 0, Compound.state().stars]);
    end[0] && end[1] === 10 ? ok("compound level " + (i + 1) + ": 10 rounds, 10 stars") : fail("compound level " + (i + 1) + " ended " + JSON.stringify(end));
  }

  // Word Search: every puzzle hides each word exactly once (in the level's directions), nothing rude, words match Picture Planet.
  await page.goto(base + "wordsearch.html"); await page.evaluate(() => localStorage.removeItem("search:best")); await page.reload(); await page.waitForTimeout(150);
  await page.evaluate(() => WordSearch.askRate(0));   // "Which way?" questions get their own test below
  await shot("search-levels");
  {
    const ppSrc = fs.readFileSync(path.join(WWW, "picture-planet.html"), "utf8");
    const pp = {}; JSON.parse(ppSrc.match(/^var RAW = (\[.*\]);$/m)[1]).forEach(l => l.forEach(([w, c]) => pp[w] = c));
    const ws = await page.evaluate(() => {
      const W = WordSearch, bad = [], words = {}, sizes = [];
      W.levels.forEach((L, li) => {
        const dirs = L.dirs.map(d => d.join(","));
        L.words.forEach(x => words[x.w] = x.img);
        if (L.words.length < L.count * 3) bad.push("L" + (li + 1) + " has only " + L.words.length + " words");
        L.words.forEach(x => { if (x.w.length > L.n) bad.push(x.w + " is too long for L" + (li + 1));
          if (x.w === x.w.split("").reverse().join("")) bad.push(x.w + " reads the same backwards"); });
        sizes.push(L.words.length);
        for (let t = 0; t < 120; t++) {
          const P = W.make(li); if (!P) { bad.push("L" + (li + 1) + " couldn't make a puzzle"); break; }
          const ls = W.lines(P.grid);
          if (P.grid.length !== L.n || P.grid.some(r => r.length !== L.n || r.some(ch => !/^[a-z]$/.test(ch)))) bad.push("L" + (li + 1) + " grid isn't " + L.n + " x " + L.n + " letters");
          if (P.words.length !== L.count) bad.push("L" + (li + 1) + " has " + P.words.length + " words");
          P.words.forEach(p => {
            if (W.count(ls, p.w) !== 1) bad.push(p.w + " found " + W.count(ls, p.w) + " times in L" + (li + 1));
            if (P.words.some(q => q !== p && q.w === p.w)) bad.push(p.w + " twice in one puzzle");
            const c = p.cells, d = [c[1][0] - c[0][0], c[1][1] - c[0][1]].join(",");
            if (dirs.indexOf(d) < 0) bad.push(p.w + " goes " + d + " in L" + (li + 1));
            if (c.map(x => P.grid[x[0]][x[1]]).join("") !== p.w) bad.push(p.w + " cells don't spell it");
          });
          W.rude.forEach(x => { if (W.count(ls, x)) bad.push("L" + (li + 1) + " grid has " + x); });
        }
      });
      return { bad: bad.slice(0, 10), words, sizes };
    });
    Object.keys(ws.words).forEach(w => {
      if (pp[w] !== ws.words[w]) ws.bad.push(w + " isn't in Picture Planet with the same picture");
      if (!fs.existsSync(path.join(WWW, "emoji", ws.words[w] + ".svg"))) ws.bad.push(w + " picture missing");
      ["w_", "ws_"].forEach(k => { if (!((k + w.replace(/ /g, "_")) in phrases)) ws.bad.push(k + w + " has no clip"); });
    });
    ws.bad.length ? fail("word search: " + ws.bad.join("; ")) : ok("word search: 600 puzzles, every word hidden exactly once in its level's directions, nothing rude; " + ws.sizes.join("/") + " words, all from Picture Planet with clips");
  }
  // Play: a real finger drag, a tap on the first letter then the last, a wrong line, a hint; then every level to the end.
  {
    await page.evaluate(() => WordSearch.start(4)); await page.waitForTimeout(100);
    const centers = await page.evaluate(() => { const G = WordSearch.state(); return G.P.words.map(w => [w.cells[0], w.cells[w.cells.length - 1]].map(c => { const r = G.cells[c[0]][c[1]].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })); });
    let [a, z] = centers[0];
    await page.mouse.move(a[0], a[1]); await page.mouse.down(); await page.mouse.move((a[0] + z[0]) / 2, (a[1] + z[1]) / 2, { steps: 5 }); await page.mouse.move(z[0], z[1], { steps: 5 }); await page.mouse.up();
    [a, z] = centers[1];
    await page.mouse.click(a[0], a[1]);
    const anchored = await page.evaluate(() => document.querySelectorAll(".cell.anchor").length);
    await page.mouse.click(z[0], z[1]);
    const after = await page.evaluate(() => { const G = WordSearch.state(); return [G.found, G.misses, document.querySelectorAll(".wi.done").length, G.P.words[0].found, G.P.words[1].found]; });
    after[0] === 2 && after[1] === 0 && after[2] === 2 && after[3] && after[4] && anchored === 1
      ? ok("word search: dragging along a word and tapping its first then last letter both find it") : fail("word search input: " + JSON.stringify([anchored, after]));
    await shot("search-L5");
    // a line that isn't a word counts a miss; the hint flashes a hidden word's first letter
    const miss = await page.evaluate(() => { const G = WordSearch.state(), n = G.P.n, cells = [];
      for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < 3; c++) row.push([r, c]); if (!G.P.words.some(p => JSON.stringify(p.cells) === JSON.stringify(row) || JSON.stringify(p.cells.slice().reverse()) === JSON.stringify(row))) { cells.push(row); break; } }
      return cells[0].map(c => { const e = G.cells[c[0]][c[1]].getBoundingClientRect(); return [e.x + e.width / 2, e.y + e.height / 2]; }); });
    await page.mouse.move(miss[0][0], miss[0][1]); await page.mouse.down(); await page.mouse.move(miss[2][0], miss[2][1], { steps: 4 }); await page.mouse.up();
    await page.click(".helpb");
    const mh = await page.evaluate(() => { const G = WordSearch.state(); return [G.misses, G.helps, document.querySelectorAll(".cell.flash").length]; });
    mh[0] === 1 && mh[1] === 1 && mh[2] === 1 ? ok("word search: a wrong line is a miss, Hint flashes one first letter") : fail("word search miss/hint: " + JSON.stringify(mh));
  }
  // "Which way does <word> go?": now and then after a find (across/down/backwards words only, at most 2 a puzzle).
  {
    const WAYS = { lr: { "0,1": "right", "0,-1": "left", "1,0": "down", "-1,0": "up" }, map: { "0,1": "east", "0,-1": "west", "1,0": "south", "-1,0": "north" } };
    const bad = [], kinds = {};
    for (const vp of [{ width: 1280, height: 800 }, { width: 800, height: 1280 }]) {
      await page.setViewportSize(vp);
      for (let t = 0; t < 6; t++) {
        await page.evaluate(() => { WordSearch.askRate(1); WordSearch.start(3); }); await page.waitForTimeout(60);
        const straight = await page.evaluate(() => WordSearch.state().P.words.map((p, i) => WordSearch.wayOf(p) ? i : -1).filter(i => i >= 0));
        if (straight.length < 3) continue;
        const asked = [];
        for (const i of straight.slice(0, 3)) {
          await page.evaluate(i => WordSearch.find(i), i); await page.waitForTimeout(40);
          const q = await page.evaluate(() => { const G = WordSearch.state(), q = G.q; if (!q) return null;
            const c = q.p.cells, box = q.box.getBoundingClientRect(), g = G.grid.getBoundingClientRect();
            const over = !(box.right <= g.left || box.left >= g.right || box.bottom <= g.top || box.top >= g.bottom);
            const outside = box.left < 0 || box.top < 0 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1;
            const tw = [].map.call(q.box.querySelectorAll(".tw"), e => e.getAttribute("data-say"));
            return { kind: q.kind, ans: q.ans, d: [c[1][0] - c[0][0], c[1][1] - c[0][1]].join(","), ways: [].map.call(q.box.querySelectorAll(".way"), b => b.getAttribute("data-way")),
              over, outside, tw, say: !!q.box.querySelector(".sayb"), listHidden: G.list.style.display === "none", locked: G.locked, ring: document.querySelectorAll(".cell.askfirst").length }; });
          asked.push(q);
          if (!q) continue;
          kinds[q.kind] = 1;
          const want = WAYS[q.kind][q.d];
          if (q.ans !== want) bad.push(q.d + " should be " + want + ", asked " + q.ans);
          if (q.ways.sort().join() !== Object.values(WAYS[q.kind]).sort().join()) bad.push("buttons " + q.ways);
          if (q.over || q.outside) bad.push("question box " + (q.over ? "covers the grid" : "is off screen") + " at " + vp.width + "x" + vp.height);
          if (!q.say || !q.listHidden || !q.locked || q.ring !== 1) bad.push("question screen " + JSON.stringify(q));
          q.tw.forEach(k => { if (!(k in phrases)) bad.push(k + " has no clip"); });
          ["i_way_" + q.kind, "p_it_goes", "w_" + q.ans, "ws_" + q.ans].forEach(k => { if (!(k in phrases)) bad.push(k + " has no clip"); });
          if (t === 0) await shot("search-way-" + q.kind + (vp.width < vp.height ? "-portrait" : ""));
          const wrong = q.ways.filter(w => w !== q.ans);
          if (asked.length === 1) {   // two wrong taps: try again, then it shows the answer
            await page.click('.way[data-way="' + wrong[0] + '"]');
            const mid = await page.evaluate(() => [!!WordSearch.state().q, document.querySelectorAll(".way.bad").length, document.querySelectorAll(".way.ok").length]);
            if (!mid[0] || mid[1] !== 1 || mid[2] !== 0) bad.push("after one wrong tap " + mid);
            await page.click('.way[data-way="' + wrong[1] + '"]');
            const shown = await page.evaluate(a => !!document.querySelector('.way.ok[data-way="' + a + '"]'), q.ans);
            if (!shown) bad.push("2 wrong taps didn't show " + q.ans);
          } else await page.click('.way[data-way="' + q.ans + '"]');
          await page.waitForFunction(() => !WordSearch.state().q, null, { timeout: 4000 });
          const back = await page.evaluate(() => { const G = WordSearch.state(); return [G.locked, G.list.style.display, !!document.querySelector(".qbox"), document.querySelectorAll(".cell.ask,.cell.askfirst").length, G.misses]; });
          if (back.join() !== "false,,false,0,0") bad.push("after the question " + back);
        }
        if (!asked[0] || !asked[1] || asked[2]) bad.push("questions after 3 finds: " + asked.map(q => !!q));
      }
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => WordSearch.askRate(0));
    if (!kinds.lr || !kinds.map) bad.push("only saw " + Object.keys(kinds));
    bad.length ? fail("word search which way: " + bad.slice(0, 8).join("; "))
      : ok("word search: \"Which way does it go?\" left/right/up/down and north/south/east/west, right answer from the word's cells, 2 tries then shown, at most 2 a puzzle, fits beside/under the grid");
  }
  for (let i = 0; i < 5; i++) {
    await page.evaluate(i => WordSearch.start(i), i);
    for (let pz = 0; pz < 3; pz++) {
      const n = await page.evaluate(() => WordSearch.state().P.words.length);
      for (let k = 0; k < n; k++) await page.evaluate(k => WordSearch.find(k), k);
      await page.waitForFunction(pz => { const G = WordSearch.state(); return (G && G.puzzle > pz) || document.getElementById("end").className.indexOf("on") >= 0; }, pz, { timeout: 12000 });
    }
    const end = await page.evaluate(i => [document.getElementById("end").className.indexOf("on") >= 0, JSON.parse(localStorage.getItem("search:best") || "{}")[i]], i);
    end[0] && end[1] === 3 ? ok("word search level " + (i + 1) + ": 3 puzzles, 3 stars saved") : fail("word search level " + (i + 1) + " ended " + JSON.stringify(end));
  }
  await page.goto(base + "words.html"); await page.waitForTimeout(150);
  const wsGot = await page.evaluate(() => document.querySelector('[data-go="wordsearch.html"] .got').textContent);
  /15/.test(wsGot) ? ok("words.html: Word Search card shows its 15 stars") : fail("Word Search card shows " + JSON.stringify(wsGot));

  // Class Words (her kindergarten list): data, every activity, words taking turns, grown-ups screen.
  await page.goto(base + "class-words.html"); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(150);
  await shot("class-home");
  const cwData = await page.evaluate(() => {
    const C = ClassWords, bad = [];
    if (C.LIST.length !== 69) bad.push("list has " + C.LIST.length + " words");
    C.LIST.forEach(w => {
      const e = C.SENT[w]; if (!e) { bad.push(w + " has no sentence"); return; }
      const [s, d] = e.split("|");
      if (s.split("___").length !== 2) bad.push(w + ": sentence needs one blank");
      d.split(" ").forEach(x => { if (C.LIST.indexOf(x) < 0 || x === w) bad.push(w + ": bad distractor " + x); });
      if (!C.tokens(C.sentenceOf(w)).some(t => t.word === w.toLowerCase())) bad.push(w + ": sentence lacks the word");
    });
    return bad;
  });
  cwData.length ? fail("class words data: " + cwData.join("; ")) : ok("class words: 69 words, each with a sentence and two safe distractors");
  const cwKeys = await page.evaluate(() => ClassWords.LIST.map(w => [Speech.key(w), "cs_" + w.toLowerCase()]).reduce((a, b) => a.concat(b), []));
  const cwMissing = cwKeys.filter(k => !(k in phrases));
  cwMissing.length ? fail("class words clips missing: " + cwMissing.join(", ")) : ok("class words: every word and sentence has a clip");
  // words take turns by themselves; missed words come back more often, known ones less, all keep coming round
  const cycle = await page.evaluate(() => {
    const C = ClassWords, st = C.stats(), saved = JSON.stringify(st);
    const draws = n => { const c = {}; for (let t = 0; t < n; t++) C.wordsFor(8).forEach(w => c[w] = (c[w] || 0) + 1); return c; };
    const one = C.wordsFor(8), distinct = new Set(one).size === 8 && one.every(w => C.LIST.indexOf(w) >= 0);
    const fresh = draws(300), everyWord = C.LIST.every(w => fresh[w] > 0);
    st.like = { ok:0, miss:6, last:-20 }; st.the = { ok:8, miss:0, last:-20 };   // both last had a while ago
    const c = draws(600);
    Object.keys(st).forEach(k => delete st[k]); Object.assign(st, JSON.parse(saved));
    return { distinct, everyWord, like: c.like || 0, the: c.the || 0 };
  });
  cycle.distinct && cycle.everyWord && cycle.like > 2 * cycle.the
    ? ok("class words: 8 different words a mission from all " + 69 + "; a missed word comes up far more than a known one (" + cycle.like + " vs " + cycle.the + ")")
    : fail("class words word cycling: " + JSON.stringify(cycle));

  async function solveRound() {
    const t = await page.evaluate(() => ClassWords.state().R.type);
    if (t === "write" || t === "spell") { await page.evaluate(() => ClassWords.state().R.solve()); return t; }
    if (t === "roll") {
      await page.click(".btn[data-ok]"); await page.waitForSelector(".voice", { timeout: 3000 });
      const n = await page.locator(".voice").count();
      for (let i = 0; i < n; i++) await page.locator(".voice").nth(i).click();
      return t;
    }
    if (t === "hunt") { const n = await page.locator(".hw[data-ok]").count(); for (let i = 0; i < n; i++) await page.locator(".hw[data-ok]").nth(i).click(); return t; }
    await page.locator("[data-ok]").first().click();
    return t;
  }
  async function play(kind, n) {
    await page.evaluate(k => ClassWords.start(k), kind);
    const seen = [];
    for (let r = 0; r < n; r++) {
      if (r === 0) await shot("class-" + kind);
      seen.push(await solveRound());
      await page.waitForFunction(r => { const s = ClassWords.state(); return !s || s.round > r || document.getElementById("end").className.indexOf("on") >= 0; }, r, { timeout: 6000 });
    }
    const end = await page.evaluate(() => [document.getElementById("end").className.indexOf("on") >= 0, ClassWords.state().stars]);
    return { end, seen };
  }
  const mission = await play("mission", 8);
  mission.end[0] && mission.end[1] === 8 ? ok("class words mission: 8 rounds, 8 stars (" + mission.seen.join(", ") + ")") : fail("class words mission ended " + JSON.stringify(mission));
  for (const a of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) {
    const r = await play(a, 6);
    r.end[0] && r.end[1] === 6 ? ok("class words " + a + ": 6 rounds, 6 stars") : fail("class words " + a + " ended " + JSON.stringify(r));
  }
  // Rainbow write: a word with a part left out isn't finished (an "I" without its top or bottom bar)
  const traceCheck = await page.evaluate(() => {
    const out = {}, C = ClassWords, plan = C.plan(), saved = JSON.stringify(plan);
    const run = (word, keep) => {
      plan.week = [word]; plan.done = [];
      for (let t = 0; t < 50; t++) { C.start("write"); if (C.state().R.word === word) break; }   // review words can come first
      return C.state().R.word === word ? C.state().R.tracePart(keep) : "no " + word + " round";
    };
    const frac = (y, b) => (y - b.top) / (b.bottom - b.top);   // 0 = top of the letters, 1 = bottom
    out.stemOnly = run("I", (x, y, b) => frac(y, b) > 0.2 && frac(y, b) < 0.8);
    out.noTop = run("I", (x, y, b) => frac(y, b) > 0.2);
    out.noBottom = run("I", (x, y, b) => frac(y, b) < 0.8);
    out.all = run("I", () => true);
    out.halfWord = run("like", (x, y, b) => x < (b.left + b.right) / 2);
    out.wholeWord = run("like", () => true);
    // a real finger: the whole word a little off-centre, with small gaps
    const shifted = (word, dx, dy, gap) => {
      plan.week = [word]; plan.done = [];
      for (let t = 0; t < 50; t++) { C.start("write"); if (C.state().R.word === word) break; }
      return C.state().R.word === word ? C.state().R.traceShifted(dx, dy, gap) : "no " + word + " round";
    };
    // (the scored points are the middle of each stroke, so shifting them is a finger tracing a bit off-centre)
    out.offCentre = ["for", "like", "the", "yellow", "I", "we"].map(w => [w, shifted(w, 12, -10, 7), shifted(w, -12, 10, 7)]).filter(r => r[1] !== true || r[2] !== true);
    out.forNoO = run("for", (x, y, b) => !(x > b.left + (b.right - b.left) * 0.38 && x < b.left + (b.right - b.left) * 0.68));
    const back = JSON.parse(saved); Object.keys(back).forEach(k => plan[k] = back[k]);
    C.start("find");
    return out;
  });
  traceCheck.stemOnly === false && traceCheck.noTop === false && traceCheck.noBottom === false && traceCheck.all === true && traceCheck.halfWord === false && traceCheck.wholeWord === true && traceCheck.offCentre.length === 0 && traceCheck.forNoO === false
    ? ok("rainbow write: an I missing a bar or half a word isn't done; whole words are, even traced a little off-centre")
    : fail("rainbow write tracing check: " + JSON.stringify(traceCheck));

  // Rainbow write eraser: rubs out ink and its tracing credit, never the guide word; then crayons draw again
  await page.evaluate(() => {
    const C = ClassWords, plan = C.plan();
    window.__savedPlan = JSON.stringify(plan);
    plan.week = ["like"]; plan.done = [];
    for (let t = 0; t < 50; t++) { C.start("write"); if (C.state().R.word === "like") break; }
  });
  await page.waitForTimeout(100);
  const wbox = await page.evaluate(() => { const r = document.querySelectorAll(".writebox canvas")[1].getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  const stroke = async (fy = 0.5) => {
    const y = wbox[1] + wbox[3] * fy;
    await page.mouse.move(wbox[0] + wbox[2] * 0.3, y); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(wbox[0] + wbox[2] * (0.3 + 0.04 * i), y);
    await page.mouse.up();
  };
  const inkState = () => page.evaluate(b => {
    const R = ClassWords.state().R, g = document.querySelectorAll(".writebox canvas")[0];
    const gd = g.getContext("2d").getImageData(0, 0, g.width, g.height).data;
    let guide = 0; for (let i = 3; i < gd.length; i += 4) if (gd[i]) guide++;
    return { credit: R.inkCount(), ink: R.inkAt(b[2] * 0.5, b[3] * 0.5), guide, locked: ClassWords.state().locked };
  }, wbox);
  await stroke(); const drawn = await inkState();
  await page.click(".erase"); await stroke(); const erased = await inkState();
  await page.click(".sw.rain"); await stroke(); const redrawn = await inkState();
  drawn.credit > 0 && drawn.ink > 0 && erased.credit === 0 && erased.ink === 0 && erased.guide === drawn.guide && erased.guide > 0 && redrawn.credit > 0 && redrawn.ink > 0 && !erased.locked
    ? ok("rainbow write eraser: rubs out ink and its credit, keeps the guide word, crayons work again after")
    : fail("rainbow write eraser: " + JSON.stringify({ drawn, erased, redrawn }));

  // Rainbow ink shimmers (the top layer changes colour over time); a solid colour stays put on its own
  // layer until the word is finished, then everything shimmers; Clear stops it.
  const layers = () => page.evaluate(b => {
    const cs = document.querySelectorAll(".writebox canvas"), y = Math.round(b[3] * 0.5), y2 = Math.round(b[3] * 0.3), x = Math.round(b[2] * 0.5);
    const px = (c, yy) => Array.from(c.getContext("2d").getImageData(x, yy, 1, 1).data);
    return { top: px(cs[2], y), solid2: px(cs[1], y2), top2: px(cs[2], y2), shimmering: ClassWords.state().R.shimmering(), locked: ClassWords.state().locked };
  }, wbox);
  const s1 = await layers(); await page.waitForTimeout(300); const s2 = await layers();
  await page.click(".sw:nth-child(2)"); await stroke(0.3); const solid = await layers();
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "class-write-shimmer.png") });
  // (read straight after finishing: the test's fast timers move on to the next round right away)
  const done = await page.evaluate(b => {
    const R = ClassWords.state().R, cs = document.querySelectorAll(".writebox canvas"), x = Math.round(b[2] * 0.5), y2 = Math.round(b[3] * 0.3);
    R.solve();
    return { locked: ClassWords.state().locked, shimmering: R.shimmering(), solid2: Array.from(cs[1].getContext("2d").getImageData(x, y2, 1, 1).data), top2: [0, 0, 0, R.inkAt(x, y2)] };
  }, wbox);
  await page.evaluate(() => { const C = ClassWords, plan = C.plan(); plan.week = ["like"]; plan.done = []; for (let t = 0; t < 50; t++) { C.start("write"); if (C.state().R.word === "like") break; } });
  await page.waitForTimeout(100); await stroke(); const before = await layers();
  await page.click(".colors .btn:not(.erase)"); await page.waitForTimeout(100); const cleared = await layers();
  await page.evaluate(() => { const C = ClassWords, plan = C.plan(), back = JSON.parse(window.__savedPlan); Object.keys(back).forEach(k => plan[k] = back[k]); C.start("find"); });
  s1.shimmering && s1.top[3] > 200 && s1.top.slice(0, 3).join() !== s2.top.slice(0, 3).join()
    && solid.solid2[3] > 200 && solid.top2[3] === 0
    && done.locked && done.shimmering && done.solid2[3] === 0 && done.top2[3] > 200
    && before.shimmering && !cleared.shimmering && cleared.top[3] === 0
    ? ok("rainbow write shimmer: rainbow ink shimmers, solid colours join it when the word is done, Clear stops it")
    : fail("rainbow write shimmer: " + JSON.stringify({ s1, s2, solid, done, before, cleared }));

  // a wrong word in the hunt counts as a mistake
  await page.evaluate(() => ClassWords.start("hunt"));
  const huntWrong = await page.evaluate(() => { const o = document.querySelector(".hw:not([data-ok])"); if (!o) return "none"; o.click(); return ClassWords.state().mistakes; });
  huntWrong === 1 || huntWrong === "none" ? ok("word hunt: tapping a different word is a mistake") : fail("word hunt wrong tap: " + huntWrong);
  const st = await page.evaluate(() => ClassWords.stats());
  Object.keys(st).length ? ok("class words records first tries for " + Object.keys(st).join(", ")) : fail("class words recorded no first tries");
  const lastSet = await page.evaluate(() => { const st = ClassWords.stats(); return Object.keys(st).filter(w => typeof st[w].last === "number").length; });
  lastSet > 0 ? ok("class words remembers when each word was last played (" + lastSet + " words)") : fail("class words: no last-played marks");
  // grown-ups screen: a press and hold opens it; tapping a word changes it
  await page.evaluate(() => { document.getElementById("backBtn").click(); });
  await page.dispatchEvent("#adultBtn", "mousedown"); await page.waitForTimeout(80);
  const adultOpen = await page.evaluate(() => document.getElementById("adult").className.indexOf("on") >= 0);
  adultOpen ? ok("grown-ups screen opens with a press and hold") : fail("grown-ups screen didn't open");
  await shot("class-adult");
  const adult = await page.evaluate(() => [document.querySelectorAll("#adultList .ww").length, document.querySelectorAll("#adultList button").length, document.getElementById("adultMode").textContent]);
  adult[0] === 69 && adult[1] === 0 && /learned/.test(adult[2]) ? ok("grown-ups: shows how she's doing on all 69 words, nothing to pick (" + adult[2] + ")") : fail("grown-ups screen: " + JSON.stringify(adult));
  await page.click("#backBtn"); await page.click("#wallBtn"); await page.waitForTimeout(80); await shot("class-wall");
  await page.click("#backBtn");
  await shot("class-home-after");

  // Tap any word: every tappable piece on screen has a clip.
  const tapKeys = new Set();
  const collect = async () => (await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll("[data-say]"), e => e.getAttribute("data-say")))).forEach(k => k.split(" ").forEach(x => tapKeys.add(x)));
  for (const g of ["count", "ops", "pattern"]) {
    await page.goto(base + "math-game.html?g=" + g);
    for (let i = 0; i < 5; i++) for (let t = 0; t < 8; t++) { await page.evaluate(i => MathGame.start(i), i); await collect(); }
  }
  await page.goto(base + "class-words.html");
  for (const k of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) for (let t = 0; t < 6; t++) { await page.evaluate(k => ClassWords.start(k), k); await collect(); }
  await page.evaluate(() => { document.getElementById("backBtn").click(); document.getElementById("wallBtn").click(); }); await collect();
  for (const w of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "wordsearch.html"]) {
    await page.goto(base + w); await page.waitForTimeout(100); await collect();
    const n = await page.locator("#path button").count();
    for (let i = 0; i < n; i++) for (let t = 0; t < 6; t++) {
      await page.goto(base + w); await page.waitForTimeout(60);
      await page.locator("#path button").nth(i).click(); await page.waitForTimeout(60); await collect();
    }
  }
  const tapMissing = [...tapKeys].filter(k => !(k in phrases));
  tapMissing.length ? fail("tappable words without clips: " + tapMissing.join(", ")) : ok("all " + tapKeys.size + " tappable words seen on screen have clips");

  // Saucer sentences: each word is tappable; Picture Planet's prompt word costs the gold star.
  await page.goto(base + "saucer.html"); await page.locator("#path button").first().click();
  for (let t = 0; t < 12; t++) {
    if (await page.locator(".sentence .tw").count()) break;
    await page.goto(base + "saucer.html"); await page.locator("#path button").first().click(); await page.waitForTimeout(50);
  }
  const sentWords = await page.locator(".sentence .tw").count();
  sentWords > 2 ? ok("saucer sentence has " + sentWords + " tappable words") : fail("saucer sentence words not tappable");
  await shot("saucer-sentence");
  // Saucer fill-in-the-blank data: one blank, 3 distinct distractors from the same planet, a clip of the
  // whole sentence (the word may be capitalized at the start of a sentence), and a clip for every word.
  {
    const LV = JSON.parse(/^var LEVELS = (\[.*\]);$/m.exec(fs.readFileSync(path.join(WWW, "saucer.html"), "utf8"))[1]);
    const bad = []; let n = 0;
    LV.forEach(lv => {
      const ws = lv.words.map(x => x.w);
      lv.words.forEach(x => {
        if (!x.s) return;
        n++;
        const id = lv.planet + " '" + x.w + "': ";
        if (x.s.split("___").length !== 2) bad.push(id + "needs exactly one ___");
        if (!Array.isArray(x.d) || x.d.length !== 3 || new Set(x.d).size !== 3 || x.d.indexOf(x.w) >= 0 || x.d.some(d => ws.indexOf(d) < 0))
          bad.push(id + "distractors " + JSON.stringify(x.d));
        const filled = x.s.replace("___", x.w), cap = x.s.replace("___", x.w.charAt(0).toUpperCase() + x.w.slice(1));
        if (x.sk !== "s_" + x.k.slice(2) || !(x.sk in phrases)) bad.push(id + "no phrase " + x.sk);
        else if (phrases[x.sk] !== filled && phrases[x.sk] !== cap) bad.push(id + "phrase '" + phrases[x.sk] + "' is not '" + filled + "'");
        filled.split(/\s+/).forEach(t => {
          const m = /^[^A-Za-z0-9']*([A-Za-z']+)[^A-Za-z0-9']*$/.exec(t), k = m && "w_" + m[1].toLowerCase().replace(/[^a-z0-9]/g, "");
          if (!m) bad.push(id + "odd token " + t);
          else if (!(k in phrases) || !(("ws_" + k.slice(2)) in phrases)) bad.push(id + "no clip for " + k);
        });
      });
    });
    bad.length ? bad.slice(0, 20).forEach(b => fail("saucer sentence " + b)) : ok("all " + n + " saucer sentences: one blank, 3 distractors, a sentence clip and word clips");
  }

  await page.goto(base + "words.html"); await page.waitForTimeout(150); await shot("words-after");

  // One Back button: same place on every page and screen, one step up each time.
  const boxes = {};
  const box = async label => { boxes[label] = JSON.stringify(await page.evaluate(() => { const r = document.getElementById("backBtn").getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })); };
  await page.goto(base + "index.html"); await page.evaluate(() => { window.AndroidApp = { backToPhotos: () => { window.__photos = true; } }; });
  await box("index"); await page.click("#backBtn");
  (await page.evaluate(() => window.__photos === true)) ? ok("Back on Pick a mission returns to the photos") : fail("Back on Pick a mission did nothing");
  for (const hub of ["words.html", "math.html"]) {
    await page.goto(base + hub); await box(hub); await page.click("#backBtn"); await page.waitForURL(/index\.html/);
    ok("Back on " + hub + " goes to Pick a mission");
  }
  const games = { "picture-planet.html": "words", "saucer.html": "words", "match.html?g=connect": "words", "match.html?g=rhyme": "words",
    "sound-lab.html": "words", "compound.html": "words", "wordsearch.html": "words", "math-game.html?g=count": "math", "math-game.html?g=ops": "math", "math-game.html?g=pattern": "math" };
  for (const g of Object.keys(games)) {
    await page.goto(base + g); await page.waitForTimeout(80); await box(g + " levels");
    await page.locator("#path button").first().click(); await page.waitForTimeout(80); await box(g + " game");
    await page.click("#backBtn");
    const onLevels = await page.evaluate(() => document.getElementById("home").className.indexOf("on") >= 0);
    await page.click("#backBtn"); await page.waitForURL(new RegExp(games[g] + "\\.html"));
    onLevels ? ok(g + ": Back goes game -> levels -> " + games[g] + ".html") : fail(g + ": Back from the game didn't show the levels");
  }
  // Class Words: home, game, wall and grown-ups screens
  await page.goto(base + "class-words.html"); await box("class-words home");
  await page.evaluate(() => ClassWords.start("find")); await box("class-words game");
  await page.click("#backBtn");
  (await page.evaluate(() => document.getElementById("home").className.indexOf("on") >= 0)) ? ok("class-words: Back goes game -> home") : fail("class-words: Back from game failed");
  await page.click("#wallBtn"); await box("class-words wall"); await page.click("#backBtn");
  await page.click("#backBtn"); await page.waitForURL(/words\.html/); ok("class-words: Back goes home -> words.html");
  // end screen
  await page.goto(base + "math-game.html?g=count"); await page.evaluate(() => MathGame.start(0));
  for (let r = 0; r < 10; r++) {
    const v = await page.evaluate(() => { const R = MathGame.state().R; return R.options.map(o => o.val).indexOf(R.answer); });
    await page.locator(".choice").nth(v).click();
    await page.waitForFunction(r => MathGame.state().round > r || document.getElementById("end").className.indexOf("on") >= 0, r);
  }
  await box("math end screen"); await shot("end-with-back");
  await page.click("#backBtn");
  (await page.evaluate(() => document.getElementById("home").className.indexOf("on") >= 0)) ? ok("Back on an end screen goes to the levels") : fail("Back on the end screen failed");
  const distinct = new Set(Object.values(boxes));
  distinct.size === 1 ? ok("Back button is in the identical spot on all " + Object.keys(boxes).length + " screens checked " + [...distinct][0])
    : fail("Back button moves around: " + JSON.stringify(boxes));

  // Volume control: on pickers and level lists, hidden while playing; -, +, bars; 0 means silent.
  for (const pg of ["index.html", "words.html", "math.html", "class-words.html", "picture-planet.html", "saucer.html", "match.html?g=rhyme", "sound-lab.html", "compound.html", "wordsearch.html", "math-game.html?g=ops"]) {
    await page.goto(base + pg); await page.waitForTimeout(80);
    const v = await page.evaluate(() => { const b = document.querySelector(".volbox"); return !!b && b.offsetWidth > 0 && !document.getElementById("soundBtn"); });
    v ? ok(pg + ": volume control shown, no talking toggle") : fail(pg + ": volume control missing or talking toggle still there");
  }
  await page.goto(base + "math-game.html?g=ops");
  await page.evaluate(() => Speech.setLevel(3));
  await page.click('.volb[data-step="1"]');
  const up = await page.evaluate(() => Speech.level());
  await page.click('.volbar[data-level="1"]'); await page.click('.volb[data-step="-1"]');
  const off = await page.evaluate(() => [Speech.level(), Speech.canTalk(), document.querySelectorAll(".volbar.on").length]);
  await page.click('.volbar[data-level="6"]');
  const boost = await page.evaluate(() => [Speech.level(), document.querySelectorAll(".volbar.boost.on").length]);
  up === 4 && off[0] === 0 && !off[1] && off[2] === 0 && boost[0] === 6 && boost[1] === 2
    ? ok("volume: + and - step, bars set the level, 0 is silent, top two bars are the boost") : fail("volume control: " + JSON.stringify([up, off, boost]));
  await page.reload(); const kept = await page.evaluate(() => Speech.level());
  kept === 6 ? ok("volume level is remembered") : fail("volume level not remembered: " + kept);
  await shot("volume-levels");
  await page.locator("#path button").first().click(); await page.waitForTimeout(80);
  (await page.evaluate(() => document.querySelector(".volbox").offsetWidth === 0)) ? ok("volume control hidden while playing") : fail("volume control shows during play");
  await page.evaluate(() => Speech.setLevel(5));

  // Turtle and rabbit: the word slow or fast, through the frame's audio bridge (a stand-in here).
  const ws = Object.keys(phrases).filter(k => /^ws_/.test(k)), noTwin = ws.filter(k => !(("w_" + k.slice(3)) in phrases));
  noTwin.length || !ws.length ? fail("slow clips without a word: " + noTwin.join(", ")) : ok(ws.length + " slow (turtle) word clips, one per word");
  const spd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await spd.addInitScript(() => {
    window.__calls = [];
    window.AndroidAudio = {
      level: () => 5, setLevel: () => {}, stop: () => {},
      play: (k, t) => { window.__calls.push([k, 1]); setTimeout(() => window.__clipDone(t), 5); },
      playRate: (k, t, r) => { window.__calls.push([k, r]); setTimeout(() => window.__clipDone(t), 5); }
    };
  });
  // every phrase counts as recorded here: new words get their clips when update.bat runs make_audio.py,
  // and a word without a clip is skipped (silent), which would make this check depend on the word drawn
  await spd.route("**/audio/index.json", r => r.fulfill({ contentType: "application/json", body: JSON.stringify(Object.keys(phrases)) }));
  await spd.goto(base + "picture-planet.html"); await spd.waitForTimeout(150);
  await spd.evaluate(() => localStorage.removeItem("speech:slow"));
  let found = false;
  for (let t = 0; t < 30 && !found; t++) {
    await spd.goto(base + "picture-planet.html"); await spd.waitForTimeout(150);
    await spd.locator("#path button").first().click(); await spd.waitForTimeout(150);
    found = (await spd.locator(".turtle").count()) === 1 && (await spd.locator(".spdbtn").count()) === 0;
  }
  if (!found) fail("picture planet: no single turtle toggle next to Hear it");
  else {
    await spd.waitForTimeout(1500);
    await spd.evaluate(() => { window.__calls = []; });
    await spd.click(".turtle"); await spd.waitForTimeout(100);                // on: says the word slowly
    await spd.click(".speak"); await spd.waitForTimeout(100);                 // Hear it, while on
    await spd.evaluate(() => Speech.say(["i_listen", "w_cat", "p_praise_0"])); await spd.waitForTimeout(200);
    const on = await spd.evaluate(() => [window.__calls.slice(), document.querySelector(".turtle").className]);
    if (SHOTS) await spd.screenshot({ path: path.join(SHOTS, "turtle-on.png") });
    await spd.evaluate(() => { window.__calls = []; });
    await spd.click(".turtle"); await spd.waitForTimeout(100);                // off: normal again
    const off = await spd.evaluate(() => [window.__calls.slice(), document.querySelector(".turtle").className]);
    const slowWord = c => (/^ws_/.test(c[0]) && c[1] === 1) || (/^w_/.test(c[0]) && c[1] === 0.7);
    const words = on[0].filter(c => /^ws?_/.test(c[0])), others = on[0].filter(c => !/^ws?_/.test(c[0]));
    words.length >= 3 && words.every(slowWord) && others.every(c => c[1] === 1) && /on/.test(on[1])
      ? ok("turtle on: words slow (" + words.map(c => c[0] + "@" + c[1]).join(", ") + "), instructions and praise normal")
      : fail("turtle on: " + JSON.stringify(on));
    off[0].length === 1 && off[0][0][0].indexOf("w_") === 0 && off[0][0][1] === 1 && !/\bon\b/.test(off[1])
      ? ok("turtle off: the word is normal speed again") : fail("turtle off: " + JSON.stringify(off));
    await spd.click(".turtle"); await spd.goto(base + "class-words.html"); await spd.waitForTimeout(150);
    const kept = await spd.evaluate(() => { ClassWords.start("spell"); return [Speech.slowOn(), document.querySelector(".turtle").className]; });
    kept[0] && /on/.test(kept[1]) ? ok("turtle stays on across games") : fail("turtle not remembered: " + JSON.stringify(kept));
    await spd.evaluate(() => Speech.setSlow(false));
  }
  await spd.goto(base + "class-words.html"); await spd.waitForTimeout(150);
  const where = await spd.evaluate(() => {
    const out = {};
    ["spell", "find", "teach"].forEach(k => { ClassWords.start(k); out[k] = document.querySelectorAll(".turtle").length; });
    return out;
  });
  where.spell === 1 && where.find === 1 && where.teach === 0 ? ok("class words: turtle in spell and find, not in Teach Zib") : fail("class words turtle: " + JSON.stringify(where));
  await spd.goto(base + "sound-lab.html"); await spd.waitForTimeout(150);
  const sl = await spd.evaluate(() => { SoundLab.start(0); return document.querySelectorAll(".turtle").length; });
  sl === 1 ? ok("sound lab: turtle for the round's word") : fail("sound lab turtle: " + sl);
  // Class Words on the frame's old browser: document.fonts.ready is a function there. Every activity
  // must still read its instructions out loud on its own (Rainbow write didn't).
  const old39 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await old39.addInitScript(() => {
    try { Object.defineProperty(document, "fonts", { configurable: true, value: { ready: function(){ return Promise.resolve(); } } }); } catch (e) {}
  });
  old39.on("pageerror", e => errors.push("old-browser page: " + e.message));
  await old39.goto(base + "class-words.html"); await old39.waitForTimeout(200);
  await old39.evaluate(() => { const real = Speech.say; window.__said = []; Speech.say = function(k){ window.__said.push(k.slice()); return real.apply(this, arguments); }; });
  const silent = [];
  for (const k of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) {
    const err = await old39.evaluate(k => { window.__said = []; try { ClassWords.start(k); return null; } catch (e) { return e.message; } }, k);
    if (err) { silent.push(k + " threw: " + err); continue; }
    await old39.waitForTimeout(700);
    const said = await old39.evaluate(() => [].concat.apply([], window.__said));
    if (!said.some(x => /^(i_|z_)/.test(x))) silent.push(k + " " + JSON.stringify(said));
  }
  silent.length ? fail("activities that didn't read their instructions (old browser): " + silent.join("; ")) : ok("every Class Words activity reads its instructions by itself, on the frame's old browser too");
  await old39.close();

  // Every round of every game has the speaker button to hear the instructions again.
  const noSay = [];
  for (const w of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "wordsearch.html", "math-game.html?g=count", "math-game.html?g=ops", "math-game.html?g=pattern"]) {
    await spd.goto(base + w); await spd.waitForTimeout(150);
    const n = await spd.locator("#path button").count();
    for (let i = 0; i < n; i++) for (let t = 0; t < 3; t++) {
      await spd.goto(base + w); await spd.waitForTimeout(60);
      await spd.locator("#path button").nth(i).click(); await spd.waitForTimeout(60);
      await spd.locator("#game.on .sayb").first().waitFor({ timeout: 3000 }).catch(() => {});
      if (!(await spd.locator("#game.on .sayb").count())) noSay.push(w + " level " + (i + 1) + ": " + (await spd.locator("#game.on .hint").first().textContent()));
    }
  }
  await spd.goto(base + "class-words.html"); await spd.waitForTimeout(150);
  for (const k of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) {
    await spd.evaluate(k => ClassWords.start(k), k);
    if (!(await spd.locator("#game.on .sayb").count())) noSay.push("class words " + k);
  }
  noSay.length ? fail("rounds without the instructions button: " + [...new Set(noSay)].slice(0, 8).join("; ")) : ok("every round of every game has the instructions button");
  // "read the word, tap the picture": the button repeats the instruction, never the word (that's the answer)
  let picSaid = null;
  for (let t = 0; t < 40 && !picSaid; t++) {
    await spd.goto(base + "picture-planet.html"); await spd.waitForTimeout(80);
    await spd.locator("#path button").first().click(); await spd.waitForTimeout(80);
    if (await spd.locator(".bigword").count()) {
      await spd.waitForTimeout(1200);
      await spd.evaluate(() => { const real = Speech.say; window.__said = null; Speech.say = function(k, d, r){ window.__said = k.slice(); return real.apply(this, arguments); }; });
      await spd.click("#game.on .sayb"); await spd.waitForTimeout(100);
      picSaid = await spd.evaluate(() => window.__said || []);
    }
  }
  picSaid && picSaid.join() === "i_pic" ? ok("picture round: the instructions button says only the instruction") : fail("picture round instructions said: " + JSON.stringify(picSaid));
  if (SHOTS) await spd.screenshot({ path: path.join(SHOTS, "pp-pic-say.png") });

  await spd.close();

  // Volume control: top right, never overlapping text, pictures, buttons or cards (screen by screen).
  const volPages = ["index.html", "words.html", "math.html", "class-words.html", "picture-planet.html", "saucer.html",
    "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "wordsearch.html", "math-game.html?g=count", "math-game.html?g=pattern"];
  for (const pg of volPages) {
    await page.goto(base + pg); await page.waitForTimeout(250);
    const hits = await page.evaluate(() => {
      const box = document.querySelector(".volbox"); if (!box || !box.offsetWidth) return ["no volume control"];
      const v = box.getBoundingClientRect(), pad = 4, out = [];
      const near = r => r.width > 0 && r.height > 0 && r.left < v.right + pad && r.right > v.left - pad && r.top < v.bottom + pad && r.bottom > v.top - pad;
      const seen = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") return false; } return true; };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        if (!n.textContent.trim() || box.contains(n) || !seen(n.parentElement)) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (near(r)) { out.push('text "' + n.textContent.trim().slice(0, 30) + '"'); break; }
      }
      document.querySelectorAll("img, button, .paper, .game, .stone, .act, .week").forEach(e => {
        if (box.contains(e) || !seen(e)) return;
        if (near(e.getBoundingClientRect())) out.push(e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ").join("."));
      });
      return out.slice(0, 6);
    });
    hits.length ? fail(pg + ": volume control overlaps " + hits.join(", ")) : ok(pg + ": volume control clear of everything");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "vol-" + pg.replace(/[^a-z]+/g, "-") + ".png") });
  }

  // Turn timer: start on "Pick a mission", counts down on every page, "Switch turns!" popup when it runs out.
  await page.goto(base + "index.html"); await page.waitForTimeout(150);
  await page.evaluate(() => localStorage.removeItem("speech:turnEnd")); await page.reload(); await page.waitForTimeout(200);
  await page.click("#turnbar .turngo"); await page.waitForTimeout(1100);
  const turnRun = await page.evaluate(() => [Turns.left(), (document.querySelector("#turnbar .turnleft") || {}).textContent, document.querySelector(".turnpill").style.display]);
  turnRun[0] > 290000 && /^[45]:\d\d left$/.test(turnRun[1]) && turnRun[2] === "none"
    ? ok("turn timer: starts at 5 minutes and counts down on Pick a mission (" + turnRun[1] + ")") : fail("turn timer start: " + JSON.stringify(turnRun));
  await page.goto(base + "math-game.html?g=ops"); await page.evaluate(() => MathGame.start(0)); await page.waitForTimeout(1100);
  const pillTxt = await page.evaluate(() => { const p = document.querySelector(".turnpill"); return p.offsetWidth ? p.textContent : "hidden"; });
  /^[45]:\d\d$/.test(pillTxt) ? ok("turn timer: countdown shows in a game (" + pillTxt + ")") : fail("turn timer pill in a game: " + pillTxt);
  // time runs out -> popup on the page that's open; Next turn starts 5 more minutes; All done and the Back key close it
  const popShown = () => page.evaluate(() => document.querySelector(".turnpop").style.display !== "none");
  await page.evaluate(() => localStorage.setItem("speech:turnEnd", JSON.stringify(Date.now() + 300))); await page.waitForTimeout(1500);
  const over1 = [await popShown(), await page.evaluate(() => Turns.left())];
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "turn-over.png") });
  await page.click(".turnpop .turnnext"); await page.waitForTimeout(150);
  const next = [await popShown(), await page.evaluate(() => Turns.left())];
  await page.evaluate(() => localStorage.setItem("speech:turnEnd", JSON.stringify(-1))); await page.waitForTimeout(1100);
  await page.click(".turnpop .turndone"); await page.waitForTimeout(150);
  const allDone = [await popShown(), await page.evaluate(() => Turns.left())];
  await page.evaluate(() => localStorage.setItem("speech:turnEnd", JSON.stringify(-1))); await page.waitForTimeout(1100);
  const backKey = await page.evaluate(() => Turns.back());
  const afterBack = [await popShown(), await page.evaluate(() => Turns.left()), await page.evaluate(() => document.getElementById("game").className.indexOf("on") >= 0)];
  over1[0] && over1[1] === -1 && !next[0] && next[1] > 290000 && !allDone[0] && allDone[1] === 0 && backKey && !afterBack[0] && afterBack[1] === 0 && afterBack[2]
    ? ok("turn timer: Switch turns popup when time is up; Next turn, All done and the Back key work")
    : fail("turn timer popup: " + JSON.stringify({ over1, next, allDone, backKey, afterBack }));
  // the countdown pill (bottom left) stays clear of text, pictures and buttons on level lists and in play
  await page.evaluate(() => localStorage.setItem("speech:turnEnd", JSON.stringify(Date.now() + 240000)));
  const pillHits = () => page.evaluate(() => {
    const pill = document.querySelector(".turnpill"); if (!pill || !pill.offsetWidth) return ["no countdown"];
    const v = pill.getBoundingClientRect(), pad = 4, out = [];
    const near = r => r.width > 0 && r.height > 0 && r.left < v.right + pad && r.right > v.left - pad && r.top < v.bottom + pad && r.bottom > v.top - pad;
    const seen = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false; } return true; };
    const skip = e => pill.contains(e) || e.closest(".turnpop");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      if (!n.textContent.trim() || skip(n.parentElement) || !seen(n.parentElement)) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (near(r)) { out.push('text "' + n.textContent.trim().slice(0, 30) + '"'); break; }
    }
    document.querySelectorAll("img, button, canvas, .paper, .game, .stone, .act, .week, .choice, .tile").forEach(e => {
      if (skip(e) || !seen(e)) return;
      if (near(e.getBoundingClientRect())) out.push(e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ").join("."));
    });
    return out.slice(0, 6);
  });
  const pillBad = [];
  const pillCheck = async label => { const h = await pillHits(); if (h.length) pillBad.push(label + ": " + h.join(", ")); };
  for (const pg of ["words.html", "math.html"]) { await page.goto(base + pg); await page.waitForTimeout(150); await pillCheck(pg); }
  for (const g of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "wordsearch.html",
                   "math-game.html?g=count", "math-game.html?g=ops", "math-game.html?g=pattern"]) {
    await page.goto(base + g); await page.waitForTimeout(150); await pillCheck(g + " levels");
    const n = await page.locator("#path button").count();
    for (const i of [0, Math.floor(n / 2), n - 1]) {
      await page.goto(base + g); await page.waitForTimeout(100);
      await page.locator("#path button").nth(i).click(); await page.waitForTimeout(250);
      await pillCheck(g + " level " + (i + 1));
    }
  }
  await page.goto(base + "class-words.html"); await page.waitForTimeout(150); await pillCheck("class-words home");
  for (const k of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) {
    await page.evaluate(k => ClassWords.start(k), k); await page.waitForTimeout(200); await pillCheck("class-words " + k);
  }
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "turn-pill.png") });
  await page.evaluate(() => localStorage.removeItem("speech:turnEnd"));
  pillBad.length ? fail("turn timer countdown overlaps: " + pillBad.slice(0, 8).join(" | ")) : ok("turn timer countdown clear of everything on level lists and in every game");

  // Turn length: - and + pick the minutes (remembered); the turn starts with that many
  await page.goto(base + "index.html"); await page.waitForTimeout(150);
  await page.evaluate(() => { localStorage.removeItem("speech:turnEnd"); localStorage.removeItem("speech:turnMin"); }); await page.reload(); await page.waitForTimeout(200);
  await page.click('#turnbar .turnstep[data-dir="1"]'); await page.click('#turnbar .turnstep[data-dir="1"]');
  const picked = await page.evaluate(() => [document.querySelector("#turnbar .turnmin").textContent, document.querySelector("#turnbar .turngo").textContent]);
  for (let i = 0; i < 20; i++) await page.click('#turnbar .turnstep[data-dir="-1"]');
  const lowest = await page.evaluate(() => document.querySelector("#turnbar .turnmin").textContent);
  await page.reload(); await page.waitForTimeout(200);
  const keptMin = await page.evaluate(() => document.querySelector("#turnbar .turnmin").textContent);
  await page.click("#turnbar .turngo"); await page.waitForTimeout(300);
  const oneMin = await page.evaluate(() => Turns.left());
  await page.evaluate(() => { Turns.stop(); localStorage.removeItem("speech:turnMin"); });
  picked[0] === "7 min" && /7-minute/.test(picked[1]) && lowest === "1 min" && keptMin === "1 min" && oneMin > 50000 && oneMin <= 60000
    ? ok("turn timer: - and + pick the minutes (5 -> 7, down to 1), remembered, and the turn uses them")
    : fail("turn timer minutes: " + JSON.stringify({ picked, lowest, keptMin, oneMin }));

  // Rhyming Pairs: tapping the partner says that word and then the praise (not the first word again)
  await page.goto(base + "match.html?g=rhyme"); await page.evaluate(() => MatchGame.start(0)); await page.waitForTimeout(150);
  const rhymeSaid = await page.evaluate(() => {
    const calls = [], real = Speech.say; Speech.say = function(k, d, s){ calls.push(k.join(" ")); return real(k, d, s); };
    const p = MatchGame.state().pairs[0], items = Array.from(document.querySelectorAll(".item"));
    const L = items.filter(b => b.textContent === p.a)[0], R = items.filter(b => b.textContent === p.b)[0];
    L.click(); R.click();
    Speech.say = real;
    return { a: Speech.key(p.a), b: Speech.key(p.b), calls };
  });
  const lastSaid = rhymeSaid.calls[rhymeSaid.calls.length - 1] || "";
  rhymeSaid.calls.length === 2 && rhymeSaid.calls[0] === rhymeSaid.a && new RegExp("^" + rhymeSaid.b + " p_rhyme_\\d$").test(lastSaid)
    ? ok("rhyming pairs: the second tap says its own word, then \"they rhyme\" (" + rhymeSaid.calls.join(" | ") + ")")
    : fail("rhyming pairs speech: " + JSON.stringify(rhymeSaid));

  // Spell it (Class Words): the word stays up until the voice has finished saying it (real timers here)
  {
    const sp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await sp.goto(base + "class-words.html"); await sp.waitForTimeout(200);
    await sp.evaluate(() => {
      const real = Speech.say; window.__held = null;
      Speech.say = function(k, d, s){ if (k[0] === "i_look"){ window.__held = d; return; } return real(k, d, s); };   // a long instruction that hasn't finished
      const plan = ClassWords.plan(); window.__savedPlan2 = JSON.stringify(plan);
      plan.week = ["like"]; plan.done = [];   // one-letter words are traced instead of spelled
      for (let t = 0; t < 40; t++) { ClassWords.start("spell"); if (ClassWords.state().R.type === "spell") break; }
    });
    await sp.waitForTimeout(4500);   // longer than the old fixed 3.2 s
    const hidden = () => sp.evaluate(() => document.querySelector("#stage .flash").className.indexOf("hidden") >= 0);
    const whileTalking = await hidden();
    await sp.evaluate(() => window.__held && window.__held()); await sp.waitForTimeout(400);
    const justAfter = await hidden();
    await sp.waitForTimeout(1300);
    const later = await hidden();
    await sp.evaluate(() => { const plan = ClassWords.plan(), back = JSON.parse(window.__savedPlan2); Object.keys(back).forEach(k => plan[k] = back[k]); ClassWords.start("find"); });
    await sp.close();
    !whileTalking && !justAfter && later
      ? ok("spell it: the word stays up while it's being said and hides after the voice finishes")
      : fail("spell it cover timing: " + JSON.stringify({ whileTalking, justAfter, later }));
  }

  // Rocket Math: sums with 2-digit numbers are stacked so ones sit under ones and tens under tens
  {
    const colBad = [];
    let stacked = 0, inline = 0;
    for (const lv of [2, 3]) {
      await page.goto(base + "math-game.html?g=ops"); await page.waitForTimeout(60);
      const count = await page.evaluate(lv => MathGame.game().levels[lv].rounds.length, lv);
      for (let idx = 0; idx < count; idx++) for (let rep = 0; rep < 3; rep++) {
        await page.goto(base + "math-game.html?g=ops"); await page.waitForTimeout(60);
        const r = await page.evaluate(([lv, idx]) => {
          const L = MathGame.game().levels[lv], m = L.rounds[idx]; L.rounds = L.rounds.map(() => m); MathGame.start(lv);
          const box = document.querySelector(".colsum"), R = MathGame.state().R;
          const colsOf = () => {
            const rows = Array.from(box.querySelectorAll(".cnum, #entry")).map(e => Array.from(e.querySelectorAll(".dg")).map(d => { const b = d.getBoundingClientRect(); return Math.round(b.left + b.width / 2); }));
            const w = Math.max.apply(null, rows.map(x => x.length));
            return rows.every(x => x.length === w) && rows.every(x => x.every((c, i) => Math.abs(c - rows[0][i]) <= 1));
          };
          if (!box) return { stacked: false, hint: R.hint };
          const before = colsOf();
          if (R.kind === "pad") {   // type the answer on the keypad: still lined up
            const keys = Array.from(document.querySelectorAll(".pad .key"));
            String(R.answer).split("").forEach(ch => keys.filter(b => b.textContent === ch)[0].click());
          }
          const typed = R.kind === "pad" ? document.getElementById("entry").textContent : "";
          return { stacked: true, hint: R.hint, before, after: colsOf(), typedOk: R.kind !== "pad" || typed === String(R.answer) };
        }, [lv, idx]);
        if (!r.stacked) { inline++; if (/\d\d/.test(r.hint) && !/missing/i.test(r.hint)) colBad.push(r.hint + " not stacked"); continue; }
        stacked++;
        if (!r.before || !r.after || !r.typedOk) colBad.push(r.hint + " " + JSON.stringify(r));
      }
    }
    if (SHOTS) { await page.screenshot({ path: path.join(SHOTS, "ops-stacked.png") }); }
    stacked > 20 && !colBad.length ? ok("rocket math: " + stacked + " two-digit sums stacked with ones under ones and tens under tens (typed answers too); " + inline + " small facts in a line")
      : fail("rocket math stacked sums: " + stacked + " stacked, problems: " + colBad.slice(0, 5).join(" | "));
  }

  // Carrying in 2 parts (24 + 67): add the ones, write the ones digit and carry the 1, then add the tens
  {
    await page.goto(base + "math-game.html?g=ops"); await page.waitForTimeout(60);
    await page.evaluate(() => { const L = MathGame.game().levels[3], m = L.rounds[0]; L.rounds = L.rounds.map(() => m);
      for (let t = 0; t < 200; t++) { MathGame.start(3); if (MathGame.state().R.kind === "steps") break; } });
    await page.waitForTimeout(150);
    const look = () => page.evaluate(() => {
      const R = MathGame.state().R, band = document.querySelector(".cband"), e = document.getElementById("entry");
      const cell = (sel, p) => { const c = document.querySelector(sel + " .dg.p" + p); return c ? c.textContent : null; };
      const inBand = p => { const c = document.querySelector("#entry .dg.p" + p); if (!band || !c) return false; const b = band.getBoundingClientRect(), r = c.getBoundingClientRect(); return band.style.display === "block" && r.left >= b.left && r.right <= b.right; };
      return { kind: R.kind, step: R.step, answer: R.answer, hint: document.querySelector(".hint").textContent, entry: e.textContent,
        ones: cell("#entry", 0), tens: cell("#entry", 1), carry: cell(".ccarry", 1), bandOnes: inBand(0), bandTens: inBand(1), stars: MathGame.state().stars, locked: MathGame.state().locked };
    });
    const pick = val => page.evaluate(val => Array.from(document.querySelectorAll(".choice")).filter(b => b.textContent === String(val))[0].click(), val);
    const part = k => page.evaluate(k => MathGame.state().R.steps[k].answer, k);
    const p1 = await look();
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "carry-1-ones.png") });
    const onesAns = await part(0), wrongVal = await page.evaluate(() => { const st = MathGame.state().R.steps[0]; return st.options.map(o => o.val).filter(v => v !== st.answer)[0]; });
    await pick(wrongVal); await page.waitForTimeout(600);
    const dimmed = await page.locator(".choice.dim").count();
    await pick(onesAns);
    await page.waitForFunction(() => MathGame.state().R.step === 1 && !MathGame.state().R.busy, null, { timeout: 4000 });
    await page.waitForTimeout(100);
    const p2 = await look();
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "carry-2-tens.png") });
    // (read straight after the last pick: the test's fast timers move on to the next round right away)
    const p3 = await page.evaluate(val => {
      Array.from(document.querySelectorAll(".choice")).filter(b => b.textContent === String(val))[0].click();
      return { locked: MathGame.state().locked, entry: document.getElementById("entry").textContent, stars: MathGame.state().stars };
    }, await part(1));
    const a = String(p1.answer);
    p1.kind === "steps" && /^Add the ones/.test(p1.hint) && p1.ones === "?" && p1.bandOnes && !p1.carry
      && dimmed === 1
      && /^Add the tens: 1 \+/.test(p2.hint) && p2.carry === "1" && p2.ones === a.slice(-1) && p2.tens === "?" && p2.bandTens
      && p3.locked && p3.entry === a
      ? ok("carrying: ones first (" + p1.hint + "), then the carried 1 shows over the tens (" + p2.hint + "), answer " + a)
      : fail("carrying in 2 parts: " + JSON.stringify({ p1, dimmed, p2, p3 }));
  }

  // Class Words home: however many words a grown-up puts in "this week", nothing spills over
  {
    await page.goto(base + "class-words.html"); await page.waitForTimeout(200);
    const savedPlan = await page.evaluate(() => localStorage.getItem("classwords:stats"));
    const crowd = [];
    for (const n of [2, 12, 30, 69]) {
      await page.evaluate(n => { const st = {}; ClassWords.LIST.slice(0, n).forEach(w => st[w] = { ok:0, miss:3, last:0 }); localStorage.setItem("classwords:stats", JSON.stringify(st)); }, n);   // n tricky words
      await page.reload(); await page.waitForTimeout(1000);
      const r = await page.evaluate(() => {
        const wc = document.getElementById("weekChips"), rect = e => e.getBoundingClientRect();
        const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const boxes = [document.querySelector("#home .head"), document.querySelector("#home .week"), document.getElementById("acts"), document.getElementById("wallBtn"), document.getElementById("adultBtn")].map(rect);
        const clash = [];
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i], boxes[j])) clash.push(i + "/" + j);
        const shown = Array.from(wc.querySelectorAll(".chip:not(.more)")).filter(c => c.style.display !== "none").length;
        const more = wc.querySelector(".more");
        return { fits: wc.scrollHeight <= wc.clientHeight + 1, clash, shown, more: more ? more.textContent : "", font: parseFloat(getComputedStyle(wc).fontSize), bottom: boxes[4].bottom };
      });
      const hiddenCount = r.more ? parseInt(r.more.replace(/\D/g, ""), 10) : 0;
      if (!r.fits || r.clash.length || r.shown + hiddenCount !== n || r.bottom > 800 || (n === 2 && r.font < 50)) crowd.push(n + " words: " + JSON.stringify(r));
      if (SHOTS && n === 30) await page.screenshot({ path: path.join(SHOTS, "class-words-30-words.png") });
    }
    await page.evaluate(s => { if (s) localStorage.setItem("classwords:stats", s); else localStorage.removeItem("classwords:stats"); }, savedPlan);
    crowd.length ? fail("class words home crowded: " + crowd.join(" | ")) : ok("class words home: 2, 12, 30 or 69 tricky words fit their box (big chips for 2, \"+N more\" past that), nothing overlaps");
  }

  // The frame can be turned to portrait (800 x 1280): nothing off the screen or under the Back button,
  // and Connect the Pairs lines follow the cards when it turns
  {
    const pp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await pp.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => st(f, d >= 1500 ? 5 : d, ...a); });
    // a matched pair, then turn the frame
    await pp.goto(base + "match.html?g=connect"); await pp.evaluate(() => MatchGame.start(0)); await pp.waitForTimeout(200);
    await pp.evaluate(() => { const p = MatchGame.state().pairs[0], items = Array.from(document.querySelectorAll(".item"));
      items.filter(b => b.pair === p && b.side === "L")[0].click(); items.filter(b => b.pair === p && b.side === "R")[0].click(); });
    await pp.setViewportSize({ width: 800, height: 1280 }); await pp.waitForTimeout(300);
    const lineOk = await pp.evaluate(() => {
      const G = MatchGame.state(), ln = G.svg.querySelector("line"), br = G.boardEl.getBoundingClientRect(), p = G.pairs[0];
      const items = Array.from(document.querySelectorAll(".item")), L = items.filter(b => b.pair === p && b.side === "L")[0].getBoundingClientRect(), R = items.filter(b => b.pair === p && b.side === "R")[0].getBoundingClientRect();
      const near = (a, b) => Math.abs(a - b) < 3;
      return !!ln && near(+ln.getAttribute("x1") + br.left, L.right) && near(+ln.getAttribute("y1") + br.top, L.top + L.height / 2) && near(+ln.getAttribute("x2") + br.left, R.left) && near(+ln.getAttribute("y2") + br.top, R.top + R.height / 2);
    });
    lineOk ? ok("connect the pairs: the line follows the cards when the frame turns to portrait") : fail("connect the pairs line is in the wrong place after turning the frame");
    const portraitBad = [];
    const check = async name => {
      await pp.waitForTimeout(250);
      const r = await pp.evaluate(() => {
        const W = innerWidth, H = innerHeight, out = [];
        const seen = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") return false; } return true; };
        const els = Array.from(document.querySelectorAll("button, img, .paper, .chip, .choice, .tile, .item, .card, h1, .hint, .eq, .colsum, .prompt, canvas")).filter(e => seen(e) && e.offsetWidth && !e.closest(".turnpop"));
        els.forEach(e => { const r = e.getBoundingClientRect(); if (r.right > W + 2 || r.left < -2 || r.bottom > H + 2) out.push("off screen: " + e.tagName.toLowerCase() + "." + String(e.className).split(" ").join(".")); });
        const back = document.getElementById("backBtn").getBoundingClientRect();
        els.forEach(e => { if (e.closest("#backBtn")) return; const r = e.getBoundingClientRect(); if (r.left < back.right && r.right > back.left && r.top < back.bottom && r.bottom > back.top) out.push("under Back: " + e.tagName.toLowerCase() + "." + String(e.className).split(" ").join(".")); });
        if (document.documentElement.scrollWidth > W) out.push("scrolls sideways");
        return out.slice(0, 3);
      });
      if (r.length) portraitBad.push(name + ": " + r.join(", "));
    };
    for (const p of ["index", "words", "math"]) { await pp.goto(base + p + ".html"); await check(p); }
    for (const u of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "wordsearch.html", "math-game.html?g=count", "math-game.html?g=ops", "math-game.html?g=pattern"]) {
      await pp.goto(base + u); await check(u + " levels");
      const cnt = await pp.locator("#path button").count();
      for (const i of [0, cnt - 1]) { await pp.goto(base + u); await pp.waitForTimeout(100); await pp.locator("#path button").nth(i).click(); await check(u + " level " + (i + 1)); }
    }
    await pp.goto(base + "class-words.html"); await check("class-words home");
    for (const k of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) { await pp.evaluate(k => ClassWords.start(k), k); await check("class-words " + k); }
    if (SHOTS) await pp.screenshot({ path: path.join(SHOTS, "portrait-class-write.png") });
    await pp.close();
    portraitBad.length ? fail("portrait: " + portraitBad.slice(0, 6).join(" | ")) : ok("portrait (800 x 1280): every picker, level list and game screen fits, nothing under the Back button");
  }

  // Grown-ups: hold 1.5 s on Pick a mission, then hide Space Words for some hours (the app keeps the time)
  {
    const hp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await hp.addInitScript(() => { window.__hid = []; window.AndroidApp = { hideFor: h => window.__hid.push(h), backToPhotos: () => {} }; });
    await hp.goto(base + "index.html"); await hp.waitForTimeout(200);
    const open = () => hp.evaluate(() => document.getElementById("hidePop").style.display !== "none");
    const bb = await hp.locator("#adultBtn").boundingBox();
    await hp.mouse.move(bb.x + 20, bb.y + 10); await hp.mouse.down(); await hp.waitForTimeout(500); await hp.mouse.up();
    const quick = await open();
    await hp.mouse.down(); await hp.waitForTimeout(1700); await hp.mouse.up();
    const held = await open();
    await hp.evaluate(() => goBack()); const backCloses = !(await open());
    await hp.mouse.down(); await hp.waitForTimeout(1700); await hp.mouse.up();
    await hp.click('#hideHours button[data-hours="3"]'); await hp.waitForTimeout(1500);
    const hid = await hp.evaluate(() => window.__hid);
    await hp.close();
    !quick && held && backCloses && hid.join() === "3"
      ? ok("grown-ups: a quick tap does nothing, holding opens Hide; Back closes it; 3 hours asks the app to hide for 3")
      : fail("grown-ups hide: " + JSON.stringify({ quick, held, backCloses, hid }));
  }

  // Hubs show star totals after playing.
  await page.goto(base + "math.html"); await page.waitForTimeout(150);
  const got = await page.locator(".got").first().textContent();
  /stars/.test(got) ? ok("math hub shows " + got) : fail("math hub star total missing");
  await shot("math-after");

  errors.length ? errors.slice(0, 10).forEach(e => fail("page error: " + e)) : ok("no page errors");
  await browser.close(); server.close();
  console.log(failures ? failures + " failure(s)" : "All web tests passed");
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
