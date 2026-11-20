"""Build the Cusp app.   python build.py

Assembles one HTML page from
  app/shell.html                 page skeleton
  app/css/*.css, app/html/*.html, app/js/*.js     the interface (shared by all courses)
  courses/<id>/                  one folder per course (found automatically)
and writes two versions:
  site/        index.html with every course inside (KaTeX from a CDN), plus img/ and fonts/
  pwa/         installable offline app for GitHub Pages: index.html, data/<course>.json loaded on demand,
               local KaTeX and fonts, manifest, service worker

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
JS_AFTER_COURSES = ["strings.js", "core.js", "guide.js", "path.js", "player.js", "map.js", "feed.js", "main.js"]

KINDS = {"mc", "multi", "tf", "input", "expr", "interval", "set", "order", "build", "gen"}
POST_TYPES = {"def", "thm", "proof", "cex", "app", "exam", "hist", "tip"}
COURSE_ID = re.compile(r"^[a-z][a-z0-9-]*$")
QLINE = re.compile(r"^\? (\w+)(?:\s+#([A-Za-z0-9_-]+))?(?:\s*\|\s*(.*))?$")
HEAD_ID = re.compile(r"^#[A-Za-z0-9_-]+$")


def read(p):
    return p.read_text(encoding="utf-8")


class Problems(list):
    def add(self, where, msg):
        self.append(f"{where}: {msg}")


def head_id(rest):
    parts = [p.strip() for p in rest.split("|")]
    ids = [p[1:] for i, p in enumerate(parts) if i > 0 and HEAD_ID.match(p)]
    return ids[0] if ids else None


# ----------------------------------------------------------------- course checks
def check_course(d, probs):
    """Light checks that catch the usual slips (typos in headers, unknown generators, missing ids, bad JSON)."""
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
    seen, missing = {}, []
    def note_id(i, at):
        if i is None: missing.append(at); return
        if i in seen: probs.add(at, f'id "#{i}" is already used at line {seen[i]}; delete this copy\'s id and run python tools/assign_ids.py {cid}')
        else: seen[i] = at.rsplit(":", 1)[1]
    for n, line in enumerate(read(lp).split("\n"), 1):
        at = f"{rel(lp)}:{n}"
        if line.startswith("## "):
            unit, lesson = True, False
            note_id(head_id(line[3:]), at)
        elif line.startswith("### "):
            if not unit: probs.add(at, 'lesson before the first unit ("## Unit title")')
            lesson = True
            note_id(head_id(line[4:]), at)
        elif re.match(r"^#{1,3}[^# ]", line) or re.match(r"^#{1,3}$", line):
            probs.add(at, 'headers are "## Unit title" and "### Lesson title" (with a space)')
        elif line.startswith("> ") or line.startswith("? "):
            if not lesson: probs.add(at, 'item before the first lesson ("### Lesson title")')
            if line.startswith("? "):
                m = QLINE.match(line.rstrip())
                if not m or m.group(1) not in KINDS:
                    probs.add(at, f"unknown question kind; use one of: {', '.join(sorted(KINDS))}")
                    continue
                note_id(m.group(2), at)
                if m.group(1) == "gen":
                    name = (m.group(3) or "").strip()
                    if name not in gens:
                        probs.add(at, f'generator "{name}" is not defined in {rel(gp)}')
    if missing:
        more = f" (and {len(missing) - 3} more)" if len(missing) > 3 else ""
        probs.add(", ".join(missing[:3]) + more, f"no id yet; run  python tools/assign_ids.py {cid}")
    fp = d / "feed.txt"
    if fp.exists():
        for n, line in enumerate(read(fp).split("\n"), 1):
            if line.startswith("=== "):
                head = [s.strip() for s in line[4:].split("|")]
                if head[0] not in POST_TYPES:
                    probs.add(f"{rel(fp)}:{n}", f"unknown post type '{head[0]}'; use one of: {', '.join(sorted(POST_TYPES))}")
                if len(head) < 3:
                    probs.add(f"{rel(fp)}:{n}", "a post header is: === type | P# | Title | cover TeX")
    for name in ("legacy-ids.json",):
        p = d / name
        if p.exists():
            try: json.loads(read(p))
            except json.JSONDecodeError as e: probs.add(f"{rel(p)}:{e.lineno}", f"invalid JSON: {e.msg}")
    return meta


def course_data(d):
    """Everything the app needs of one course, as one JSON object."""
    cid = d.name
    data = {"lessons": read(d / "lessons.txt")}
    if (d / "feed.txt").exists():
        data["feed"] = read(d / "feed.txt")
    if (d / "guide" / "guide.json").exists():
        g = read(d / "guide" / "guide.json").replace('src=\\"img/', f'src=\\"img/{cid}/')     # images live in img/<course id>/
        data["guide"] = json.loads(g)
    if (d / "legacy-ids.json").exists():
        data["legacy"] = json.loads(read(d / "legacy-ids.json"))
    return data


def as_script_json(obj):
    """JSON that is safe inside <script> (no "</script" can appear)."""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


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

    registry, gen_js = [], []
    for d, meta in courses:
        registry.append(dict(meta, id=d.name, hasLessons=True, hasFeed=(d / "feed.txt").exists(), hasGuide=(d / "guide" / "guide.json").exists()))
        if (d / "generators.js").exists():
            gen_js.append(f"/* courses/{d.name}/generators.js */\n" + read(d / "generators.js"))

    def scripts(names):
        return ["/* app/js/" + n + " */\n" + read(APP / "js" / n) for n in names]
    js = scripts(JS_BEFORE_COURSES) + gen_js + scripts(JS_AFTER_COURSES)

    s = read(APP / "shell.html")
    def put(marker, text):
        nonlocal s
        i = s.index(marker)
        j = s.index("\n", i) if marker.startswith("<!--") else s.index("*/", i) + 2
        s = s[:i] + text + s[j:]
    put("/* @CSS", read(APP / "vendor" / "fonts" / "fonts.css") + "\n".join(read(APP / "css" / n) for n in CSS))
    put("<!-- @HTML", "\n".join(read(APP / "html" / n) for n in HTML))
    put("<!-- @JS", "\n".join("<script>\n" + j + "</script>" for j in js))
    reg = '<script type="application/json" id="courses">' + as_script_json(registry) + "</script>"
    return s, courses, reg


def copy_assets(courses, dest):
    n = 0
    for d, _ in courses:
        src = d / "guide" / "img"
        if src.exists():
            shutil.copytree(src, dest / "img" / d.name)
            n += sum(1 for _ in src.iterdir())
    (dest / "fonts").mkdir()
    for f in (APP / "vendor" / "fonts").iterdir():
        if f.suffix in (".woff2", ".txt"):
            shutil.copy(f, dest / "fonts" / f.name)
    return n


def main():
    page, courses, reg = build()
    head_marker = "<!-- @HEAD"
    datas = {d.name: course_data(d) for d, _ in courses}

    # 1) site/: every course inside the page, KaTeX from the CDN
    site = ROOT / "site"
    if site.exists(): shutil.rmtree(site)
    site.mkdir()
    inline = reg + "\n" + "\n".join(f'<script type="application/json" id="data-{cid}">' + as_script_json(d) + "</script>" for cid, d in datas.items())
    sp = page.replace("<!-- @COURSES", inline + "\n<!-- @COURSES", 1)
    sp = re.sub(r"[ \t]*<!-- @(HEAD|COURSES).*\n", "", sp)
    (site / "index.html").write_text(sp, encoding="utf-8")
    n = copy_assets(courses, site)
    print(f"site/index.html  {len(sp):,} chars, {len(courses)} courses ({', '.join(datas)}), {n} images")

    # 2) pwa/: installable app; each course's data is its own file, loaded when needed
    P = ROOT / "pwa"
    if P.exists(): shutil.rmtree(P)
    P.mkdir()
    copy_assets(courses, P)
    (P / "data").mkdir()
    for cid, d in datas.items():
        (P / "data" / f"{cid}.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
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
    p = re.sub(r"<!-- @COURSES.*", lambda m: reg, p, count=1)
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
        "background_color": "#080c1a",
        "theme_color": "#e9ecf1",
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (P / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    files = sorted(f.relative_to(P).as_posix() for f in P.rglob("*") if f.is_file() and not f.name.startswith(("LICENSE", "OFL", ".")))
    h = hashlib.sha256()
    for f in files:
        h.update(f.encode()); h.update((P / f).read_bytes())
    sw = read(APP / "pwa" / "sw.js")
    sw = sw.replace("__VERSION__", h.hexdigest()[:12]).replace("__PRECACHE__", json.dumps(["./"] + files, ensure_ascii=False))
    (P / "sw.js").write_text(sw, encoding="utf-8")
    size = sum((P / f).stat().st_size for f in files)
    print(f"pwa/             {len(files) + 1} files, {size / 1e6:.1f} MB, page {len(p):,} chars, version {h.hexdigest()[:12]}")


if __name__ == "__main__":
    main()
