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
/* Say so when the frame's media volume is all the way down (the games would be silent). */
try {
  if (window.AndroidAudio && /^0\//.test(window.AndroidAudio.volume())){
    var note = document.createElement("div");
    note.className = "muted";
    note.innerHTML = "&#128263; The frame's sound is turned all the way down.";
    document.body.appendChild(note);
  }
} catch(e){}
document.addEventListener("touchstart", function(){}, true);
})();
