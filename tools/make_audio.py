"""
Records every word and phrase the games say, using Microsoft Edge's free neural voices,
and saves them as MP3s inside the app. Run this once on your PC (needs internet), then rebuild the app.

    pip install edge-tts
    python tools/make_audio.py                       # default voice
    python tools/make_audio.py --list                # show English voices
    python tools/make_audio.py --voice en-US-AnaNeural --force   # re-record with another voice

edge-tts is an unofficial client for Edge's Read Aloud service.
"""
import argparse, asyncio, json, os, sys

try:
    import edge_tts
except ImportError:
    sys.exit("Run:  pip install edge-tts")

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "..", "app", "src", "main", "assets", "www")
PHRASES = os.path.join(WWW, "phrases.json")
OUT = os.path.join(WWW, "audio")


async def record(key, text, voice, rate, force, sem):
    path = os.path.join(OUT, key + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 0 and not force:
        return key, True
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate=rate).save(path)
                return key, True
            except Exception as e:
                if attempt == 2:
                    print(f"  failed: {key} ({e})")
                await asyncio.sleep(1.5)
    return key, False


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="en-US-AvaNeural")
    ap.add_argument("--rate", default="-10%", help="speed, e.g. -15%% is slower")
    ap.add_argument("--slow-rate", default="-45%", help="speed of the turtle (slow) word clips, ws_*")
    ap.add_argument("--force", action="store_true", help="re-record clips that already exist")
    ap.add_argument("--list", action="store_true", help="list English voices and exit")
    a = ap.parse_args()

    if a.list:
        for v in await edge_tts.list_voices():
            if v["Locale"].startswith("en-"):
                print(f'{v["ShortName"]:32} {v["Gender"]:7} {v["Locale"]}')
        return

    phrases = json.load(open(PHRASES, encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    print(f"Recording {len(phrases)} clips with {a.voice}...")
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*[record(k, t, a.voice, a.slow_rate if k.startswith("ws_") else a.rate, a.force, sem)
                                     for k, t in phrases.items()])
    done = sorted(k for k, ok in results if ok)
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(done, f)
    print(f"Done: {len(done)} of {len(phrases)} clips are ready.")


asyncio.run(main())
