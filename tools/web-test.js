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
          if (R.kind === "choice") {
            const vals = R.options.map(o => o.val);
            if (vals.indexOf(R.answer) < 0) out.bad.push(where + " answer missing from choices " + vals);
            if (new Set(vals).size !== vals.length) out.bad.push(where + " repeated choices " + vals);
            if (vals.some(v => typeof v === "number" && (v < 0 || v > 100))) out.bad.push(where + " choice out of range " + vals);
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
        const R = await page.evaluate(() => { const R = MathGame.state().R; return { kind: R.kind, answer: R.answer, vals: R.options ? R.options.map(o => o.val) : null }; });
        if (r === 0) await shot(g + "-L" + (i + 1));
        if (R.kind === "choice") await page.locator(".choice").nth(R.vals.indexOf(R.answer)).click();
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
  for (const w of ["picture-planet.html", "saucer.html", "math-game.html", "match.html", "sound-lab.html", "compound.html"]) {
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

  // Tap any word: every tappable piece on screen has a clip.
  const tapKeys = new Set();
  const collect = async () => (await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll("[data-say]"), e => e.getAttribute("data-say")))).forEach(k => tapKeys.add(k));
  for (const g of ["count", "ops", "pattern"]) {
    await page.goto(base + "math-game.html?g=" + g);
    for (let i = 0; i < 5; i++) for (let t = 0; t < 8; t++) { await page.evaluate(i => MathGame.start(i), i); await collect(); }
  }
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

  await page.goto(base + "words.html"); await page.waitForTimeout(150); await shot("words-after");

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
