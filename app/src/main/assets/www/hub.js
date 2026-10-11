/* Mission pickers: card taps and star totals (plain ES5 for Chromium 39). */
(function(){
"use strict";
function total(storageKey){
  try {
    var v = JSON.parse(localStorage.getItem(storageKey) || "{}"), n = 0, k;
    for (k in v) if (v.hasOwnProperty(k) && typeof v[k] === "number") n += v[k];
    return n;
  } catch(e){ return 0; }
}
var cards = document.querySelectorAll("[data-go]");
for (var i = 0; i < cards.length; i++){
  (function(card){
    card.onclick = function(){ location.href = card.getAttribute("data-go"); };
    var keys = (card.getAttribute("data-stars") || "").split(" "), n = 0;
    for (var j = 0; j < keys.length; j++) if (keys[j]) n += total(keys[j]);
    var got = card.querySelector(".got");
    if (got) got.innerHTML = n > 0 ? "&#9733; " + n + " stars" : "";
  })(cards[i]);
}
/* Back: picker -> its parent page; on "Pick a mission" it returns to the photos (through the app). */
function goBack(){
  var pop = document.getElementById("hidePop");
  if (pop && pop.style.display !== "none"){ pop.style.display = "none"; return; }   // the grown-ups panel closes first
  var m = document.querySelector('meta[name="parent"]');
  if (m) location.href = m.getAttribute("content");
  else if (window.AndroidApp) window.AndroidApp.backToPhotos();
}
document.getElementById("backBtn").onclick = goBack;

/* grown-ups (Pick a mission): hold 1.5 s so little fingers don't open it, then hide Space Words
   for some hours. The app keeps the time (HideTimer.kt), through restarts too. */
(function(){
  var btn = document.getElementById("adultBtn"), pop = document.getElementById("hidePop");
  if (!btn || !pop) return;
  var fill = document.getElementById("adultFill"), t = null, HOURS = [1, 2, 3, 4, 6, 8, 12, 24];
  function begin(e){
    if (e && e.preventDefault) e.preventDefault();
    fill.style.webkitTransition = fill.style.transition = "width 1.5s linear"; fill.style.width = "100%";
    t = setTimeout(function(){ cancel(); open(); }, 1500);
  }
  function cancel(){ clearTimeout(t); fill.style.webkitTransition = fill.style.transition = "none"; fill.style.width = "0"; }
  function open(){ pop.style.display = ""; }
  function hide(h){
    var app = window.AndroidApp;
    document.getElementById("hideMsg").textContent = "Hidden for " + h + (h === 1 ? " hour" : " hours") + ". See you later!";
    document.getElementById("hideHours").style.visibility = "hidden";
    if (app && app.hideFor) setTimeout(function(){ try { app.hideFor(h); } catch(e){} }, 1200);   // closes the game window
    else { try { localStorage.setItem("hide:until", String(Date.now() + h * 3600000)); } catch(e){} }   // browser: just remember it
  }
  var box = document.getElementById("hideHours");
  HOURS.forEach(function(h){
    var b = document.createElement("button");
    b.textContent = h + (h === 1 ? " hour" : " hours");
    b.setAttribute("data-hours", h);
    b.onclick = function(){ hide(h); };
    box.appendChild(b);
  });
  document.getElementById("hideCancel").onclick = function(){ pop.style.display = "none"; };
  btn.addEventListener("touchstart", begin, false); btn.addEventListener("touchend", cancel, false); btn.addEventListener("touchcancel", cancel, false);
  btn.addEventListener("mousedown", begin, false); btn.addEventListener("mouseup", cancel, false); btn.addEventListener("mouseleave", cancel, false);
  window.HideGame = { open: open, hide: hide };
})();
window.goBack = goBack;
document.addEventListener("touchstart", function(){}, true);
})();
