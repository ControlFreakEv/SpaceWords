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
  var m = document.querySelector('meta[name="parent"]');
  if (m) location.href = m.getAttribute("content");
  else if (window.AndroidApp) window.AndroidApp.backToPhotos();
}
document.getElementById("backBtn").onclick = goBack;
window.goBack = goBack;
document.addEventListener("touchstart", function(){}, true);
})();
