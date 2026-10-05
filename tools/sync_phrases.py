"""
Copies phrases.json into the PHRASES table embedded in speech.js (used for text-to-speech
fallback), so the two never drift apart. Run after editing phrases.json:

    python tools/sync_phrases.py          (or python3 on Linux/Mac)
    python tools/sync_phrases.py --check  (exit 1 if speech.js is out of date)
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "..", "app", "src", "main", "assets", "www")
phrases = json.load(open(os.path.join(WWW, "phrases.json"), encoding="utf-8"))
path = os.path.join(WWW, "speech.js")
src = open(path, encoding="utf-8").read()
line = "var PHRASES = " + json.dumps(phrases, ensure_ascii=False, separators=(",", ":")) + ";"
new, n = re.subn(r"^var PHRASES = \{.*\};$", lambda m: line, src, count=1, flags=re.M)
if n != 1:
    sys.exit("Couldn't find the 'var PHRASES = {...};' line in speech.js")
if "--check" in sys.argv:
    if new != src:
        sys.exit("speech.js is out of date: run python tools/sync_phrases.py")
    print("speech.js matches phrases.json (%d phrases)" % len(phrases))
    sys.exit(0)
if new != src:
    open(path, "w", encoding="utf-8").write(new)
print("speech.js now has %d phrases" % len(phrases))
