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
import time

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


DELAY = {"page": 0}       # seconds the test server waits before sending the page (a slow network)


def serve(folder):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def do_GET(self):
            if DELAY["page"] and self.path.split("?")[0].split("#")[0] in ("/", "/index.html"):
                time.sleep(DELAY["page"])
            super().do_GET()
    class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
        daemon_threads = True
    srv = Server(("127.0.0.1", 0), functools.partial(Quiet, directory=str(folder)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"


SOLVE_ITEM = """() => { var i = CUSP.debugItem(); if (!i) return null;
  return { kind: i.kind, answer: i.answer || "", opts: (i.options || []).map(function (o) { return { h: o.html, ok: o.ok }; }) }; }"""


# Every question's own answer must be accepted by the checker that will judge the students: a typo in an answer,
# a formula undefined on its sample range or a generator that sometimes produces nonsense makes a question
# impossible to answer. Generators are run 200 times each. Returns a list of "key: problem".
SELF_CHECK = """() => CUSP.loadAll(CUSP.COURSES).then(function () {
  var A = window.CUSP_ANS, bad = [];
  function problem(q) {
    var r;
    try {
      if (q.kind === 'expr') r = A.checkExpr(q.answer, A.exprSpec(q));
      else if (q.kind === 'interval') r = A.checkInterval(q.answer, q.answer);
      else if (q.kind === 'set') r = A.checkSet(q.answer, q.answer);
      else if (q.kind === 'input') {        // alternatives are spellings of one answer: "1/2; 0.5"
        var alts = q.answer.split(';').map(function (a) { return a.trim(); });
        r = { ok: alts.every(function (a) { return CUSP.inputCorrect(a, alts[0]); }), error: 'the alternatives in "' + q.answer + '" are not the same answer' };
      }
      else if (q.kind === 'match') r = { ok: (q.options || []).filter(function (o) { return o.ok && o.left && o.right; }).length >= 2,
                                         error: 'needs at least two complete pairs ("+ left :: right")' };
      else if (q.kind === 'mc') r = { ok: (q.options || []).length >= 2 && q.options.filter(function (o) { return o.ok; }).length === 1,
                                      error: 'needs 2+ distinct options and exactly one correct' };
      else r = { ok: true };
    } catch (e) { r = { broken: 'throws ' + e }; }
    return r.ok ? null : (r.broken || r.error || 'its own answer "' + q.answer + '" is judged wrong');
  }
  CUSP.COURSES.forEach(function (c) { c.units.forEach(function (u) { u.lessons.forEach(function (l) { l.items.forEach(function (it) {
    if (!it.key) return;
    if (it.kind !== 'gen') { var p = problem(it); if (p) bad.push(it.key + ': ' + p); return; }
    for (var i = 0; i < 200; i++) {
      var q = CUSP.instantiate(it);
      if (!q) { bad.push(it.key + ' (' + it.answer + '): the generator fails'); return; }
      var text = q.html + ' ' + (q.options || []).map(function (o) { return o.html; }).join(' ') + ' ' + (q.answer || '') + ' ' + (q.explain || '');
      var m = /undefined|NaN/.exec(text);
      var pr = m ? 'the text contains "' + m[0] + '"' : problem(q);
      if (pr) { bad.push(it.key + ' (' + it.answer + '): ' + pr + ', e.g. answer "' + q.answer + '"'); return; }
    }
  }); }); }); });
  return bad;
})"""


# ? match: pair every left item with its own right item (wrong=True: shift them all by one, so every pair is wrong)
MATCH = """(wrong) => { var L = Array.from(document.querySelectorAll('#lessonBody .m-left')), R = Array.from(document.querySelectorAll('#lessonBody .m-right'));
  var rs = L.map(function (l) { return R.filter(function (r) { return r._opt === l._opt; })[0]; });
  if (wrong) rs.push(rs.shift());
  L.forEach(function (l, i) { l.click(); rs[i].click(); }); }"""


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
        elif k == "match":
            pg.evaluate(MATCH, False)
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


def fail_lesson(pg):
    """Answer wrongly until the lives run out; return the number of hearts lost (or a negative error)."""
    lost = 0
    for _ in range(60):
        if pg.locator("#lessonBody .out-screen").count():
            return lost
        it = pg.evaluate(SOLVE_ITEM)
        if not it: return -1
        k = it["kind"]
        if k == "learn":
            pg.click("#primary"); pg.wait_for_timeout(50); continue
        if k in ("mc", "multi", "tf"):
            bs = pg.locator("#lessonBody .options .opt")
            wrong = [i for i in range(bs.count()) if not pg.evaluate("(b) => b._opt.ok", bs.nth(i).element_handle())]
            for i in (wrong[:1] if wrong else [0]): bs.nth(i).click()
        elif k in ("order", "build"):
            for o in reversed([o for o in it["opts"] if o["ok"]]):
                tiles = pg.locator("#lessonBody .tiles-bank .tile:not(.used)")
                for i in range(tiles.count()):
                    if pg.evaluate("(b) => b._opt.html", tiles.nth(i).element_handle()) == o["h"]:
                        tiles.nth(i).click(); break
        elif k == "match":
            pg.evaluate(MATCH, True)
        else:
            pg.fill("#lessonBody input.answer-in", {"interval": "(987654, 987655)", "set": "{987654}"}.get(k, "987654"))
        pg.wait_for_timeout(40)
        if pg.is_disabled("#primary"): return -2
        before = pg.locator("#lessonHearts svg:not(.lost)").count()
        pg.click("#primary"); pg.wait_for_timeout(60)
        if pg.locator("#lessonBody .q-label.counter").count() and pg.locator("#fb").is_hidden():
            pg.locator("#lessonBody .options").last.locator(".opt").first.click()
            pg.click("#primary"); pg.wait_for_timeout(60)
        lost += before - pg.locator("#lessonHearts svg:not(.lost)").count()
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
    bad = pg.evaluate(SELF_CHECK)
    check("every answer is accepted by its own checker (generators: 200 runs each)", not bad, "; ".join(bad[:5]) + (f" (and {len(bad) - 5} more)" if len(bad) > 5 else ""))
    check("every question has a stable id", pg.evaluate("""() => CUSP.COURSES.every(function (c) { return Object.keys(c.byKey || {}).every(function (k) { return k.indexOf(':q:') > 0; }); })"""))
    # every figure of every course draws without an error (cards, prompts, explanations, figure options)
    bad = pg.evaluate("""() => { var box = document.createElement('div'), out = [], n = 0; document.body.appendChild(box);
        CUSP.COURSES.forEach(function (c) {
          var specs = [];          // "@@"/"@" lines are kept as figQ / figA, a figure option is an option "@ spec"
          (c.units || []).forEach(function (u) { u.lessons.forEach(function (l) { l.items.forEach(function (it) {
            specs = specs.concat(it.figQ || [], it.figA || []);
            (it.options || []).forEach(function (o) { var t = o.right || o.html || ''; if (/^@ /.test(t)) specs.push(t.slice(2)); });
          }); }); });
          specs.forEach(function (s) {
            box.innerHTML = CUSP_FIG.html(s); CUSP_FIG.renderAll(box); n++;
            var f = box.querySelector('.fig'); if (f.dataset.err || !f.querySelector('svg')) out.push(c.id + ': ' + (f.dataset.err || 'empty') + ' in ' + s.slice(0, 60));
          }); });
        box.remove(); return n ? out : ['no figures found']; }""")
    check("every figure of every course draws without an error", not bad, "; ".join(bad[:3]))
    # the vector primitives: arrows with a head, a segment, a whole line, a filled polygon, a transformed grid
    parts = pg.evaluate("""() => { var box = document.createElement('div'); document.body.appendChild(box);
        box.innerHTML = CUSP_FIG.html('x=-1..3; y=-1..3; aspect=equal; grid=1,1,0,1; fill=0,0,1,0,2,1,1,1,ex; vec=1,0,prf; vec=1,1,2,2,ex; seg=0,0,1,1; line=0,0,1,2,thm');
        CUSP_FIG.renderAll(box); var f = box.querySelector('.fig'), r = { err: f.dataset.err || '', grid: f.querySelectorAll('g line').length,
          fill: f.querySelectorAll('polygon').length, heads: f.querySelectorAll('polyline').length, lines: f.querySelectorAll('svg > line').length,
          green: !!f.querySelector('[style*="--prf"]'), orange: !!f.querySelector('[style*="--thm"]') }; box.remove(); return r; }""")
    check("vec, seg, line, fill and grid draw what they should", not parts["err"] and parts["grid"] >= 8 and parts["fill"] == 1 and parts["heads"] == 2 and parts["green"] and parts["orange"], str(parts))
    # browsers' MathML draws neither the bar of \bar z / \overline{AB} nor the line of an array {cc|c}: core.js draws them
    tex = pg.evaluate(r"""() => { var d = document.createElement('div'); document.body.appendChild(d);
        d.textContent = '$\\bar z$ $\\overline{AB}$ $\\left(\\begin{array}{cc|c} 1 & 2 & 3\\\\ 4 & 5 & 6\\end{array}\\right)$'; CUSP.typeset(d);
        var bars = Array.from(d.querySelectorAll('mrow.math-bar')).map(function (m) { return getComputedStyle(m).borderTopStyle; });
        var lines = Array.from(d.querySelectorAll('mtd')).map(function (c) { return getComputedStyle(c).borderRightStyle; });
        d.remove(); return { bars: bars, lines: lines }; }""")
    check("bars over letters and lines in arrays are drawn", tex["bars"] == ["solid", "solid"] and tex["lines"] == ["none", "solid", "none", "none", "solid", "none"], str(tex))
    # Chromium's roots have a bar that doesn't meet the sign, and its vector arrows sit off to the side: core.js draws both
    tex = pg.evaluate(r"""() => { var d = document.createElement('div'); document.body.appendChild(d);
        d.textContent = '$\\sqrt2$ $\\sqrt[3]{x}$ $\\overrightarrow{AB}$ $\\vec u$'; CUSP.typeset(d);
        var r = { left: d.querySelectorAll('msqrt, mroot').length + d.querySelectorAll('mover').length,
          roots: Array.from(d.querySelectorAll('mspace.math-rad')).map(function (m) { var s = getComputedStyle(m); return s.position + ' ' + (s.maskImage || s.webkitMaskImage).split('url(').length; }),
          arrows: Array.from(d.querySelectorAll('mspace.math-arr')).map(function (m) { return m.getBoundingClientRect().width > 0; }) };
        d.remove(); return r; }""")
    check("roots and vector arrows are drawn by the app", tex["left"] == 0 and tex["roots"] == ["absolute 2", "absolute 2"] and tex["arrows"] == [True, True], str(tex))
    # phones have no font with a MATH table, without which brackets don't stretch: the app brings STIX Two Math
    font = pg.evaluate("""() => document.fonts.load('16px "STIX Two Math"').then(function (f) { return f.length ? f[0].status : 'missing'; })""")
    check("the bundled math font loads", font == "loaded", font)

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
    pg.evaluate("localStorage.setItem('cusp.bk', JSON.stringify({ next: 1 }))")     # remind after this lesson
    pg.click(".hud-card .fc-go"); pg.wait_for_timeout(300)
    href = pg.get_attribute("#lessonBody .report-link", "href") or ""
    check("a lesson item has a 'report a problem' link naming the course and the item", "issues/new?title=" in href and f"%5B{first}%5D" in href, href[:120])
    check("a lesson report says it came from a lesson", "from%3A%20lesson" in href, href[-200:])
    steps = solve_lesson(pg)
    check("first lesson can be played through with correct answers", steps > 0, f"solver returned {steps}")
    pg.wait_for_timeout(1200)
    check("finished lesson is marked done on the map", pg.locator("#path .node.done").count() == 1)
    check("the next lesson becomes the current one", pg.locator("#path .node.current").count() == 1)
    bk = pg.evaluate("[JSON.parse(localStorage.getItem('cusp.bk')).next, CUSP.doneCount()]")
    check("the done screen reminds about a backup, then waits a few lessons", bk[0] == bk[1] + 5, str(bk))
    check("progress is saved under stable ids", pg.evaluate("Object.keys(CUSP.P.done).every(function (k) { return k.indexOf(':l:') > 0 || k.indexOf(':u:') > 0; })"))

    # lives: three wrong answers end the lesson, which then starts again and is not marked done
    pg.click('.hud-btn[data-t="here"]'); pg.wait_for_timeout(800)
    pg.click(".hud-card .fc-go"); pg.wait_for_timeout(300)
    full = pg.locator("#lessonHearts svg:not(.lost)").count()
    check("a lesson starts with 3 lives", full == 3 and pg.locator("#lessonHearts").is_visible(), str(full))
    lost = fail_lesson(pg)
    check("after 3 mistakes the lesson is out of lives", lost == 3, f"lost {lost}")
    pg.click("#primary"); pg.wait_for_timeout(300)
    check("'start again' restarts the lesson with full lives",
          pg.locator("#lessonBody .out-screen").count() == 0 and pg.locator("#lessonHearts svg:not(.lost)").count() == 3 and pg.evaluate("!!CUSP.debugItem()"))
    pg.click("#lessonClose"); pg.wait_for_timeout(500)
    check("a lesson that ran out of lives is not marked done", pg.locator("#path .node.done").count() == 1)
    pg.evaluate("() => { Object.keys(CUSP.P.srs).forEach(function (k) { CUSP.P.srs[k][1] = 0; }); CUSP.startSession({ review: true }); }")
    pg.wait_for_timeout(200)
    check("the daily review has no lives", pg.evaluate("!!CUSP.debugItem()") and pg.locator("#lessonHearts").is_hidden())
    # "I know this" on a review question puts it away for a long time, without an answer
    key = pg.evaluate("CUSP.debugItem().key")
    know = pg.evaluate("CUSP.L().knowIt")
    shown = pg.is_visible("#secondary") and pg.inner_text("#secondary").strip().lower() == know.lower()
    pg.click("#secondary"); pg.wait_for_timeout(200)
    check("'I know this' on a review question moves it to the last box", shown and pg.evaluate(f"CUSP.P.srs['{key}'][0]") == 5,
          f"shown={shown} srs={pg.evaluate(f'CUSP.P.srs[{key!r}]')}")
    pg.click("#lessonClose"); pg.wait_for_timeout(200)
    # "I don't know" on a new question shows the solution, costs a life and asks it again at the end
    key = pg.evaluate("() => { var c = CUSP.course(); return Object.keys(c.byKey).filter(function (k) { return c.byKey[k].kind === 'mc' && !CUSP.P.srs[k]; })[0]; }")
    pg.evaluate(f"CUSP.startSession({{ keys: ['{key}'] }})"); pg.wait_for_timeout(200)
    dont = pg.evaluate("CUSP.L().dontKnow")
    shown = pg.is_visible("#secondary") and pg.inner_text("#secondary").strip().lower() == dont.lower()
    pg.click("#secondary"); pg.wait_for_timeout(200)
    gave = pg.is_visible("#fb") and pg.locator("#lessonBody .opt.right").count() >= 1 and pg.locator("#lessonHearts svg:not(.lost)").count() == 2
    pg.click("#primary"); pg.wait_for_timeout(200)
    check("'I don't know' shows the answer, costs a life and asks again", shown and gave and pg.evaluate("CUSP.debugItem().key") == key,
          f"shown={shown} gave={gave}")
    pg.click("#lessonClose"); pg.wait_for_timeout(200)

    # a finished lesson with questions not answered yet: "+N" on its node, a satellite node, a session that asks them
    info = pg.evaluate("""() => { var c = CUSP.course(), node = null;
      c.units.forEach(function (u) { u.nodes.forEach(function (n) { if (!node && n.lesson && n.lesson.items.filter(function (it) { return it.key; }).length >= 4) node = n; }); });
      if (!node) return null;
      var keys = node.lesson.items.filter(function (it) { return it.key; }).map(function (it) { return it.key; });
      keys.forEach(function (k, i) { if (i < 3) delete CUSP.P.srs[k]; else CUSP.P.srs[k] = [2, 99999]; });
      CUSP.P.done[node.id] = true; CUSP.save(); CUSP.emit('progress');
      return { id: node.id, fresh: keys.slice(0, 3) }; }""")
    if info:
        pg.wait_for_timeout(400)
        dot = pg.locator(f'.space .node[data-id="{info["id"]}"] .ndot').count() == 1
        pg.evaluate(f"""document.querySelector('.space .node[data-id="{info["id"]}"]').click()"""); pg.wait_for_timeout(300)
        sat = pg.locator(".sp-sat .nnew").inner_text() if pg.locator(".sp-sat .nnew").count() == 1 else ""
        check("a finished lesson with unanswered questions has a dot, and a satellite node with '+N'", dot and sat == "+3", f"dot={dot} sat={sat!r}")
        pg.evaluate("document.querySelector('.sp-sat button').click()"); pg.wait_for_timeout(300)
        pg.click(".hud-card .fc-go"); pg.wait_for_timeout(300)
        solve_lesson(pg)
        check("the new-questions session asks every question not answered yet", pg.evaluate(f"{info['fresh']!r}.every(function (k) {{ return !!CUSP.P.srs[k]; }})"))
        pg.wait_for_timeout(300)
        check("with them answered, the badge and the satellite are gone",
              pg.locator(f'.space .node[data-id="{info["id"]}"] .ndot').count() == 0 and pg.locator(".sp-sat").count() == 0)

    # backup and restore
    ok = pg.evaluate("""() => { var b = CUSP.backup(); var keys = Object.keys(CUSP.P.done);
        keys.forEach(function (k) { delete CUSP.P.done[k]; }); CUSP.save();
        var restored = CUSP.restore(JSON.parse(JSON.stringify(b)));
        return restored && keys.every(function (k) { return CUSP.P.done[k]; }) && !CUSP.restore({ nope: 1 }); }""")
    check("backup restores progress, and junk is refused", ok)

    # the backup constellation on the map: its card saves a file (a download on a computer)
    check("the map has the backup constellation", pg.locator("#path .sp-const .const-btn").count() == 1)
    pg.evaluate("document.querySelector('#path .sp-const .const-btn').click()"); pg.wait_for_timeout(300)
    check("tapping it shows the backup card", pg.locator(".hud-card .fc-bk .backup .admin-btn").count() >= 2)
    try:
        with pg.expect_download(timeout=3000) as dl:
            pg.locator(".hud-card .fc-bk .backup .admin-btn").first.click()
        name = dl.value.suggested_filename
    except Exception as e:
        name = "no download: " + str(e).splitlines()[0]
    check("'Zálohovat' downloads the backup on a computer", name.startswith("cusp-") and name.endswith(".json"), name)
    check("the constellation shows the new backup date", pg.text_content("#path .sp-const .const-s") == pg.text_content(".hud-card .bk-last"))

    # typed answers: messages in the course's language; a broken question is skipped, not a dead end
    pg.evaluate("""() => CUSP.answer({ kind: 'expr', answer: 'x^2', flags: [], html: '<p>t</p>', key: 'test:q:ok', cid: 'test' })""")
    pg.fill("#lessonBody input.answer-in", "x$"); pg.click("#primary"); pg.wait_for_timeout(100)
    msg = pg.inner_text("#lessonBody .in-error") if pg.locator("#lessonBody .in-error").count() else ""
    want = pg.evaluate("CUSP.L().ans.char.replace('{x}', '$')")
    check("an unreadable answer is explained in the course's language", msg == want, f"{msg!r} != {want!r}")
    pg.click("#lessonClose")
    pg.evaluate("""() => CUSP.answer({ kind: 'expr', answer: 'x^', flags: [], html: '<p>t</p>', key: 'test:q:broken', cid: 'test' })""")
    pg.fill("#lessonBody input.answer-in", "x"); pg.click("#primary"); pg.wait_for_timeout(100)
    check("a question whose own answer is broken can be skipped and reported",
          pg.locator("#fb .report-link").count() == 1 and not pg.is_disabled("#primary") and not pg.evaluate("!!CUSP.P.srs['test:q:broken']"))
    pg.click("#primary"); pg.wait_for_timeout(100)
    errors[:] = [e for e in errors if "can't be checked" not in e]      # that console.error was expected

    # ? match: pair by tapping, undo by tapping again, all pairs needed; a wrong pairing shows what belongs where
    started = pg.evaluate("""() => { var hit = null; CUSP.COURSES.forEach(function (c) { (c.units || []).forEach(function (u) { u.lessons.forEach(function (l) {
        l.items.forEach(function (it) { if (!hit && it.kind === 'match') hit = it; }); }); }); });
      if (hit) CUSP.startSession({ items: [hit], feed: true }); return !!hit; }""")
    if started:
        pg.wait_for_timeout(300)
        n = pg.locator("#lessonBody .m-left").count()
        pg.locator("#lessonBody .m-left").first.click(); pg.locator("#lessonBody .m-right").first.click(); pg.wait_for_timeout(100)
        one = pg.locator("#lessonBody .m-right.m-paired").count() == 1 and pg.is_disabled("#primary")
        pg.locator("#lessonBody .m-right.m-paired").first.click(); pg.wait_for_timeout(100)
        undone = pg.locator("#lessonBody .m-right.m-paired").count() == 0
        pg.evaluate(MATCH, True); pg.wait_for_timeout(100)
        ready = not pg.is_disabled("#primary")
        pg.click("#primary"); pg.wait_for_timeout(300)
        check("match: tap to pair, tap again to undo, check once all are paired", n >= 2 and one and undone and ready, str([n, one, undone, ready]))
        check("match: a wrong pairing is marked and shows what belongs there",
              pg.locator("#lessonFoot[data-state=bad]").count() == 1 and pg.locator("#lessonBody .m-right.wrong .m-should").count() >= 2)
        pg.click("#lessonClose"); pg.wait_for_timeout(200)
        pg.evaluate("""() => { var hit = null; CUSP.COURSES.forEach(function (c) { (c.units || []).forEach(function (u) { u.lessons.forEach(function (l) {
            l.items.forEach(function (it) { if (!hit && it.kind === 'match') hit = it; }); }); }); }); CUSP.startSession({ items: [hit], feed: true }); }""")
        pg.wait_for_timeout(300); pg.evaluate(MATCH, False); pg.click("#primary"); pg.wait_for_timeout(300)
        check("match: the right pairing is accepted", pg.locator("#lessonFoot[data-state=good]").count() == 1)
        pg.click("#primary"); pg.wait_for_timeout(200)
    else:
        check("match: a course has a ? match question to test", False)

    # ? build: "B a A" counts as "A a B", but the two sides of an implication may not be swapped
    r = pg.evaluate(r"""() => { var c = CUSP.canonBuild;
        return [c(['$x\\le y$', 'a', '$y\\le x$', '$\\Rightarrow$', '$x=y$']) === c(['$y\\le x$', 'a', '$x\\le y$', '$\\Rightarrow$', '$x=y$']),
                c(['$x=y$', '$\\Rightarrow$', '$x\\le y$']) !== c(['$x\\le y$', '$\\Rightarrow$', '$x=y$']),
                c(['A', 'a', 'B', 'nebo', 'C']) !== c(['B', 'a', 'A', 'nebo', 'C'])]; }""")
    check("build: the parts joined by 'a' may come in either order, an implication may not be turned round", all(r), str(r))
    if pg.evaluate("!!CUSP.courseById('calc1') && !!CUSP.courseById('calc1').byKey && !!CUSP.courseById('calc1').byKey['calc1:q:vj3bg']"):
        pg.evaluate("() => CUSP.startSession({ items: [CUSP.courseById('calc1').byKey['calc1:q:vj3bg']], feed: true })"); pg.wait_for_timeout(300)
        pg.evaluate(r"""() => { var want = ['$y\\le x$', 'a', '$x\\le y$', '$\\Rightarrow$', '$x=y$'];
            want.forEach(function (h) { var t = Array.from(document.querySelectorAll('#lessonBody .tiles-bank .tile:not(.used)')).filter(function (b) { return b._opt.html === h; })[0]; t.click(); }); }""")
        pg.click("#primary"); pg.wait_for_timeout(250)
        check("build: the antisymmetry definition is accepted with 'y ≤ x a x ≤ y'", pg.locator("#lessonFoot[data-state=good]").count() == 1)
        pg.click("#primary"); pg.wait_for_timeout(150)

    # how typed answers are judged: exact numbers but rounding allowed, decimal commas, joined intervals, ∞
    r = pg.evaluate("""() => { var A = window.CUSP_ANS, I = CUSP.inputCorrect;
      return [I('1210', '1210'), !I('1209', '1210'), !I('0', '0.001'), !I('0.00', '0.001'), I('3.14', 'π'), I('3,14', 'π'),
              !I('3.1', 'π'), !I('2.26', '2.25'), I('3.14159', 'π; 3.1416'), I('1.1052', '1.105'), I('x = 2', '2'),
              A.checkSet('{0,5}', '{1/2}').ok, A.checkSet('{1,2,3}', '{1; 2; 3}').ok, A.checkSet('{2, 5}', '{2; 5}').ok,
              A.checkInterval('(0;1] ∪ (1;2)', '(0;2)').ok, !A.checkInterval('(0;1) ∪ (1;2)', '(0;2)').ok,
              A.checkInterval('[0;2] ∪ (1;3)', '[0;3)').ok, A.checkInterval('(-∞; 0] ∪ [0; 1)', '(-∞; 1)').ok,
              !A.checkInterval('(0; 5)', '(0; ∞)').ok, !A.checkSet('{1; 1000000}', '{1; ∞}').ok,
              A.checkInterval('[0; pi]', '[0; π]').ok, A.checkInterval('[0; 3.14]', '[0; π]').ok, A.checkInterval('[0; 3,14]', '[0; π]').ok,
              !A.checkInterval('[0; 3.1]', '[0; π]').ok, !A.checkInterval('[0; 3]', '[0; π]').ok,
              A.checkSet('{0; 3.14}', '{0; π}').ok, !A.checkSet('{0; 3}', '{0; π}').ok, !A.checkInterval('[0; 0.00]', '[0; 0.001]').ok]; }""")
    check("numbers, sets and intervals are judged correctly", all(r), "cases failing: " + str([i for i, x in enumerate(r) if not x]))

    # typesetting: a sign minus is not spaced like a subtraction; a list of formulas too wide for a phone breaks into lines
    r = pg.evaluate(r"""(t) => { function signs(tex) { var d = document.createElement('div'); d.textContent = '$' + tex + '$'; document.body.appendChild(d);
          CUSP.typeset(d); var f = Array.prototype.map.call(d.querySelectorAll('mo'), function (m) { return m.textContent === '−' ? (m.getAttribute('form') || 'infix') : null; }).filter(Boolean); d.remove(); return f.join(','); }
        function fit(tex) { var w = document.createElement('div'); w.style.width = '300px'; w.textContent = '$$' + tex + '$$'; document.body.appendChild(w); CUSP.typeset(w);
          var r = [w.querySelectorAll('mtable mtr').length, !w.querySelector('.wide')]; w.remove(); return r; }
        var p = document.createElement('p'); p.textContent = 'Leží v $\\mathbb R$ a k tomu i s nulou.'; document.body.appendChild(p); CUSP.typeset(p);
        var tied = p.textContent.indexOf('v ') >= 0 && p.textContent.indexOf('a k tomu') >= 0 && p.textContent.indexOf('i s nulou') >= 0; p.remove();
        return [signs('(1+(-1)^n)'), signs('x - 1'), signs('|-x| - 1'), signs('r \\ne -1'), fit(t[0]), fit(t[1]), fit(t[2]), tied]; }""",
        [r"\int x^r dx = \frac{x^{r+1}}{r+1},\quad \int\frac{dx}{x} = \ln|x|,\quad\int e^x dx = e^x,\quad \int\frac{dx}{1+x^2} = \operatorname{arctg}x",
         r"x^2 - 5x + 6 = (x-2)(x-3) = 0 \;\Rightarrow\; x = 2 \text{ nebo } x = 3",
         r"f'(x_0) = \lim_{x\to x_0}\frac{f(x)-f(x_0)}{x-x_0} = \lim_{h\to0}\frac{f(x_0+h)-f(x_0)}{h}"])
    check("a sign minus is set as a sign, a subtraction as a subtraction", r[:4] == ["prefix", "infix", "prefix,infix", "prefix"], str(r[:4]))
    check("formulas too wide for a phone break into lines: between formulas, before ⇒, before =",
          all(n >= 2 and ok for n, ok in r[4:7]), str(r[4:7]))
    check("a one-letter word (v, a, k, i, s) never ends a line", r[7])

    # "+C": the answer may differ by a constant, but not be a constant; Czech plurals
    r = pg.evaluate("""() => { var A = window.CUSP_ANS, sp = A.exprSpec({ answer: 'x^3/3', flags: ['+C'] }), f = CUSP.fmt, w = '{n|den|dny|dní}';
      return [A.checkExpr('x^3/3 + 1000', sp).ok, A.checkExpr('x^3/3 + C', sp).ok, !A.checkExpr('987654', sp).ok, !A.checkExpr('x^3', sp).ok,
              f(w, { n: 1 }) === 'den', f(w, { n: 3 }) === 'dny', f(w, { n: 0 }) === 'dní', f(w, { n: 12 }) === 'dní',
              f('{n} {n|lesson|lessons}', { n: 1 }) === '1 lesson', f('{n} {n|lesson|lessons}', { n: 2 }) === '2 lessons']; }""")
    check("antiderivatives: any constant may be added, but a constant alone is wrong", all(r[:4]), str(r[:4]))
    check("counts take the right plural form", all(r[4:]), str(r[4:]))

    # a question from another course (as the feed plays them) reports to that course; Back closes the player
    if len(cs) > 1:
        other = cs[1][0]
        pg.evaluate(f"() => CUSP.answer({{ kind: 'input', answer: '2', flags: [], html: '<p>t</p>', key: '{other}:q:t', cid: '{other}' }})")
        pg.fill("#lessonBody input.answer-in", "2"); pg.click("#primary"); pg.wait_for_timeout(100)
        href = pg.get_attribute("#fb .report-link", "href") or ""
        check("a question from another course reports to its own course", f"%5B{other}%5D" in href, href[:80])
        pg.evaluate("history.back()"); pg.wait_for_timeout(300)
        check("Back closes the lesson and stays in the app", pg.locator("#lesson").is_hidden() and pg.evaluate("location.hash") == "#learn")
        pg.evaluate("() => CUSP.answer({ kind: 'input', answer: '2', flags: [], html: '<p>t</p>', key: 'test:q:t', cid: 'test' })")
        pg.click("#lessonClose"); pg.wait_for_timeout(300)
        check("closing a lesson removes its history entry", not pg.evaluate("history.state && history.state.cuspLesson"))

    # the browser refuses to save: say so (once)
    ok = pg.evaluate("""() => { var set = Storage.prototype.setItem;
        Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
        CUSP.P.xp += 1; CUSP.save(); Storage.prototype.setItem = set; CUSP.save();
        return document.getElementById('toast').textContent === CUSP.L().saveFail; }""")
    check("a failed save is reported to the student", ok)

    # feed
    pg.click('.tab[data-view="feed"]'); pg.wait_for_timeout(1500)
    for _ in range(6): pg.mouse.wheel(0, 4000); pg.wait_for_timeout(120)
    ids = pg.eval_on_selector_all("#feedList .post", "ns => ns.map(n => n.dataset.id)")
    check("feed shows posts", len(ids) > 20, f"{len(ids)} posts")
    pub = [cid for cid, m in cs if not m.get("draft")]          # a draft course is in the feed only in admin mode
    check("feed mixes every course", all(any(i.startswith(cid + ":") for i in ids) for cid in pub), str({cid: sum(i.startswith(cid + ':') for i in ids) for cid in pub}))
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
        check("feed posts have a 'report a problem' link", "issues/new" in (q.locator(".pa-report").get_attribute("href") or ""))
        check("a feed report says it came from the feed", "from%3A%20feed" in (q.locator(".pa-report").get_attribute("href") or ""))
        check("an answer in the feed updates spaced repetition", pg.evaluate(f"!!CUSP.P.srs['{key}']"))
    else:
        check("a question can be answered inside the feed", False, "no inline question rendered")
    # a multiple-choice option in the feed keeps the room for its checkbox (the text starts after the box)
    clear = pg.evaluate("""() => { var post = document.createElement('div'); post.className = 'post-q';
        post.innerHTML = '<div class="fq-options"><button class="opt check" role="checkbox">reflexivita</button></div>';
        document.getElementById('feedList').appendChild(post);
        var b = post.querySelector('.opt'), box = getComputedStyle(b, '::before');
        var r = parseFloat(box.left) + parseFloat(box.width) + 2 * parseFloat(box.borderLeftWidth) <= parseFloat(getComputedStyle(b).paddingLeft);
        post.remove(); return r; }""")
    check("feed: a checkbox doesn't cover the text of its option", clear)
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

    # "all" starts with a word about the feed; a course's pinned post leads only its own filter
    pg.locator("#feedChips .chip").first.click(); pg.wait_for_timeout(500)
    check("'all' starts with a word about the feed, not a course's pinned post",
          pg.evaluate("document.querySelector('#feedList').firstElementChild.className") == "feed-intro" and pg.locator("#feedList .post-pin").count() == 0)
    if len(cs) > 1:
        pg.locator("#feedChips .chip").nth(1).click(); pg.wait_for_timeout(500)
        pinned = pg.evaluate("(function () { var p = document.querySelector('#feedList .post'); return !!(p && p.querySelector('.post-pin')); })()")
        has_pin = pg.evaluate(f"/\\|\\s*pin\\s*$/m.test(CUSP.courseById('{cs[0][0]}').feedText || '')")
        check("a course's own filter starts with its pinned post", pinned or not has_pin)
        pg.locator("#feedChips .chip").first.click(); pg.wait_for_timeout(500)
    pg.click("#feedList .feed-intro .fi-close"); pg.wait_for_timeout(200)
    pg.click("#feedShuffle"); pg.wait_for_timeout(500)
    check("the feed intro stays hidden once closed", pg.locator("#feedList .feed-intro").count() == 0)

    # other course on the map
    if len(cs) > 1:
        pg.click('.tab[data-view="learn"]'); pg.wait_for_timeout(300)
        pg.click("#courseBtn"); pg.wait_for_timeout(200)
        pg.locator("#courseList .course-opt").nth(1).click(); pg.wait_for_timeout(1500)
        n2 = pg.locator("#path .node").count()
        check(f"course switch shows {cs[1][0]}", n2 == expected_nodes(cs[1][0]), f"{n2} != {expected_nodes(cs[1][0])}")
    check("no errors in the page", not errors, "; ".join(errors[:3]))
    pg.close()


def test_home(b, url, cs):
    print("home (where the app opens)")
    errors = []
    pg = new_page(b, errors)
    pg.goto(url); pg.wait_for_timeout(2000)
    check("the app opens on Home", pg.locator("#view-home").is_visible() and pg.locator("#view-learn").is_hidden())
    check("Home shows the tagline", pg.text_content("#homeTagline") == pg.evaluate("CUSP.L().tagline"))
    title = pg.inner_text(".h-next .h-title")
    check("Home names the first lesson for a new student", title == pg.evaluate("CUSP.courseState(CUSP.course()).nextTitle"), title)
    pg.click(".h-play"); pg.wait_for_timeout(300)
    check("its button plays that lesson", not pg.locator("#lesson").is_hidden())
    steps = solve_lesson(pg); pg.wait_for_timeout(500)
    check("after the lesson Home moves on to the next one", steps > 0 and pg.locator("#view-home").is_visible()
          and pg.inner_text(".h-next .h-title") != title and pg.locator(".h-tiles").count() == 1)
    pg.locator(".h-how .h-row.h-learn").click(); pg.wait_for_timeout(500)
    check("'how it works' leads to the map", pg.locator("#view-learn").is_visible() and pg.evaluate("location.hash") == "#learn")
    pg.click('.tab[data-view="home"]'); pg.wait_for_timeout(300)
    pg.click(".h-change"); pg.wait_for_timeout(200)
    check("Home can change the course", not pg.locator("#courseSheet").is_hidden())
    # the interface language: English in a Czech course, and it is remembered
    pg.locator(".lang-opt[lang=en]").click(); pg.wait_for_timeout(400)
    pg.click("#courseSheet", position={"x": 200, "y": 20}); pg.wait_for_timeout(300)
    en = pg.evaluate("CUSP.STR.en")
    check("the interface can switch to English", pg.text_content("#tabHomeLabel") == en["home"] and pg.text_content("#homeTagline") == en["tagline"])
    pg.reload(); pg.wait_for_timeout(1500)
    check("the language choice is remembered", pg.text_content("#homeTagline") == en["tagline"] and pg.evaluate("document.documentElement.lang") == "en")
    pg.click(".h-change"); pg.wait_for_timeout(200); pg.locator(".lang-opt[lang=cs]").click(); pg.wait_for_timeout(300)
    check("and back to Czech", pg.text_content("#homeTagline") == pg.evaluate("CUSP.STR.cs.tagline"))
    check("no errors in the page", not errors, "; ".join(errors[:3]))
    pg.close()


def test_migration(b, url, cs):
    print("old progress (positional keys, the old lemma.* storage) is moved to the stable ids and cusp.*")
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
    check("the old lemma.* keys are moved to cusp.*", pg.evaluate("""() => !Object.keys(localStorage).some(function (k) { return k.indexOf('lemma.') === 0; })
        && JSON.parse(localStorage.getItem('cusp.learn')).xp === 10 && localStorage.getItem('cusp.course') === '""" + cid + "'"))
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
    # installed, the app is fullscreen (Android hides its bars until a swipe); where bars show, they are dark like the app
    bars = pg.evaluate("""() => fetch(document.querySelector('link[rel=manifest]').href).then(function (r) { return r.json(); }).then(function (m) {
        return [m.theme_color, document.querySelector('meta[name=theme-color]').content, document.querySelector('meta[name=viewport]').content.indexOf('viewport-fit=cover') >= 0, m.display]; })""")
    check("the installed app is fullscreen, with dark bars where they show", bars[0] == bars[1] == "#080c1a" and bars[2] and bars[3] == "fullscreen", str(bars))
    check("course data is a separate file", pg.evaluate("!document.getElementById('data-" + first + "')"))
    check("course data is asked for by version", pg.evaluate("CUSP.COURSES.every(function (c) { return /^data\\/[\\w-]+\\.json\\?v=[0-9a-f]{10}$/.test(c.data); })"))
    check("map loads its course on demand", pg.locator("#path .node").count() == expected_nodes(first))
    pg.click('.tab[data-view="feed"]'); pg.wait_for_timeout(2500)
    check("feed loads every course", pg.evaluate("CUSP.visibleCourses().every(function (c) { return !!c.units; })"))
    check("service worker is active", pg.evaluate("navigator.serviceWorker.ready.then(function (r) { return !!r.active; })"))
    # a reinstall must read the current manifest, even while an older version's copy is still in a cache
    fresh = pg.evaluate("""() => caches.keys().then(function (keys) {          // as on a phone where only the old version's cache has it
        return Promise.all(keys.map(function (k) { return caches.open(k).then(function (c) { return c.delete('manifest.webmanifest', { ignoreSearch: true }); }); }));
      }).then(function () { return caches.open('cusp-app-older'); }).then(function (c) {
        return c.put(new URL('manifest.webmanifest', location.href).href, new Response('{"display": "standalone"}', { headers: { 'Content-Type': 'application/manifest+json' } }));
      }).then(function () { return fetch('manifest.webmanifest'); }).then(function (r) { return r.json(); })
      .then(function (m) { return caches.delete('cusp-app-older').then(function () { return m.display; }); })""")
    check("the manifest comes fresh from the network, not from an old cache", fresh == "fullscreen", str(fresh))
    pg.wait_for_timeout(1500)
    ctx.set_offline(True)
    pg.goto(url + "#learn"); pg.wait_for_timeout(2500)
    check("works offline", pg.locator("#path .node").count() == expected_nodes(first))
    ctx.set_offline(False)
    DELAY["page"] = 8
    t0 = time.time()
    pg.goto(url + "#learn"); pg.wait_for_selector("#path .node", timeout=7000)
    took = time.time() - t0
    DELAY["page"] = 0
    check("a slow network shows the saved app after about 3 s", took < 6 and pg.locator("#path .node").count() == expected_nodes(first), f"{took:.1f} s")
    # the app open twice: what one copy saved is not overwritten by the other
    pg2 = ctx.new_page(); pg2.goto(url + "#learn"); pg2.wait_for_timeout(1500)
    pg2.evaluate("() => { CUSP.P.done['tab:two'] = true; CUSP.save(); }")
    pg.evaluate("() => { CUSP.P.done['tab:one'] = true; CUSP.save(); }")
    both = pg.evaluate("(function () { var d = JSON.parse(localStorage.getItem('cusp.learn')).done; return !!(d['tab:one'] && d['tab:two']); })()")
    check("two open copies of the app don't overwrite each other's progress", both)
    pg2.close()
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
        test_home(b, site, cs)
        test_migration(b, site, cs)
        test_pwa(b, cs)
        b.close()
    print(f"\n{len(PASSES)} passed, {len(FAILS)} failed")
    if FAILS:
        print("failed: " + "; ".join(FAILS))
        sys.exit(1)


if __name__ == "__main__":
    main()
