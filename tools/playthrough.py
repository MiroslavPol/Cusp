"""Play every lesson at phone width and report what doesn't fit or doesn't judge right.

    python tools/playthrough.py                    # every course, 375 px wide
    python tools/playthrough.py calc1              # one course
    python tools/playthrough.py calc1 "Limita funkce" "Asymptoty"   # some lessons of it
    python tools/playthrough.py --width 360        # a narrower phone

Every learn card and question is shown, every question answered twice: right (it must be judged
right) and wrong (it must be judged wrong). At each step the page is checked for text or formulas
that stick out past the screen or are cut off, TeX errors, TeX source that wasn't typeset, and
"undefined"/"NaN". Each problem is printed with its place (course / lesson / id) and a screenshot
is saved in playthrough/ (git ignores it). It takes about 25 minutes for all courses.

Needs what test_app.py needs (Playwright; on Windows set CUSP_BROWSER=msedge). Run python build.py
first: it plays site/index.html as it is.
"""
import argparse, json, os, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
import test_app as T

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "playthrough"

# Problems on the page, as text. Display formulas marked .wide / .wide-inline scroll on purpose and are only
# listed (a fade at their edge shows there is more), not counted as sticking out.
SCAN = r"""() => {
  var W = window.innerWidth, out = [], root = document.getElementById('lesson');
  function txt(e) { return (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70); }
  if (document.documentElement.scrollWidth > W + 1) out.push('the page scrolls sideways (' + document.documentElement.scrollWidth + ' px)');
  root.querySelectorAll('*').forEach(function (e) {
    if (e.closest('math.wide, math.wide-inline, svg')) return;
    var r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.right > W + 1 || r.left < -1) {
      var p = e.parentElement, pr = p && p.getBoundingClientRect();
      if (p && p !== root && pr && (pr.right > W + 1 || pr.left < -1)) return;     // report the outermost only
      out.push('sticks out: <' + e.tagName.toLowerCase() + ' ' + e.className + '> to ' + Math.round(r.right) + ' px "' + txt(e) + '"');
    }
  });
  root.querySelectorAll('.opt, .tile, .m-body, .m-left, #fb, p').forEach(function (e) {
    if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible')
      out.push('cut off: <' + e.tagName.toLowerCase() + ' ' + e.className + '> ' + e.scrollWidth + ' > ' + e.clientWidth + ' px "' + txt(e) + '"');
  });
  root.querySelectorAll('.katex-error, merror').forEach(function (e) { out.push('TeX error: ' + (e.getAttribute('title') || txt(e))); });
  root.querySelectorAll('math.wide, math.wide-inline').forEach(function (e) { out.push('note: scrolls sideways "' + txt(e) + '"'); });
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) {
    var pe = n.parentElement; if (!pe || pe.closest('math, .katex, script, style, annotation, textarea, input')) continue;
    if (pe.offsetParent === null) continue;
    if (/\$|\\[a-zA-Z]{2,}|undefined|NaN/.test(n.textContent)) out.push('raw text: "' + n.textContent.trim().slice(0, 90) + '"');
  }
  return out;
}"""


def answer(pg, it, wrong):
    k = it["kind"]
    if k in ("mc", "multi", "tf"):
        bs = pg.locator("#lessonBody .options .opt")
        if k == "tf" and not wrong:
            ok = pg.evaluate("() => CUSP.L()[CUSP.debugItem().answer === 'true' ? 'tTrue' : 'tFalse']")
            pg.locator("#lessonBody .options .opt", has_text=ok).first.click(); return
        idx = [i for i in range(bs.count()) if pg.evaluate("(b) => !!b._opt.ok", bs.nth(i).element_handle()) != wrong]
        for i in (idx[:1] if wrong or k != "multi" else idx): bs.nth(i).click()
    elif k in ("order", "build"):
        oks = [o for o in it["opts"] if o["ok"]]
        for o in (list(reversed(oks)) if wrong else oks):
            tiles = pg.locator("#lessonBody .tiles-bank .tile:not(.used)")
            for i in range(tiles.count()):
                if pg.evaluate("(b) => b._opt.html", tiles.nth(i).element_handle()) == o["h"]:
                    tiles.nth(i).click(); break
    elif k == "match":
        pg.evaluate(T.MATCH, wrong)
    else:
        if wrong: v = {"interval": "(987654; 987655)", "set": "987654"}.get(k, "987654")
        else: v = it["answer"].split(";")[0].strip() if k == "input" else it["answer"]
        pg.fill("#lessonBody input.answer-in", v)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("course", nargs="?"); ap.add_argument("lessons", nargs="*")
    ap.add_argument("--width", type=int, default=375)
    a = ap.parse_args()
    page = ROOT / "site" / "index.html"
    if not page.exists(): sys.exit("No site/index.html: run python build.py first.")
    OUT.mkdir(exist_ok=True)
    problems, notes = 0, 0
    with sync_playwright() as p:
        b = T.launch(p)
        pg = b.new_page(viewport={"width": a.width, "height": 740}, device_scale_factor=2)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(page.as_uri() + "#learn"); pg.wait_for_timeout(2500)
        lessons = pg.evaluate("""() => CUSP.loadAll(CUSP.COURSES).then(function () { var r = [];
          CUSP.COURSES.forEach(function (c, ci) { c.units.forEach(function (u, ui) { u.lessons.forEach(function (l, li) {
            r.push({ c: c.id, ci: ci, ui: ui, li: li, title: l.title }); }); }); }); return r; })""")
        lessons = [L for L in lessons if (not a.course or L["c"] == a.course) and (not a.lessons or L["title"] in a.lessons)]
        if not lessons: sys.exit("No such course or lesson.")
        for L in lessons:
            for wrong in (False, True):
                pg.evaluate("""(a) => { var l = CUSP.COURSES[a.ci].units[a.ui].lessons[a.li];
                  var items = l.items.filter(function (it) { return a.wrong ? it.key : true; })
                    .map(function (it) { return it.key ? CUSP.instantiate(it) : it; }).filter(Boolean);
                  CUSP.startSession({ items: items, feed: true }); }""", {**L, "wrong": wrong})
                pg.wait_for_timeout(250)
                for _ in range(200):
                    if pg.locator("#lesson").is_hidden() or pg.locator("#lessonBody .done-screen").count(): break
                    it = pg.evaluate(T.SOLVE_ITEM)
                    if not it: break
                    key = pg.evaluate("() => CUSP.debugItem().key || ('card ' + (CUSP.debugItem().title || ''))")
                    where = f'{L["c"]} / {L["title"]} / {key}' + (" (answered wrongly)" if wrong else "")
                    def report(stage, issues):
                        nonlocal problems, notes
                        real = [i for i in issues if not i.startswith("note:")]
                        problems += len(real); notes += len(issues) - len(real)
                        if not real: return
                        print(f"{where}, {stage}:"); [print("   ", i) for i in real]
                        pg.screenshot(path=str(OUT / f'{key.replace(":", "_").replace(" ", "_")[:50]}{"_w" if wrong else ""}_{stage}.png'), full_page=True)
                    if not wrong: report("shown", pg.evaluate(SCAN))
                    if it["kind"] == "learn":
                        pg.click("#primary"); pg.wait_for_timeout(40); continue
                    answer(pg, it, wrong); pg.wait_for_timeout(40)
                    if pg.is_disabled("#primary"):
                        report("answer", ["the answer can't be submitted"]); pg.click("#lessonClose"); break
                    pg.click("#primary"); pg.wait_for_timeout(80)
                    if pg.locator("#lessonBody .q-label.counter").count() and pg.locator("#fb").is_hidden():
                        bs = pg.locator("#lessonBody .options").last.locator(".opt"); pick = 0
                        for i in range(bs.count()):
                            if pg.evaluate("(b) => !!b._opt.ok", bs.nth(i).element_handle()) != wrong: pick = i; break
                        bs.nth(pick).click(); pg.click("#primary"); pg.wait_for_timeout(80)
                    issues = pg.evaluate(SCAN)
                    state = pg.evaluate("document.getElementById('lessonFoot').dataset.state || ''")
                    if not wrong and state != "good": issues.append("the right answer is judged " + (state or "not at all"))
                    if wrong and state == "good": issues.append("a wrong answer is accepted")
                    report("feedback", issues)
                    pg.click("#primary"); pg.wait_for_timeout(50)
                if not pg.locator("#lesson").is_hidden():
                    pg.click("#primary" if pg.locator("#lessonBody .done-screen").count() else "#lessonClose"); pg.wait_for_timeout(100)
            print(f'  played {L["c"]} / {L["title"]}', flush=True)
        b.close()
    for e in errors: print("page error:", e); problems += 1
    print(f"\n{len(lessons)} lessons, {problems} problems" + (f" (screenshots in {OUT})" if problems else "") +
          (f", {notes} formulas scroll sideways on purpose" if notes else ""))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
