"""Convert the Sprievodca Quarto sources into HTML snippets, one per guide section.

Output: guide.json = {"order": [slug, ...], "sections": {slug: {"title", "chapter", "html"}}}
Text is kept verbatim; only markup is translated. Python plots are executed and saved to img/;
static images are shown if a file with the same name is in img/, otherwise a note links to the online guide.
"""
import json
import pathlib
import re
import unicodedata
import io
import contextlib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

IMG = pathlib.Path(__file__).with_name("img")
IMG.mkdir(exist_ok=True)
PY = {"ns": {}, "n": 0, "file": ""}   # one Python session per chapter, like Quarto


def run_python(code, label):
    """Run a {python} block; return (list of saved image names, captured stdout)."""
    saved = []

    def show(*a, **k):
        PY["n"] += 1
        name = (label or "py-" + PY["file"] + "-" + str(PY["n"])) + ".png"
        plt.gcf().savefig(IMG / name, dpi=160, bbox_inches="tight", facecolor="white")
        plt.close("all")
        saved.append(name)

    plt.show = show
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(code, PY["ns"])
    return saved, buf.getvalue().strip()


def figure(name, cap, ctx, width=None):
    w = ' style="width:max(70%,' + str(width) + '%)"' if width else ""
    return ('<figure class="g-figure"><img src="img/' + name + '" alt="' + esc(re.sub(r"<[^>]+>", "", cap or "")) + '" loading="lazy"' + w + ">" +
            ("<figcaption>" + inline(cap, ctx) + "</figcaption>" if cap else "") + "</figure>")

SRC = pathlib.Path(__file__).with_name("qmd")
FILES = {  # chapter title -> file (order as in sprievodca.qmd)
    "Úvod": "uvod.qmd",
    "Funkcie a postupnosti": "limity.qmd",
    "Derivácia funkcie": "derivacia.qmd",
    "Neurčitý integrál": "NIntegral.qmd",
    "Riemannov integrál": "RIntegral.qmd",
}
KIND = {"thm": "veta", "def": "definícia", "lem": "lemma", "cor": "dôsledok"}


def slugify(s):
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"\$[^$]*\$", "", s)
    s = s.lower()
    s = re.sub(r"[^\w\s.-]", "", s)          # keep letters (incl. diacritics), digits, _ . -
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-{2,}", "-", s)
    s = re.sub(r"^[^a-zá-ž]+", "", s)
    return s


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------------------------------------------------------------- pass 1: labels
NAMES = {}  # label -> name (for theorems/definitions with a "## Name" heading)


def collect_names(text):
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        m = re.match(r"\s*:::\s*\{#((?:thm|def|lem|cor)-[^\s}]+)\}", ln)
        if m:
            for j in range(i + 1, min(i + 4, len(lines))):
                h = re.match(r"\s*##\s+(.*)", lines[j])
                if h:
                    NAMES[m.group(1)] = h.group(1).strip()
                    break
                if lines[j].strip():
                    break


# ---------------------------------------------------------------- inline markup
class Ctx:
    def __init__(self, footdefs):
        self.footdefs = footdefs
        self.order = []

    def fn(self, fid):
        if fid not in self.order:
            self.order.append(fid)
        n = self.order.index(fid) + 1
        return '<sup class="g-fnref">' + str(n) + "</sup>"


def fix_math(m):
    m = re.sub(r"\\label\{[^}]*\}", "", m)
    return esc(m)


def xref(kind, label, paren):
    if kind in KIND:
        name = NAMES.get(kind + "-" + label)
        if paren:
            return "(" + name + ")" if name else ""
        return KIND[kind] + (" " + name if name else "")
    if kind == "eq":
        return "" if paren else "vyššie uvedená"
    if kind == "fig":
        return "" if paren else "obrázok v online Sprievodcovi"
    if kind == "tbl":
        return "" if paren else "tabuľka"
    return ""


def inline(text, ctx):
    # \footnote{...} written in LaTeX style
    def lfn(m):
        fid = "tex" + str(len(ctx.footdefs))
        ctx.footdefs[fid] = m.group(1)
        return "[^" + fid + "]"
    text = re.sub(r"\\footnote\{([^{}]*)\}", lfn, text)
    parts = re.split(r"(\$\$.+?\$\$|\$[^$]+\$)", text)
    out = []
    for i, p in enumerate(parts):
        if i % 2 == 1:
            out.append(fix_math(p))
            continue
        p = esc(p)
        p = re.sub(r"\(@(thm|def|lem|cor|eq|fig|tbl)-([\w.]+)\)", lambda m: xref(m.group(1), m.group(2), True), p)
        p = re.sub(r"@(thm|def|lem|cor|eq|fig|tbl)-([\w.]+)", lambda m: xref(m.group(1), m.group(2), False), p)
        p = re.sub(r"\[\^([\w]+)\]", lambda m: ctx.fn(m.group(1)), p)
        p = re.sub(r"\*\*\*(.+?)\*\*\*", r"<b><i>\1</i></b>", p)
        p = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", p)
        p = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", p)
        p = re.sub(r"`([^`]+)`", r"<code>\1</code>", p)
        p = p.replace("``", "„").replace("''", "“").replace(" -- ", " – ").replace("--", "–")
        p = p.replace("\\&amp;", "&amp;")
        p = re.sub(r"\(\s*\)", "", p)
        p = re.sub(r" {2,}", " ", p)
        out.append(p)
    s = "".join(out)
    s = re.sub(r"\s+([.,;:])", r"\1", s) if False else s
    return s


# ---------------------------------------------------------------- blocks
OPEN_FENCE = re.compile(r"^\s*:::\s*\S")
CLOSE_FENCE = re.compile(r"^\s*:::\s*$")


def find_fence_end(lines, i):
    depth = 0
    for j in range(i, len(lines)):
        if OPEN_FENCE.match(lines[j]):
            depth += 1
        elif CLOSE_FENCE.match(lines[j]):
            depth -= 1
            if depth == 0:
                return j
    return len(lines) - 1


def find_details_end(lines, i):
    depth = 0
    for j in range(i, len(lines)):
        depth += lines[j].count("<details") - lines[j].count("</details>")
        if depth == 0:
            return j
    return len(lines) - 1


LIST_ITEM = re.compile(r"^(\s*)([-*]|\d+\.)\s+(.*)$")


def dedent(lines):
    ind = [len(l) - len(l.lstrip()) for l in lines if l.strip()]
    k = min(ind) if ind else 0
    return [l[k:] if len(l) >= k else l.lstrip() for l in lines]


def blocks(lines, ctx):
    html, para = [], []

    def flush():
        if para:
            html.append("<p>" + inline(" ".join(s.strip() for s in para), ctx) + "</p>")
            para.clear()

    i = 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if not s:
            flush(); i += 1; continue
        if s.startswith("```"):
            flush()
            j = i + 1
            while j < len(lines) and not lines[j].strip().startswith("```"):
                j += 1
            if "python" in s:
                code = "\n".join(lines[i + 1:j])
                opts = dict(re.findall(r"^#\|\s*([\w-]+):\s*(.*)$", code, re.M))
                if opts.get("eval", "").strip().lower() != "false":
                    imgs, out = run_python(code, opts.get("label", "").strip() or None)
                    for k, name in enumerate(imgs):
                        html.append(figure(name, opts.get("fig-cap") if k == 0 else None, ctx))
                    if out:
                        html.append('<pre class="g-out">' + esc(out) + "</pre>")
            i = j + 1; continue
        if OPEN_FENCE.match(ln):
            flush()
            j = find_fence_end(lines, i)
            html.append(fence(s, lines[i + 1:j], ctx))
            i = j + 1; continue
        if s.startswith("<details"):
            flush()
            j = find_details_end(lines, i)
            inner = lines[i + 1:j]
            summary = ""
            if inner and "<summary>" in inner[0]:
                summary = re.sub(r"</?summary>", "", inner[0]).strip()
                inner = inner[1:]
            elif "<summary>" in s:
                summary = re.sub(r"</?summary>|<details>", "", s).strip()
            html.append('<details class="g-more"><summary>' + inline(summary, ctx) + "</summary>" + blocks(inner, ctx) + "</details>")
            i = j + 1; continue
        if s.startswith("$$"):
            flush()
            body = [s[2:]]
            j = i + 1
            if s.endswith("$$") and len(s) > 4:          # one-line display math
                html.append('<div class="g-math">$$' + fix_math(s[2:-2]) + "$$</div>")
                i += 1; continue
            while j < len(lines) and not lines[j].strip().startswith("$$"):
                body.append(lines[j]); j += 1
            html.append('<div class="g-math">$$' + fix_math("\n".join(body).strip()) + "$$</div>")
            i = j + 1; continue
        if s.startswith("\\begin{align"):
            flush()
            j = i
            while j < len(lines) and "\\end{align" not in lines[j]:
                j += 1
            html.append('<div class="g-math">$$' + fix_math("\n".join(l.strip() for l in lines[i:j + 1])) + "$$</div>")
            i = j + 1; continue
        if s.startswith("!["):
            flush()
            m = re.match(r"!\[(.*)\]\(([^)]*)\)(\{[^}]*\})?", s)
            cap = m.group(1) if m else ""
            fname = m.group(2).strip() if m else ""
            wm = re.search(r"width=(\d+)%", (m.group(3) or "") if m else "")
            if fname and (IMG / fname).exists():
                html.append(figure(fname, cap, ctx, wm.group(1) if wm else None))
            else:
                html.append('<p class="g-fig">Obrázok' + (": " + inline(cap, ctx) if cap else "") + " <span>(v online Sprievodcovi)</span></p>")
            i += 1; continue
        if s.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            t = '<div class="g-table"><table>'
            for r, cells in enumerate(rows):
                tag = "th" if r == 0 else "td"
                t += "<tr>" + "".join("<" + tag + ">" + inline(c, ctx) + "</" + tag + ">" for c in cells) + "</tr>"
            html.append(t + "</table></div>")
            continue
        h = re.match(r"^(#{2,4})\s+(.*)", s)
        if h:
            flush()
            html.append("<h4>" + inline(h.group(2), ctx) + "</h4>")
            i += 1; continue
        m = LIST_ITEM.match(ln)
        if m:
            flush()
            base = len(m.group(1))
            ordered = m.group(2)[0].isdigit()
            items, cur = [], None
            while i < len(lines):
                l2 = lines[i]
                m2 = LIST_ITEM.match(l2)
                ind = len(l2) - len(l2.lstrip())
                if m2 and len(m2.group(1)) == base:
                    cur = [m2.group(3)]; items.append(cur); i += 1; continue
                if l2.strip() == "":
                    # blank line: continue only if next non-blank is indented deeper or another item
                    k = i + 1
                    while k < len(lines) and not lines[k].strip():
                        k += 1
                    if k < len(lines) and (len(lines[k]) - len(lines[k].lstrip()) > base):
                        cur.append(""); i += 1; continue
                    if k < len(lines) and LIST_ITEM.match(lines[k]) and len(LIST_ITEM.match(lines[k]).group(1)) == base:
                        i += 1; continue
                    break
                if ind > base:
                    cur.append(l2); i += 1; continue
                break
            tag = "ol" if ordered else "ul"
            out = "<" + tag + ">"
            for it in items:
                first, rest = it[0], dedent(it[1:]) if len(it) > 1 else []
                inner = blocks([first] + rest, ctx)
                if inner.startswith("<p>") and inner.count("<p>") == 1 and inner.endswith("</p>"):
                    inner = inner[3:-4]
                out += "<li>" + inner + "</li>"
            html.append(out + "</" + tag + ">")
            continue
        para.append(ln)
        i += 1
    flush()
    return "".join(html)


def fence(opener, inner, ctx):
    title = re.search(r'title="([^"]*)"', opener)
    title = title.group(1) if title else ""
    collapse = 'collapse="true"' in opener
    cls = "note" if "callout-note" in opener else "tip" if "callout-tip" in opener else "important" if "callout-important" in opener else ""
    idm = re.search(r"\{#([\w.-]+)\}", opener)
    if not cls:
        # plain id div (theorem/definition/table body): strip a leading "## Name"
        k = 0
        while k < len(inner) and not inner[k].strip():
            k += 1
        name = None
        if k < len(inner) and re.match(r"\s*##\s+", inner[k]):
            name = re.sub(r"^\s*##\s+", "", inner[k]).strip()
            inner = inner[:k] + inner[k + 1:]
        body = blocks(inner, ctx)
        return ('<span class="g-name" data-name="' + esc(name) + '"></span>' if name else "") + body
    body = blocks(inner, ctx)
    nm = re.match(r'<span class="g-name" data-name="([^"]*)"></span>', body)
    head = esc(title)
    if nm:
        body = body[nm.end():]
        head += " <span class=\"g-nm\">(" + inline(nm.group(1), ctx) + ")</span>" if title else inline(nm.group(1), ctx)
    if collapse:
        return '<details class="g-callout ' + cls + '"><summary>' + head + "</summary>" + body + "</details>"
    return '<div class="g-callout ' + cls + '"><div class="g-ct">' + head + "</div>" + body + "</div>"


# ---------------------------------------------------------------- footnotes
def split_footnotes(text):
    lines = text.split("\n")
    body, defs, cur = [], {}, None
    i = 0
    while i < len(lines):
        m = re.match(r"^\[\^(\w+)\]:\s*(.*)$", lines[i])
        if m:
            cur = m.group(1); defs[cur] = [m.group(2)]; i += 1
            while i < len(lines):
                l = lines[i]
                if re.match(r"^\[\^\w+\]:", l):
                    break
                if l.strip() == "" or l.startswith("  ") or l.startswith("\t"):
                    defs[cur].append(l); i += 1; continue
                break
            continue
        body.append(lines[i]); i += 1
    return "\n".join(body), {k: "\n".join([v[0]] + dedent(v[1:])).strip() for k, v in defs.items()}


def split_sections(text):
    """Split at top-level '## ' headings (outside fences, details and code)."""
    lines = text.split("\n")
    secs, cur, depth, det, code = [], None, 0, 0, False
    pre = []
    for ln in lines:
        s = ln.strip()
        if s.startswith("```"):
            code = not code
        if not code:
            if OPEN_FENCE.match(ln):
                depth += 1
            elif CLOSE_FENCE.match(ln):
                depth -= 1
            det += ln.count("<details") - ln.count("</details>")
            if depth == 0 and det == 0 and re.match(r"^##\s+", ln):
                cur = [re.sub(r"^##\s+", "", ln).strip(), []]
                secs.append(cur)
                continue
        (cur[1] if cur else pre).append(ln)
    return pre, secs


def render(lines, footdefs):
    ctx = Ctx(dict(footdefs))
    html = blocks(lines, ctx)
    # footnotes may reference further footnotes; render in order of first use
    notes, k = [], 0
    while k < len(ctx.order):
        fid = ctx.order[k]
        src = ctx.footdefs.get(fid, "")
        notes.append("<li>" + re.sub(r"^<p>(.*)</p>$", r"\1", blocks(src.split("\n"), ctx), flags=re.S) + "</li>")
        k += 1
    if notes:
        html += '<ol class="g-fns">' + "".join(notes) + "</ol>"
    return html


def main():
    texts = {ch: (SRC / f).read_text(encoding="utf-8") for ch, f in FILES.items()}
    for t in texts.values():
        collect_names(t)
    order, sections = [], {}
    for ch, t in texts.items():
        PY["ns"], PY["n"], PY["file"] = {}, 0, slugify(ch)
        body, foot = split_footnotes(t)
        pre, secs = split_sections(body)
        if not secs:  # Úvod has no subsections
            secs = [[ch, pre]]
        for title, lines in secs:
            slug = slugify(title)
            sections[slug] = {"title": title, "chapter": ch, "html": render(lines if isinstance(lines, list) else lines, foot)}
            order.append(slug)
    out = {"order": order, "sections": sections}
    pathlib.Path(__file__).with_name("guide.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    for s in order:
        print(f"{s:55s} {len(sections[s]['html']):7d}  [{sections[s]['chapter']}]")


main()
