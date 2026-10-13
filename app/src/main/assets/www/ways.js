/* "Which way?" bonus questions (the owner asked for left/right/up/down and north/south/east/west
   questions mixed in with the words now and then). A page calls Ways.between(next) in place of
   starting its next round; once in a while that shows a question first, then calls next().
   Not counted for stars. The page's show() calls Ways.close(), so Back drops the question.
   Two kinds of question, each with left/right/up/down or north/south/east/west words:
     "way":  4 pictures around the alien; "Which way is the cat from the alien?" -> arrow buttons
     "pick": "Tap the picture north of the alien." -> tap one of the 4 pictures
   ES5 for Chromium 39. Needs speech.js. */
(function(){
"use strict";

/* easy picture words from Picture Planet (web-test.js checks they match its pictures and have clips) */
var PICS = "cat:1f431 dog:1f436 sun:2600 bus:1f68c hat:1f3a9 pig:1f437 fox:1f98a egg:1f95a cup:2615 hen:1f414 frog:1f438 fish:1f41f duck:1f986 star:2b50 ship:1f6a2 crab:1f980 drum:1f941 bell:1f514 gift:1f381 tent:26fa"
  .split(" ").map(function(p){ var a = p.split(":"); return { w:a[0], img:a[1] }; });
var NAMES = { lr:{ u:"up", d:"down", l:"left", r:"right" }, map:{ u:"north", d:"south", l:"west", r:"east" } };
var ARROWS = { u:"&#8593;", d:"&#8595;", l:"&#8592;", r:"&#8594;" };
var PICK_TEXT = { up:"up from", down:"down from", left:"to the left of", right:"to the right of", north:"north of", south:"south of", east:"east of", west:"west of" };
var RATE = typeof window.__waysRate === "number" ? window.__waysRate : 0.22;   // chance per round, after at least 3 rounds since the last one
var since = 0, cur = null;

var css = "" +
".wy-back{position:fixed;left:0;top:0;right:0;bottom:0;z-index:20;background:rgba(5,8,26,0.72);display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center}" +
".wy-card{background:#F7F9FF;color:#1F2A44;border:0.5vmin solid #1F2A44;border-radius:2.8vmin;box-shadow:0.8vmin 0.8vmin 0 #05081A;padding:2.4vmin 3vmin;margin-top:8vmin;" +
"  display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:center;align-items:center;max-width:96vw}" +
".wy-tag{font-size:3vmin;color:#E5487A;letter-spacing:.2vmin}" +
".wy-top{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;margin-top:.6vmin}" +
".wy-q{margin:0;font-size:4.6vmin;line-height:1.2;text-align:center}" +
".wy-top .sayb{width:8vmin;height:8vmin;border-radius:50%;background:#FFD93D;margin-left:2vmin;-webkit-flex:none;flex:none;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center}" +
".wy-top .sayb img{width:5vmin;height:5vmin;display:block}" +
".wy-sub{margin:.6vmin 0 0;font-size:3.2vmin;color:#4F5F80;text-align:center}" +
".wy-body{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;margin-top:2vmin}" +
".wy-board{position:relative;width:48vmin;height:48vmin;-webkit-flex:none;flex:none;border-radius:2vmin;background:#E3E9FF}" +
".wy-slot{position:absolute;width:15vmin;height:15vmin;border-radius:2vmin;background:#FFFFFF;border:0.45vmin solid #1F2A44;color:#1F2A44;font-family:inherit;font-weight:inherit;padding:0;" +
"  display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;font-size:3.2vmin;line-height:1.1}" +
".wy-slot img{width:9vmin;height:9vmin;display:block}" +
".wy-slot.u{left:16.5vmin;top:.5vmin}.wy-slot.d{left:16.5vmin;top:32.5vmin}.wy-slot.l{left:.5vmin;top:16.5vmin}.wy-slot.r{left:32.5vmin;top:16.5vmin}" +
".wy-slot.c{left:16.5vmin;top:16.5vmin;background:#131A3D;border-color:#5CE1E6;color:#F3F6FF}" +
".wy-n{position:absolute;left:2vmin;top:2vmin;width:10vmin;height:10vmin;border-radius:50%;border:0.4vmin solid #E5487A;color:#E5487A;font-size:3.4vmin;line-height:1;text-align:center;padding-top:1.3vmin}" +
".wy-n b{display:block;font-size:4vmin}" +
".wy-pad{position:relative;width:43vmin;height:37vmin;margin-left:5vmin;-webkit-flex:none;flex:none}" +
".wy-way{position:absolute;width:13vmin;height:11.5vmin;border-radius:2vmin;background:#FFFFFF;border:0.5vmin solid #1F2A44;box-shadow:0.5vmin 0.5vmin 0 #05081A;color:#1F2A44;font-family:inherit;font-weight:inherit;padding:0;" +
"  font-size:3.2vmin;line-height:1.1;display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center}" +
".wy-way b{font-size:5.4vmin;line-height:1}" +
".wy-way.u{left:15vmin;top:0}.wy-way.d{left:15vmin;top:25.5vmin}.wy-way.l{left:0;top:12.75vmin}.wy-way.r{left:30vmin;top:12.75vmin}" +
"button.wy-slot,.wy-way{cursor:pointer;outline:none}" +
".wy-ok{background:#7CFFB2 !important}" +
".wy-bad{background:#FFC2E6 !important;opacity:.55}" +
".wy-shake{-webkit-animation:wyshake .4s;animation:wyshake .4s}" +
"@-webkit-keyframes wyshake{20%{-webkit-transform:translateX(-1.4vmin)}40%{-webkit-transform:translateX(1.4vmin)}60%{-webkit-transform:translateX(-.8vmin)}80%{-webkit-transform:translateX(.8vmin)}}" +
"@keyframes wyshake{20%{transform:translateX(-1.4vmin)}40%{transform:translateX(1.4vmin)}60%{transform:translateX(-.8vmin)}80%{transform:translateX(.8vmin)}}" +
"@media (orientation: portrait){.wy-body{-webkit-flex-direction:column;flex-direction:column}.wy-pad{margin:4vmin 0 0}}";
var style = document.createElement("style");
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random()*(i+1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function say(keys, done){ Speech.say(keys, done); }
function key(w){ return Speech.key(w); }
function shake(e){ e.className = e.className.replace(/ wy-shake/g, ""); void e.offsetWidth; e.className += " wy-shake"; }

/* in place of starting the next round: now and then a question first */
function between(next){
  since++;
  close();
  if (RATE >= 1 || (since >= 3 && Math.random() < RATE)){ since = 0; ask(next); }
  else next();
}

function ask(next, form, kind){
  close();
  form = form || pick(["way", "pick"]); kind = kind || pick(["lr", "map"]);
  var names = NAMES[kind], pics = shuffle(PICS).slice(0, 4), spots = ["u", "l", "r", "d"], at = {};
  spots.forEach(function(s, i){ at[s] = pics[i]; });
  var t = pick(spots), ans = form === "way" ? names[t] : at[t].w;
  var q = { form:form, kind:kind, at:at, target:t, ans:ans, tries:0, done:false, btn:{}, next:next };
  cur = q;

  var back = el("div", "wy-back"), card = el("div", "wy-card"), top = el("div", "wy-top"), body = el("div", "wy-body"), board = el("div", "wy-board");
  var text, keys;
  if (form === "way"){ text = "Which way is the " + at[t].w + " from the alien?"; keys = ["p_which_way_is", key(at[t].w), "p_from_alien"]; }
  else { text = "Tap the picture " + PICK_TEXT[names[t]] + " the alien."; keys = ["dq_" + names[t]]; }
  if (kind === "map") keys = keys.concat(["p_north_up"]);
  q.keys = keys;
  card.appendChild(el("div", "wy-tag", "BONUS: WHICH WAY?"));
  top.appendChild(el("p", "wy-q", Speech.tapText(text)));
  if (Speech.canTalk()){
    var sb = el("button", "press sayb", '<img src="emoji/1f50a.svg" alt="">');
    sb.setAttribute("aria-label", "Hear the question");
    sb.onclick = function(){ say(keys); };
    top.appendChild(sb);
  }
  card.appendChild(top);
  if (kind === "map") card.appendChild(el("p", "wy-sub", Speech.tapText("North is up, like on a map.")));

  if (kind === "map") board.appendChild(el("div", "wy-n", "<b>&#8593;</b>N"));
  spots.forEach(function(s){
    var p = at[s], slot = el(form === "pick" ? "button" : "div", "wy-slot " + s, '<img src="emoji/' + p.img + '.svg" alt="">' + p.w);
    if (form === "pick"){
      slot.setAttribute("data-pic", p.w);
      slot.className += " press";
      slot.onclick = function(){ answer(q, slot, p.w); };
      q.btn[p.w] = slot;
    }
    board.appendChild(slot);
  });
  board.appendChild(el("div", "wy-slot c", '<img src="emoji/1f47d.svg" alt="">alien'));
  body.appendChild(board);
  q.shakeEl = board;
  if (form === "way"){
    var pad = el("div", "wy-pad");
    spots.forEach(function(s){
      var b = el("button", "press wy-way " + s, "<b>" + ARROWS[s] + "</b>" + names[s]);
      b.setAttribute("data-way", names[s]);
      b.onclick = function(){ answer(q, b, names[s]); };
      q.btn[names[s]] = b; pad.appendChild(b);
    });
    body.appendChild(pad);
    q.shakeEl = pad;
  }
  card.appendChild(body);
  back.appendChild(card);
  document.body.appendChild(back);
  q.el = back;
  say(keys);
  return q;
}

function answer(q, b, val){
  if (cur !== q || q.done || / wy-bad/.test(b.className)) return;
  var shut = false;
  function finish(){ if (shut) return; shut = true; setTimeout(function(){ if (cur !== q) return; close(); q.next(); }, 500); }
  var tell = key(q.ans);
  if (val === q.ans){
    q.done = true; b.className += " wy-ok";
    say(["p_praise_" + Math.floor(Math.random()*6), tell], finish);
    setTimeout(finish, 7000);
    return;
  }
  q.tries++; b.className += " wy-bad"; shake(q.shakeEl);
  if (q.tries < 2){ say(["p_try"]); return; }
  q.done = true; q.btn[q.ans].className += " wy-ok";
  say([q.form === "way" ? "p_its" : "p_its_the", tell], finish);
  setTimeout(finish, 7000);
}

/* drop any question on screen (without starting the next round) */
function close(){
  if (!cur) return;
  var q = cur; cur = null;
  if (q.el && q.el.parentNode) q.el.parentNode.removeChild(q.el);
}

window.Ways = { between:between, ask:ask, close:close, pics:PICS, names:NAMES, pickText:PICK_TEXT,
  rate:function(r){ RATE = r; since = 0; }, state:function(){ return cur; } };
})();
