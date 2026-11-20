"""Build the Cusp app.   python build.py

Assembles one HTML page from
  app/shell.html                 page skeleton
  app/css/*.css, app/html/*.html, app/js/*.js     the interface (shared by all courses)
  courses/<id>/                  one folder per course (found automatically)
and writes two versions:
  site/index.html   single file (loads KaTeX from a CDN), e.g. for a claude.ai artifact
  pwa/              installable offline app for GitHub Pages (local KaTeX, manifest, service worker)

Every course folder is checked first; problems are reported as file:line and stop the build.
"""
import hashlib
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
APP = ROOT / "app"
COURSES = ROOT / "courses"

# Order matters: later files may use what earlier ones define.
CSS = ["base.css", "learn.css", "feed.css", "path.css"]
HTML = ["learn.html", "feed.html", "overlays.html"]
JS_BEFORE_COURSES = ["fig.js", "answers.js", "genkit.js"]
JS_AFTER_COURSES = ["path.js", "feed.js", "learn.js"]

KINDS = {"mc", "multi", "tf", "input", "expr", "interval", "set", "order", "build", "gen"}
POST_TYPES = {"def", "thm", "proof", "cex", "app", "exam", "hist", "tip"}
COURSE_ID = re.compile(r"^[a-z][a-z0-9-]*$")


def read(p):
    return p.read_text(encoding="utf-8")


class Problems(list):
    def add(self, where, msg):
        self.append(f"{where}: {msg}")


# ----------------------------------------------------------------- course checks
def check_course(d, probs):
    """Light checks that catch the usual slips (typos in headers, unknown generators, bad JSON)."""
    cid = d.name
    rel = lambda p: p.relative_to(ROOT).as_posix()
    if not COURSE_ID.match(cid):
        probs.add(rel(d), "folder name must be a course id: lowercase letters, digits, '-' (e.g. 'calc2')")
    meta_p = d / "course.json"
    try:
        meta = json.loads(read(meta_p))
    except FileNotFoundError:
        probs.add(rel(d), "missing course.json"); return None
    except json.JSONDecodeError as e:
        probs.add(f"{rel(meta_p)}:{e.lineno}", f"invalid JSON: {e.msg}"); return None
    for k in ("title", "lang", "blurb"):
        if not isinstance(meta.get(k), str) or not meta[k].strip():
            probs.add(rel(meta_p), f'"{k}" is required (a non-empty string)')
    if "id" in meta and meta["id"] != cid:
        probs.add(rel(meta_p), f'"id" is "{meta["id"]}" but the folder is "{cid}"; remove "id", the folder name is the id')

    gens = set()
    gp = d / "generators.js"
    if gp.exists():
        src = read(gp)
        if f'LEMMA_GEN.define("{cid}"' not in src:
            probs.add(rel(gp), f'must call LEMMA_GEN.define("{cid}", function (K, G) {{ ... }})')
        gens = set(re.findall(r"^\s*G\.(\w+)\s*=", src, re.M))

    lp = d / "lessons.txt"
    if not lp.exists():
        probs.add(rel(d), "missing lessons.txt"); return meta
    unit = lesson = False
    item = None
    for n, line in enumerate(read(lp).split("\n"), 1):
        at = f"{rel(lp)}:{n}"
        if line.startswith("## "):
            unit, lesson, item = True, False, None
        elif line.startswith("### "):
            if not unit: probs.add(at, 'lesson before the first unit ("## Unit title")')
            lesson, item = True, None
        elif re.match(r"^#{1,3}[^# ]", line) or re.match(r"^#{1,3}$", line):
            probs.add(at, 'headers are "## Unit title" and "### Lesson title" (with a space)')
        elif line.startswith("> ") or line.startswith("? "):
            if not lesson: probs.add(at, 'item before the first lesson ("### Lesson title")')
            item = line[:1]
            m = re.match(r"^\? (\w+)(?:\s*\|\s*(.*))?$", line)
            if line.startswith("? "):
                if not m or m.group(1) not in KINDS:
                    probs.add(at, f"unknown question kind; use one of: {', '.join(sorted(KINDS))}")
                elif m.group(1) == "gen":
                    name = (m.group(2) or "").strip()
                    if name not in gens:
                        probs.add(at, f'generator "{name}" is not defined in {rel(gp)}')
    fp = d / "feed.txt"
    if fp.exists():
        for n, line in enumerate(read(fp).split("\n"), 1):
            if line.startswith("=== "):
                head = [s.strip() for s in line[4:].split("|")]
                if head[0] not in POST_TYPES:
                    probs.add(f"{rel(fp)}:{n}", f"unknown post type '{head[0]}'; use one of: {', '.join(sorted(POST_TYPES))}")
                if len(head) < 3:
                    probs.add(f"{rel(fp)}:{n}", "a post header is: === type | P# | Title | cover TeX")
    return meta


def script_text(s):
    """Text to put inside <script type="text/plain"> (it must not close the tag)."""
    assert "</script" not in s.lower(), "a course file contains '</script', which would break the page"
    return s


# ----------------------------------------------------------------- assemble
def build():
    probs = Problems()
    courses = []
    for d in sorted(p for p in COURSES.iterdir() if p.is_dir() and not p.name.startswith((".", "_"))):
        meta = check_course(d, probs)
        if meta is not None:
            courses.append((d, meta))
    if probs:
        print("Build stopped. Fix these first:\n  " + "\n  ".join(probs))
        sys.exit(1)
    courses.sort(key=lambda dm: (dm[1].get("order", 100), dm[0].name))

    registry, data, gen_js = [], [], []
    for d, meta in courses:
        cid = d.name
        info = dict(meta, id=cid, hasFeed=(d / "feed.txt").exists(), hasGuide=(d / "guide" / "guide.json").exists())
        registry.append(info)
        data.append(f'<script type="text/plain" id="lessons-{cid}">\n' + script_text(read(d / "lessons.txt")) + "</script>")
        if info["hasFeed"]:
            data.append(f'<script type="text/plain" id="feed-{cid}">\n' + script_text(read(d / "feed.txt")) + "</script>")
        if info["hasGuide"]:
            # guide images live in img/<course id>/ in the built site
            g = read(d / "guide" / "guide.json").replace('src=\\"img/', f'src=\\"img/{cid}/')
            data.append(f'<script type="application/json" id="guide-{cid}">' + script_text(g) + "</script>")
        if (d / "generators.js").exists():
            gen_js.append(f"/* courses/{cid}/generators.js */\n" + read(d / "generators.js"))
    data.insert(0, '<script type="application/json" id="courses">' + json.dumps(registry, ensure_ascii=False) + "</script>")

    def scripts(names, folder=APP / "js"):
        return ["/* app/js/" + n + " */\n" + read(folder / n) for n in names]
    js = scripts(JS_BEFORE_COURSES) + gen_js + scripts(JS_AFTER_COURSES)

    s = read(APP / "shell.html")
    def put(marker, text):
        nonlocal s
        i = s.index(marker)
        j = s.index("\n", i) if marker.startswith("<!--") else s.index("*/", i) + 2
        s = s[:i] + text + s[j:]
    put("/* @CSS", "\n".join(read(APP / "css" / n) for n in CSS))
    put("<!-- @HTML", "\n".join(read(APP / "html" / n) for n in HTML))
    put("<!-- @COURSES", "\n".join(data))
    put("<!-- @JS", "\n".join("<script>\n" + j + "</script>" for j in js))
    head_marker = "<!-- @HEAD"
    return s, courses, head_marker


def copy_images(courses, dest):
    n = 0
    for d, _ in courses:
        src = d / "guide" / "img"
        if src.exists():
            shutil.copytree(src, dest / "img" / d.name)
            n += sum(1 for _ in src.iterdir())
    return n


def main():
    page, courses, head_marker = build()
    without_head = re.sub(r"[ \t]*" + re.escape(head_marker) + r".*\n", "", page)

    # 1) site/: single page, KaTeX from the CDN
    site = ROOT / "site"
    if site.exists(): shutil.rmtree(site)
    site.mkdir()
    (site / "index.html").write_text(without_head, encoding="utf-8")
    n = copy_images(courses, site)
    print(f"site/index.html  {len(without_head):,} chars, {len(courses)} courses ({', '.join(d.name for d, _ in courses)}), {n} images")

    # 2) pwa/: installable app
    P = ROOT / "pwa"
    if P.exists(): shutil.rmtree(P)
    P.mkdir()
    copy_images(courses, P)
    shutil.copytree(APP / "vendor" / "katex", P / "katex")
    shutil.copytree(APP / "pwa" / "icons", P / "icons")
    CDN = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/"
    assert page.count(CDN) == 2, "KaTeX CDN tags not found in app/shell.html"
    p = page.replace(CDN, "katex/")
    HEAD = """<meta name="description" content="Kurzy a feed z matematiky.">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#e9ecf1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1016" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" href="icons/favicon-64.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Cusp">
<meta name="apple-mobile-web-app-status-bar-style" content="default">"""
    p = re.sub(re.escape(head_marker) + r".*", lambda m: HEAD, p, count=1)
    REG = """<script>
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("SW:", e); });
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  });
}
</script>
</body>"""
    i = p.rindex("</body>")
    p = p[:i] + REG + p[i + len("</body>"):]
    (P / "index.html").write_text(p, encoding="utf-8")

    manifest = {
        "name": "Cusp",
        "short_name": "Cusp",
        "description": "Kurzy a feed z matematiky.",
        "lang": "cs",
        "id": "./",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#e9ecf1",
        "theme_color": "#e9ecf1",
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (P / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    files = sorted(f.relative_to(P).as_posix() for f in P.rglob("*") if f.is_file() and not f.name.startswith(("LICENSE", ".")))
    h = hashlib.sha256()
    for f in files:
        h.update(f.encode()); h.update((P / f).read_bytes())
    sw = read(APP / "pwa" / "sw.js")
    sw = sw.replace("__VERSION__", h.hexdigest()[:12]).replace("__PRECACHE__", json.dumps(["./"] + files, ensure_ascii=False))
    (P / "sw.js").write_text(sw, encoding="utf-8")
    print(f"pwa/             {len(files) + 1} files, version {h.hexdigest()[:12]}")


if __name__ == "__main__":
    main()
