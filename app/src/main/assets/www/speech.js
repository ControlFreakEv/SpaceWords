/* Shared speech for Space Words (Picture Planet and Sight Word Saucer) (plain ES5 for old Android WebViews).
   Uses recorded clips in audio/ when they exist, otherwise the device's text-to-speech. */
(function(){
"use strict";
var PHRASES = {"w_a":"a","w_and":"and","w_away":"away","w_big":"big","w_blue":"blue","w_can":"can","w_come":"come","s_come":"Can you come to my house?","w_down":"down","s_down":"The ball rolled down the hill.","w_find":"find","w_for":"for","w_funny":"funny","s_funny":"The clown is funny.","w_go":"go","w_help":"help","s_help":"Can you help me?","w_here":"here","w_i":"I","w_in":"in","w_is":"is","w_it":"it","w_jump":"jump","s_jump":"Frogs can jump high.","w_little":"little","s_little":"A little bug is on the leaf.","w_look":"look","w_make":"make","w_me":"me","w_my":"my","w_not":"not","w_one":"one","w_play":"play","s_play":"We like to play ball.","w_red":"red","w_run":"run","s_run":"The dog can run fast.","w_said":"said","s_said":"Mom said it is time for bed.","w_see":"see","s_see":"I can see a red ball.","w_the":"the","s_the":"I see the dog.","w_three":"three","w_to":"to","w_two":"two","s_two":"I have two hands.","w_up":"up","w_we":"we","w_where":"where","s_where":"Where is my hat?","w_yellow":"yellow","s_yellow":"The sun is big and yellow.","w_you":"you","w_all":"all","w_am":"am","w_are":"are","w_at":"at","w_ate":"ate","w_be":"be","w_black":"black","w_brown":"brown","w_but":"but","w_came":"came","w_did":"did","w_do":"do","w_eat":"eat","s_eat":"I like to eat apples.","w_four":"four","s_four":"A dog has four legs.","w_get":"get","w_good":"good","s_good":"This cake tastes good.","w_have":"have","w_he":"he","w_into":"into","w_like":"like","w_must":"must","w_new":"new","s_new":"I got new shoes.","w_no":"no","w_now":"now","w_on":"on","w_our":"our","w_out":"out","w_please":"please","s_please":"May I have a cookie, please?","w_pretty":"pretty","w_ran":"ran","w_ride":"ride","s_ride":"I can ride my bike.","w_saw":"saw","w_say":"say","w_she":"she","w_so":"so","w_soon":"soon","w_that":"that","w_there":"there","w_they":"they","s_they":"They are my friends.","w_this":"this","w_too":"too","w_under":"under","s_under":"The cat is under the bed.","w_want":"want","w_was":"was","s_was":"The cat was on the mat.","w_well":"well","w_went":"went","s_went":"We went to the park.","w_what":"what","s_what":"What is your name?","w_white":"white","w_who":"who","s_who":"Who is at the door?","w_will":"will","w_with":"with","s_with":"Come play with me.","w_yes":"yes","s_yes":"Can I go? yes, you can!","w_after":"after","w_again":"again","w_an":"an","w_any":"any","w_as":"as","w_ask":"ask","w_by":"by","w_could":"could","s_could":"I could not find my shoe.","w_every":"every","s_every":"I brush my teeth every day.","w_fly":"fly","s_fly":"Birds can fly.","w_from":"from","s_from":"This card is from Grandma.","w_give":"give","s_give":"Please give me the ball.","w_going":"going","w_had":"had","w_has":"has","w_her":"her","w_him":"him","w_his":"his","w_how":"how","s_how":"How old are you?","w_just":"just","w_know":"know","s_know":"I know how to swim.","w_let":"let","w_live":"live","w_may":"may","w_of":"of","w_old":"old","w_once":"once","s_once":"Once upon a time, there was a king.","w_open":"open","s_open":"Please open the door.","w_over":"over","w_put":"put","w_round":"round","w_some":"some","w_stop":"stop","s_stop":"Red means stop.","w_take":"take","w_thank":"thank","s_thank":"Thank you for the gift.","w_them":"them","w_then":"then","w_think":"think","w_walk":"walk","s_walk":"We walk the dog every day.","w_were":"were","s_were":"We were at the zoo.","w_when":"when","w_always":"always","s_always":"I always wash my hands before I eat.","w_around":"around","w_because":"because","s_because":"I wore a coat because it was cold.","w_been":"been","w_before":"before","w_best":"best","w_both":"both","w_buy":"buy","w_call":"call","w_cold":"cold","s_cold":"Ice is very cold.","w_does":"does","w_dont":"don't","s_dont":"Please don't touch the hot stove.","w_fast":"fast","w_first":"first","s_first":"I want to go first!","w_five":"five","w_found":"found","s_found":"I found my lost toy!","w_gave":"gave","w_goes":"goes","w_green":"green","s_green":"Grass is green.","w_its":"its","w_made":"made","w_many":"many","s_many":"How many cats do you have?","w_off":"off","w_or":"or","w_pull":"pull","w_read":"read","w_right":"right","w_sing":"sing","w_sit":"sit","w_sleep":"sleep","s_sleep":"I sleep in my bed.","w_tell":"tell","w_their":"their","s_their":"The kids put on their coats.","w_these":"these","w_those":"those","w_upon":"upon","w_us":"us","w_use":"use","w_very":"very","w_wash":"wash","w_which":"which","s_which":"Which one do you want?","w_why":"why","s_why":"Why is the sky blue?","w_wish":"wish","w_work":"work","w_would":"would","s_would":"Would you like some milk?","w_write":"write","s_write":"I can write my name.","w_your":"your","w_about":"about","w_better":"better","w_bring":"bring","w_carry":"carry","s_carry":"Can you help me carry this box?","w_clean":"clean","s_clean":"Please clean your room.","w_cut":"cut","w_done":"done","w_draw":"draw","w_drink":"drink","s_drink":"I drink milk at lunch.","w_eight":"eight","w_fall":"fall","w_far":"far","w_full":"full","w_got":"got","w_grow":"grow","s_grow":"Plants need water to grow.","w_hold":"hold","w_hot":"hot","w_hurt":"hurt","w_if":"if","w_keep":"keep","w_kind":"kind","w_laugh":"laugh","s_laugh":"Jokes make me laugh.","w_light":"light","s_light":"Turn on the light.","w_long":"long","w_much":"much","w_myself":"myself","s_myself":"I can tie my shoes by myself.","w_never":"never","s_never":"I will never give up.","w_only":"only","w_own":"own","w_pick":"pick","w_seven":"seven","w_shall":"shall","w_show":"show","w_six":"six","w_small":"small","w_start":"start","s_start":"The race will start soon.","w_ten":"ten","w_today":"today","s_today":"Today is my birthday!","w_together":"together","s_together":"We can play together.","w_try":"try","w_warm":"warm","s_warm":"The sun feels warm.","w_cat":"cat","w_dog":"dog","w_sun":"sun","w_bus":"bus","w_hat":"hat","w_pig":"pig","w_bed":"bed","w_bug":"bug","w_box":"box","w_fox":"fox","w_egg":"egg","w_map":"map","w_pen":"pen","w_web":"web","w_bat":"bat","w_van":"van","w_ant":"ant","w_frog":"frog","w_ship":"ship","w_fish":"fish","w_duck":"duck","w_crab":"crab","w_drum":"drum","w_star":"star","w_sock":"sock","w_chick":"chick","w_shell":"shell","w_truck":"truck","w_clock":"clock","w_flag":"flag","w_sled":"sled","w_ring":"ring","w_tent":"tent","w_milk":"milk","w_cake":"cake","w_kite":"kite","w_bike":"bike","w_rose":"rose","w_snail":"snail","w_train":"train","w_tree":"tree","w_bee":"bee","w_boat":"boat","w_goat":"goat","w_moon":"moon","w_snake":"snake","w_whale":"whale","w_cheese":"cheese","w_sheep":"sheep","w_house":"house","w_owl":"owl","w_bone":"bone","w_rain":"rain","w_rabbit":"rabbit","w_rocket":"rocket","w_pumpkin":"pumpkin","w_apple":"apple","w_tiger":"tiger","w_zebra":"zebra","w_pencil":"pencil","w_carrot":"carrot","w_robot":"robot","w_lemon":"lemon","w_monkey":"monkey","w_turtle":"turtle","w_candle":"candle","w_guitar":"guitar","w_balloon":"balloon","w_penguin":"penguin","w_dragon":"dragon","w_spider":"spider","w_cookie":"cookie","w_pizza":"pizza","w_butterfly":"butterfly","w_rainbow":"rainbow","w_snowman":"snowman","w_octopus":"octopus","w_elephant":"elephant","w_dinosaur":"dinosaur","w_umbrella":"umbrella","w_strawberry":"strawberry","w_pineapple":"pineapple","w_helicopter":"helicopter","w_telescope":"telescope","w_kangaroo":"kangaroo","w_crocodile":"crocodile","w_watermelon":"watermelon","w_sandwich":"sandwich","w_popcorn":"popcorn","w_sunflower":"sunflower","w_ladybug":"ladybug","w_cupcake":"cupcake","p_praise_0":"Great job!","p_praise_1":"You got it!","p_praise_2":"Super reading!","p_praise_3":"Awesome!","p_praise_4":"Yes!","p_praise_5":"Nice work!","p_space_0":"Beam it up!","p_space_1":"Out of this world!","p_space_2":"Great reading, space cadet!","p_space_3":"Blast off!","p_space_4":"You got it!","p_try":"Try again.","p_perfect":"Perfect! You read every word!","p_mission":"Mission complete!","p_spell":"Now spell it.","p_sound_on":"Talking is on.","p_hi":"Hi! Let's read some words.","p_stars_0":"You earned 0 stars!","p_stars_1":"You earned 1 star!","p_stars_2":"You earned 2 stars!","p_stars_3":"You earned 3 stars!","p_stars_4":"You earned 4 stars!","p_stars_5":"You earned 5 stars!","p_stars_6":"You earned 6 stars!","p_stars_7":"You earned 7 stars!","p_stars_8":"You earned 8 stars!","p_stars_9":"You earned 9 stars!","p_stars_10":"You earned 10 stars!"};

function load(k, d){ try { var v = localStorage.getItem("speech:" + k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } }
function save(k, v){ try { localStorage.setItem("speech:" + k, JSON.stringify(v)); } catch(e){} }

var bridge = window.AndroidTTS || null;
var browserTTS = !bridge && ("speechSynthesis" in window) ? window.speechSynthesis : null;
var clips = null;            // keys with recorded audio
var voices = [], voice = null;
var soundOn = load("sound", true);
var savedVoice = load("voice", "");
var listeners = [];
var queue = [], playing = null;

function notify(){ for (var i = 0; i < listeners.length; i++){ try { listeners[i](); } catch(e){} } }

/* recorded clips */
try {
  var x = new XMLHttpRequest();
  x.open("GET", "audio/index.json", true);
  x.onload = function(){
    if (x.status === 200){
      try { var arr = JSON.parse(x.responseText); clips = {}; for (var i = 0; i < arr.length; i++) clips[arr[i]] = true; } catch(e){ clips = null; }
    }
    notify();
  };
  x.onerror = notify;
  x.send();
} catch(e){}

/* text-to-speech voices */
function score(v){
  if (!/^en/i.test(v.lang || "")) return -1;
  var s = 100, n = v.name || "";
  if (/en[-_]US/i.test(v.lang)) s += 10;
  if (/natural|neural|enhanced|premium|google/i.test(n)) s += 50;
  if (v.localService === false) s += 5;
  return s;
}
function loadVoices(){
  var list = [];
  try {
    if (bridge) list = JSON.parse(bridge.voices());
    else if (browserTTS) list = browserTTS.getVoices().map(function(v){ return {id:v.name, name:v.name, lang:v.lang, localService:v.localService, raw:v}; });
  } catch(e){ list = []; }
  voices = list.filter(function(v){ return score(v) >= 0; }).sort(function(a, b){ return score(b) - score(a); });
  voice = null;
  for (var i = 0; i < voices.length; i++) if (voices[i].id === savedVoice) voice = voices[i];
  if (!voice && voices.length) voice = voices[0];
  notify();
}
window.__ttsReady = loadVoices;
if (browserTTS){ browserTTS.onvoiceschanged = loadVoices; setTimeout(loadVoices, 300); }
if (bridge) setTimeout(loadVoices, 300);

function mode(){
  if (clips) return "audio";
  if (voices.length) return "tts";
  return "none";
}

function stop(){
  queue = [];
  if (playing){ try { playing.onended = null; playing.onerror = null; playing.pause(); } catch(e){} playing = null; }
  try { if (bridge) bridge.cancel(); else if (browserTTS) browserTTS.cancel(); } catch(e){}
}

function playNext(){
  if (!queue.length){ playing = null; return; }
  var key = queue.shift();
  var a = new Audio("audio/" + key + ".mp3");
  playing = a;
  a.onended = playNext;
  a.onerror = playNext;
  try { var p = a.play(); if (p && p["catch"]) p["catch"](function(){ playNext(); }); } catch(e){ playNext(); }
}

function sayTTS(texts){
  try {
    if (bridge){
      for (var i = 0; i < texts.length; i++) bridge.speak(texts[i], voice ? voice.id : "", 0.9, 1.0, i === 0);
    } else if (browserTTS){
      browserTTS.cancel();
      texts.forEach(function(t){
        var u = new SpeechSynthesisUtterance(t);
        if (voice && voice.raw){ u.voice = voice.raw; u.lang = voice.raw.lang; } else u.lang = "en-US";
        u.rate = 0.9; u.pitch = 1.0; browserTTS.speak(u);
      });
    }
  } catch(e){}
}

/* keys: list of phrase keys, e.g. ["w_cat","p_praise_0"] */
function say(keys){
  if (!soundOn) return;
  stop();
  var m = mode();
  if (m === "audio"){
    var allRecorded = keys.every(function(k){ return clips[k]; });
    if (allRecorded || !voices.length){
      queue = keys.filter(function(k){ return clips[k]; });
      playNext();
      return;
    }
  }
  if (voices.length){
    sayTTS(keys.map(function(k){ return PHRASES[k] || ""; }).filter(Boolean));
  }
}

window.Speech = {
  say: say,
  stop: stop,
  mode: mode,
  canTalk: function(){ return soundOn && mode() !== "none"; },
  soundOn: function(){ return soundOn; },
  setSound: function(on){ soundOn = !!on; save("sound", soundOn); if (!soundOn) stop(); notify(); },
  voices: function(){ return voices; },
  voice: function(){ return voice; },
  setVoice: function(id){ for (var i = 0; i < voices.length; i++) if (voices[i].id === id) voice = voices[i]; savedVoice = id; save("voice", id); },
  onChange: function(fn){ listeners.push(fn); },
  key: function(word){ return "w_" + String(word).toLowerCase().replace(/[^a-z0-9]/g, ""); }
};
})();
