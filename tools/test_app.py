"""End-to-end tests: build the app, then use it in a real browser like a student would.

    pip install playwright            (once)
    python -m playwright install chromium     (once; or use an installed Edge/Chrome, see below)
    python tools/test_app.py

Checks both builds: site/index.html (every course inside the page) and pwa/ (served over http: data loaded on
demand, service worker, offline). Exits with 1 if anything fails. GitHub runs it on every pull request.
Browser: Playwright's Chromium; set CUSP_BROWSER=msedge or CUSP_BROWSER=chrome to use an installed browser.
"""
import functools
import http.server
import json
import os
import pathlib
import re
import socketserver
import subprocess
import sys
import threading

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parent.parent
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Playwright is missing: pip install playwright && python -m playwright install chromium")

FAILS, PASSES = [], []


def check(name, ok, detail=""):
    (PASSES if ok else FAILS).append(name)
    print(("  ok    " if ok else "  FAIL  ") + name + ("" if ok else f"   ({detail})"))


def expected_nodes(cid):
    """Stops on the map, counted from lessons.txt: lessons + one checkpoint per unit (+ a placeholder for "soon")."""
    n, unit = 0, None
    for line in (ROOT / "courses" / cid / "lessons.txt").read_text(encoding="utf-8").split("\n"):
        if line.startswith("## "):
            if unit: n += unit["n"] + (1 if unit["core"] else 0)
            soon = " soon" in line.split("|", 2)[-1] if "|" in line else False
            unit = {"n": 1 if "| soon" in line else 0, "core": False, "soon": "| soon" in line}
        elif line.startswith("### ") and unit and not unit["soon"]:
            unit["n"] += 1
            if "| bonus" not in line: unit["core"] = True
    if unit: n += unit["n"] + (1 if unit["core"] else 0)
    return n


def courses():
    out = []
    for d in sorted((ROOT / "courses").iterdir()):
        if d.is_dir() and (d / "course.json").exists():
            meta = json.loads((d / "course.json").read_text(encoding="utf-8"))
            out.append((meta.get("order", 100), d.name, meta))
    return [(cid, m) for _, cid, m in sorted(out)]


def launch(p):
    ch = os.environ.get("CUSP_BROWSER")
    if ch: return p.chromium.launch(channel=ch, headless=True)
    try: return p.chromium.launch(headless=True)
    except Exception:
        for ch in ("msedge", "chrome"):
            try: return p.chromium.launch(channel=ch, headless=True)
            except Exception: pass
        raise


def serve(folder):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(folder)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"


SOLVE_ITEM = """() => { var i = CUSP.debugItem(); if (!i) return null;
  return { kind: i.kind, answer: i.answer || "", opts: (i.options || []).map(function (o) { return { h: o.html, ok: o.ok }; }) }; }"""


def solve_lesson(pg):
    """Answer everything correctly, using the answers the player holds; return the number of steps."""
    for step in range(80):
        if pg.locator("#lesson").is_hidden():
            return step
        if pg.locator("#lessonBody .done-screen").count():
            pg.click("#primary"); pg.wait_for_timeout(150); return step
        it = pg.evaluate(SOLVE_ITEM)
        if not it: return -1
        k = it["kind"]
        if k == "learn":
            pg.click("#primary"); pg.wait_for_timeout(50); continue
        if k in ("mc", "multi"):
            bs = pg.locator("#lessonBody .options .opt")
            for i in range(bs.count()):
                if pg.evaluate("(b) => b._opt.ok", bs.nth(i).element_handle()): bs.nth(i).click()
        elif k == "tf":
            ok = pg.evaluate("() => CUSP.L()[CUSP.debugItem().answer === 'true' ? 'tTrue' : 'tFalse']")
            pg.locator("#lessonBody .options .opt", has_text=ok).first.click()
        elif k in ("order", "build"):
            for o in [o for o in it["opts"] if o["ok"]]:
                tiles = pg.locator("#lessonBody .tiles-bank .tile:not(.used)")
                for i in range(tiles.count()):
                    if pg.evaluate("(b) => b._opt.html", tiles.nth(i).element_handle()) == o["h"]:
                        tiles.nth(i).click(); break
        else:
            pg.fill("#lessonBody input.answer-in", it["answer"].split(";")[0].strip() if k == "input" else it["answer"])
        pg.wait_for_timeout(40)
        pg.click("#primary"); pg.wait_for_timeout(60)
        if pg.locator("#lessonBody .q-label.counter").count() and pg.locator("#fb").is_hidden():
            bs = pg.locator("#lessonBody .options").last.locator(".opt")
            for i in range(bs.count()):
                if pg.evaluate("(b) => b._opt.ok", bs.nth(i).element_handle()): bs.nth(i).click(); break
            pg.click("#primary"); pg.wait_for_timeout(60)
        if pg.locator("#fb .muted").count():
            return -2                                     # a "correct" answer was judged wrong
        pg.click("#primary"); pg.wait_for_timeout(60)
    return -3


def new_page(b, errors, **kw):
    pg = b.new_page(viewport={"width": 420, "height": 860}, **kw)
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text[:200]}") if m.type == "error" else None)
    return pg


def test_site(b, url, cs):
    print("site/ (every course inside the page)")
    errors = []
    pg = new_page(b, errors)
    pg.goto(url + "#learn"); pg.wait_for_timeout(2500)
    first = cs[0][0]
    n = pg.locator("#path .node").count()
    check("map shows every lesson and checkpoint", n == expected_nodes(first), f"{n} != {expected_nodes(first)}")
    check("all generators produce questions", pg.evaluate("""() => CUSP.loadAll(CUSP.COURSES).then(function () { var bad = [];
        CUSP.COURSES.forEach(function (c) { (c.units || []).forEach(function (u) { u.lessons.forEach(function (l) { l.items.forEach(function (it) {
          if (it.kind === 'gen' && !CUSP.instantiate(it)) bad.push(it.key); }); }); }); }); return bad.length === 0; })"""))
    check("every question has a stable id", pg.evaluate("""() => CUSP.COURSES.every(function (c) { return Object.keys(c.byKey || {}).every(function (k) { return k.indexOf(':q:') > 0; }); })"""))

    # map: drag does not tap, tap shows the card
    card0 = pg.inner_text(".hud-card .fc-t")
    bb = pg.locator("#path .node").nth(1).bounding_box()
    t0 = pg.evaluate("document.querySelector('.sp-world').style.transform")
    pg.mouse.move(bb["x"] + 20, bb["y"] + 20); pg.mouse.down(); pg.mouse.move(bb["x"] - 60, bb["y"] + 90, steps=8); pg.mouse.up()
    pg.wait_for_timeout(200)
    check("dragging moves the map", pg.evaluate("document.querySelector('.sp-world').style.transform") != t0)
    check("dragging over a node does not select it", pg.inner_text(".hud-card .fc-t") == card0)
    pg.locator("#path .node").nth(1).click(); pg.wait_for_timeout(700)
    check("tapping a locked node shows its card without a start button", pg.locator(".hud-card .fc-go").count() == 0)

    # play the first lesson correctly
    pg.click('.hud-btn[data-t="here"]'); pg.wait_for_timeout(800)
    pg.click(".hud-card .fc-go"); pg.wait_for_timeout(300)
    steps = solve_lesson(pg)
    check("first lesson can be played through with correct answers", steps > 0, f"solver returned {steps}")
    pg.wait_for_timeout(1200)
    check("finished lesson is marked done on the map", pg.locator("#path .node.done").count() == 1)
    check("the next lesson becomes the current one", pg.locator("#path .node.current").count() == 1)
    check("progress is saved under stable ids", pg.evaluate("Object.keys(CUSP.P.done).every(function (k) { return k.indexOf(':l:') > 0 || k.indexOf(':u:') > 0; })"))

    # backup and restore
    ok = pg.evaluate("""() => { var b = CUSP.backup(); var keys = Object.keys(CUSP.P.done);
        keys.forEach(function (k) { delete CUSP.P.done[k]; }); CUSP.save();
        var restored = CUSP.restore(JSON.parse(JSON.stringify(b)));
        return restored && keys.every(function (k) { return CUSP.P.done[k]; }) && !CUSP.restore({ nope: 1 }); }""")
    check("backup restores progress, and junk is refused", ok)

    # feed
    pg.click('.tab[data-view="feed"]'); pg.wait_for_timeout(1500)
    for _ in range(6): pg.mouse.wheel(0, 4000); pg.wait_for_timeout(120)
    ids = pg.eval_on_selector_all("#feedList .post", "ns => ns.map(n => n.dataset.id)")
    check("feed shows posts", len(ids) > 20, f"{len(ids)} posts")
    check("feed mixes every course", all(any(i.startswith(cid + ":") for i in ids) for cid, _ in cs), str({cid: sum(i.startswith(cid + ':') for i in ids) for cid, _ in cs}))
    theory = sum(1 for i in ids if ":post:" in i or ":c:" in i) / max(1, len(ids))
    check("feed is mostly theory", 0.5 < theory < 0.9, f"{theory:.2f}")
    q = pg.locator("#feedList .post-q:has(.fq-options)").first
    if q.count():
        q.scroll_into_view_if_needed()
        key = q.get_attribute("data-id")
        q.locator(".fq-options .opt").first.click(); pg.wait_for_timeout(200)
        if q.locator(".fq-btn").count(): q.locator(".fq-btn").click(); pg.wait_for_timeout(200)
        if q.locator(".q-label.counter").count(): q.locator(".fq-options").last.locator(".opt").first.click(); pg.wait_for_timeout(200)
        check("a question can be answered inside the feed", q.locator(".fq-fb").count() == 1)
        check("an answer in the feed updates spaced repetition", pg.evaluate(f"!!CUSP.P.srs['{key}']"))
    else:
        check("a question can be answered inside the feed", False, "no inline question rendered")
    first_id = ids[0]
    pg.locator(f'#feedList .post[data-id="{first_id}"] .pa-btn.save').click()
    pg.locator("#feedChips .chip").last.click(); pg.wait_for_timeout(300)
    check("saved posts are listed", pg.eval_on_selector_all("#feedList .post", "ns => ns.map(n => n.dataset.id)") == [first_id])
    if len(cs) > 1:
        pg.locator("#feedChips .chip").nth(2).click(); pg.wait_for_timeout(500)
        only = pg.eval_on_selector_all("#feedList .post", "ns => ns.map(n => n.dataset.id)")
        check("course filter shows only that course", only and all(i.startswith(cs[1][0] + ":") for i in only))
    pg.locator("#feedChips .chip").nth(1).click(); pg.wait_for_timeout(500)
    for _ in range(8):
        if pg.locator("#feedList .pa-guide").count(): break
        pg.mouse.wheel(0, 4000); pg.wait_for_timeout(100)
    if pg.locator("#feedList .pa-guide").count():
        g = pg.locator("#feedList .pa-guide").first; g.scroll_into_view_if_needed(); g.click(); pg.wait_for_timeout(300)
        check("the guide opens from the feed", not pg.locator("#guide").is_hidden())
        pg.click("#guideClose")

    # other course on the map
    if len(cs) > 1:
        pg.click('.tab[data-view="learn"]'); pg.wait_for_timeout(300)
        pg.click("#courseBtn"); pg.wait_for_timeout(200)
        pg.locator("#courseList .course-opt").nth(1).click(); pg.wait_for_timeout(1500)
        n2 = pg.locator("#path .node").count()
        check(f"course switch shows {cs[1][0]}", n2 == expected_nodes(cs[1][0]), f"{n2} != {expected_nodes(cs[1][0])}")
    check("no errors in the page", not errors, "; ".join(errors[:3]))
    pg.close()


def test_migration(b, url, cs):
    print("old progress (positional keys) is moved to the stable ids")
    cid = next((c for c, _ in cs if (ROOT / "courses" / c / "legacy-ids.json").exists()), None)
    if not cid:
        print("  (no course has legacy-ids.json)"); return
    legacy = json.loads((ROOT / "courses" / cid / "legacy-ids.json").read_text(encoding="utf-8"))
    errors = []
    pg = new_page(b, errors)
    pg.goto(url + "#learn"); pg.wait_for_timeout(300)
    old_l, old_q = f"{cid}-u1-l1", f"{cid}-u1-l1-q1"
    pg.evaluate(f"""() => {{ localStorage.clear();
        localStorage.setItem('lemma.learn', JSON.stringify({{ done: {{ '{old_l}': true }}, srs: {{ '{old_q}': [3, 99999] }}, mistakes: {{}}, xp: 10, streak: 1, last: null }}));
        localStorage.setItem('lemma.course', '{cid}'); }}""")
    pg.reload(); pg.wait_for_timeout(2000)
    P = pg.evaluate("CUSP.P")
    check("done lesson moved", P["done"].get(legacy[old_l]) is True and old_l not in P["done"])
    check("spaced repetition moved", P["srs"].get(legacy[old_q]) == [3, 99999] and old_q not in P["srs"])
    check("the map shows the migrated lesson as done", pg.locator("#path .node.done").count() == 1)
    check("no errors in the page", not errors, "; ".join(errors[:3]))
    pg.close()


def test_pwa(b, cs):
    print("pwa/ (installable app over http)")
    srv, url = serve(ROOT / "pwa")
    errors = []
    ctx = b.new_context(viewport={"width": 420, "height": 860})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.goto(url + "#learn"); pg.wait_for_timeout(2500)
    first = cs[0][0]
    check("course data is a separate file", pg.evaluate("!document.getElementById('data-" + first + "')"))
    check("map loads its course on demand", pg.locator("#path .node").count() == expected_nodes(first))
    pg.click('.tab[data-view="feed"]'); pg.wait_for_timeout(2500)
    check("feed loads every course", pg.evaluate("CUSP.COURSES.every(function (c) { return !!c.units; })"))
    check("service worker is active", pg.evaluate("navigator.serviceWorker.ready.then(function (r) { return !!r.active; })"))
    pg.wait_for_timeout(1500)
    ctx.set_offline(True)
    pg.goto(url + "#learn"); pg.wait_for_timeout(2500)
    check("works offline", pg.locator("#path .node").count() == expected_nodes(first))
    check("no errors in the page", not errors, "; ".join(errors[:3]))
    ctx.close(); srv.shutdown()


def main():
    r = subprocess.run([sys.executable, str(ROOT / "build.py")], capture_output=True, text=True, encoding="utf-8")
    print(r.stdout.strip())
    if r.returncode:
        print(r.stderr); sys.exit("build failed")
    cs = courses()
    with sync_playwright() as p:
        b = launch(p)
        site = (ROOT / "site" / "index.html").as_uri()
        test_site(b, site, cs)
        test_migration(b, site, cs)
        test_pwa(b, cs)
        b.close()
    print(f"\n{len(PASSES)} passed, {len(FAILS)} failed")
    if FAILS:
        print("failed: " + "; ".join(FAILS))
        sys.exit(1)


if __name__ == "__main__":
    main()
