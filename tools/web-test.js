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
    const report = await page.evaluate(() => {
      const out = { bad: [], keys: {} }, G = MathGame.game();
      G.levels.forEach((lv, li) => lv.rounds.forEach((mk, ri) => {
        for (let t = 0; t < 150; t++) {
          const R = mk();
          const where = "L" + (li + 1) + " round " + ri + ": " + R.hint;
          (R.say || []).concat(R.answerSay || []).forEach(k => out.keys[k] = 1);
          if (typeof R.answer === "number" && !(Number.isInteger(R.answer) && R.answer >= 0 && R.answer <= 100)) out.bad.push(where + " answer " + R.answer);
          if (R.kind === "pad" && R.prompt.indexOf('id="entry"') < 0) out.bad.push(where + " keypad round without an answer box");
          const checkOpts = (opts, ans, w) => {
            const vals = opts.map(o => o.val);
            if (vals.indexOf(ans) < 0) out.bad.push(w + " answer missing from choices " + vals);
            if (new Set(vals).size !== vals.length) out.bad.push(w + " repeated choices " + vals);
            if (vals.some(v => typeof v === "number" && (v < 0 || v > 100))) out.bad.push(w + " choice out of range " + vals);
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
    });
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

  // Alien Patterns: every round has a rule, and getting it right shows it.
  await page.goto(base + "math-game.html?g=pattern");
  const ruleCheck = await page.evaluate(() => {
    const bad = [], keys = {};
    MathGame.game().levels.forEach((lv, li) => lv.rounds.forEach(mk => { for (let t = 0; t < 60; t++) {
      const R = mk();
      if (!R.rule || !R.rule.html || !R.rule.say || !R.rule.say.length) bad.push("level " + (li + 1) + ": " + R.hint + " has no rule");
      else R.rule.say.forEach(k => keys[k] = 1);
      if (R.rule && R.rule.steps) { const d = document.createElement("div"); d.innerHTML = R.prompt; if (d.querySelectorAll(".step").length !== R.rule.steps.length) bad.push("step labels missing"); }
    } }));
    return { bad: bad.slice(0, 5), keys: Object.keys(keys) };
  });
  ruleCheck.bad.length ? fail("pattern rules: " + ruleCheck.bad.join("; ")) : ok("every Alien Patterns round has a rule");
  const ruleMissing = ruleCheck.keys.filter(k => !(k in phrases));
  ruleMissing.length ? fail("rule clips missing: " + ruleMissing.join(", ")) : ok("every rule can be said (" + ruleCheck.keys.length + " clips)");
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
      for (let t = 0; t < 3; t++) { await page.locator(".key", { hasText: new RegExp("^" + wrongDigit + "$") }).click(); await page.locator(".key.go").click(); }
      const shown = await page.evaluate(() => document.getElementById("entry").textContent);
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
  for (const w of ["picture-planet.html", "saucer.html", "math-game.html", "match.html", "sound-lab.html", "compound.html", "class-words.html"]) {
    const src = fs.readFileSync(path.join(WWW, w), "utf8"), re = /"((?:[pmi])_[a-z_]+)"/g; let m;
    while ((m = re.exec(src))) if (!/_$/.test(m[1])) literalKeys.push(m[1]);
  }
  const missingLit = literalKeys.filter(k => !(k in phrases));
  missingLit.length ? fail("spoken keys in the pages missing from phrases.json: " + missingLit.join(", ")) : ok("all " + literalKeys.length + " spoken keys written in the pages exist");

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
    for (let t = 0; t < 400; t++) {
      const c = all[t % all.length], wrong = Compound.wrongSeconds(c.a, c.b, all, 3);
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

  // Class Words (her kindergarten list): data, every activity, the weekly plan, grown-ups screen.
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
  const plan0 = await page.evaluate(() => JSON.stringify(ClassWords.plan().week));
  plan0 === '["I","a"]' ? ok("first week's words are I and a") : fail("first week: " + plan0);

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
  // the weekly plan: last week's words move to review, the next two in the handout's order come in
  await page.evaluate(() => ClassWords.newWeek());
  const p1 = await page.evaluate(() => ClassWords.plan());
  JSON.stringify(p1.week) === '["the","to"]' && p1.done.indexOf("I") >= 0 ? ok("new week: the, to; I and a move to review") : fail("new week plan: " + JSON.stringify(p1));
  // grown-ups screen: a press and hold opens it; tapping a word changes it
  await page.evaluate(() => { document.getElementById("backBtn").click(); });
  await page.dispatchEvent("#adultBtn", "mousedown"); await page.waitForTimeout(80);
  const adultOpen = await page.evaluate(() => document.getElementById("adult").className.indexOf("on") >= 0);
  adultOpen ? ok("grown-ups screen opens with a press and hold") : fail("grown-ups screen didn't open");
  await shot("class-adult");
  await page.locator("#adultList button", { hasText: /^like/ }).click();
  const p2 = await page.evaluate(() => ClassWords.plan());
  p2.manual && p2.week.indexOf("like") >= 0 ? ok("grown-ups: tapping 'like' makes it a this-week word") : fail("grown-ups tap: " + JSON.stringify(p2));
  await page.click("#backBtn"); await page.click("#wallBtn"); await page.waitForTimeout(80); await shot("class-wall");
  await page.click("#backBtn");
  await shot("class-home-after");

  // Tap any word: every tappable piece on screen has a clip.
  const tapKeys = new Set();
  const collect = async () => (await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll("[data-say]"), e => e.getAttribute("data-say")))).forEach(k => tapKeys.add(k));
  for (const g of ["count", "ops", "pattern"]) {
    await page.goto(base + "math-game.html?g=" + g);
    for (let i = 0; i < 5; i++) for (let t = 0; t < 8; t++) { await page.evaluate(i => MathGame.start(i), i); await collect(); }
  }
  await page.goto(base + "class-words.html");
  for (const k of ["find", "blank", "teach", "hunt", "spell", "write", "roll", "say"]) for (let t = 0; t < 6; t++) { await page.evaluate(k => ClassWords.start(k), k); await collect(); }
  await page.evaluate(() => { document.getElementById("backBtn").click(); document.getElementById("wallBtn").click(); }); await collect();
  for (const w of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html"]) {
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
    "sound-lab.html": "words", "compound.html": "words", "math-game.html?g=count": "math", "math-game.html?g=ops": "math", "math-game.html?g=pattern": "math" };
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
  for (const pg of ["index.html", "words.html", "math.html", "class-words.html", "picture-planet.html", "saucer.html", "match.html?g=rhyme", "sound-lab.html", "compound.html", "math-game.html?g=ops"]) {
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
  for (const w of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "math-game.html?g=count", "math-game.html?g=ops", "math-game.html?g=pattern"]) {
    await spd.goto(base + w); await spd.waitForTimeout(150);
    const n = await spd.locator("#path button").count();
    for (let i = 0; i < n; i++) for (let t = 0; t < 3; t++) {
      await spd.goto(base + w); await spd.waitForTimeout(60);
      await spd.locator("#path button").nth(i).click(); await spd.waitForTimeout(60);
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
    "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html", "math-game.html?g=count", "math-game.html?g=pattern"];
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
  for (const g of ["picture-planet.html", "saucer.html", "match.html?g=connect", "match.html?g=rhyme", "sound-lab.html", "compound.html",
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
    const savedPlan = await page.evaluate(() => localStorage.getItem("classwords:plan"));
    const crowd = [];
    for (const n of [2, 12, 30, 69]) {
      await page.evaluate(n => { const C = ClassWords, plan = C.plan(); plan.week = C.LIST.slice(0, n); plan.manual = true; localStorage.setItem("classwords:plan", JSON.stringify(plan)); }, n);
      await page.reload(); await page.waitForTimeout(300);
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
    await page.evaluate(s => { if (s) localStorage.setItem("classwords:plan", s); else localStorage.removeItem("classwords:plan"); }, savedPlan);
    crowd.length ? fail("class words home crowded: " + crowd.join(" | ")) : ok("class words home: 2, 12, 30 or 69 words this week fit their box (big chips for 2, \"+N more\" past that), nothing overlaps");
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
