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


# Microsoft refusing every clip (403) means edge-tts is out of date or the PC clock is wrong:
# stop after a few instead of trying (and printing) hundreds.
REFUSED = {"n": 0, "ok": 0, "stop": False}


def short(e):
    m = str(e).split(", url=")[0]          # the URL is long and says nothing useful
    return m if len(m) < 120 else m[:117] + "..."


async def record(key, text, voice, rate, force, sem):
    path = os.path.join(OUT, key + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 0 and not force:
        return key, True
    async with sem:
        for attempt in range(3):
            if REFUSED["stop"]:
                return key, False
            try:
                await edge_tts.Communicate(text, voice, rate=rate).save(path)
                REFUSED["ok"] += 1
                return key, True
            except Exception as e:
                if "403" in str(e):
                    REFUSED["n"] += 1
                    if REFUSED["n"] >= 8 and REFUSED["ok"] == 0:
                        REFUSED["stop"] = True
                        return key, False
                if attempt == 2:
                    print(f"  failed: {key} ({short(e)})")
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
    if REFUSED["stop"]:
        print()
        print("Microsoft's voice service refused to record (error 403). Two usual reasons:")
        print("  1. edge-tts is out of date. Run:  python -m pip install --upgrade edge-tts")
        print("  2. The PC's clock is wrong. Check the date and time (Settings > Time > Set time automatically).")
        print("Then run this again; clips already recorded are kept.")
        sys.exit(1)
    if len(done) < len(phrases):
        print(f"{len(phrases) - len(done)} clips failed; run this again later to record them (the rest are kept).")


asyncio.run(main())
