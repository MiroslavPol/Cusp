"""Give every unit, lesson and question of a course a permanent id.

    python tools/assign_ids.py <course id>            add ids where they are missing
    python tools/assign_ids.py <course id> --legacy   also write legacy-ids.json (see below)

Progress (done lessons, spaced repetition, mistakes, likes) is stored under these ids, so a question
keeps its history when lessons are reordered or new questions are inserted. The ids look like
    ## Funkce | P3–P4 | #k2f9a          ### Limita posloupnosti | P4 | #q81zd          ? mc #7hx0c
Existing ids are never changed. When you copy a question, delete the copied "#id" and run this again.

--legacy is for a course whose students already have progress under the old positional keys
("calc1-u3-l2-q5"): it writes courses/<id>/legacy-ids.json, which maps those keys to the new ids, and
the app moves everyone's progress over the first time it loads. Run it once, on the version that is live.
"""
import json
import pathlib
import random
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parent.parent
ID = re.compile(r"^#[A-Za-z0-9_-]+$")
Q = re.compile(r"^\? (\w+)(?:\s+#([A-Za-z0-9_-]+))?(\s*\|.*)?$")
ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"


def head_id(rest):
    """id in a "## " / "### " header (a "| #id" part), or None."""
    parts = [p.strip() for p in rest.split("|")]
    ids = [p[1:] for i, p in enumerate(parts) if i > 0 and ID.match(p)]
    return ids[0] if ids else None


def slug(s):   # the same as C.slug in app/js/core.js
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(ch for ch in s if not ("̀" <= ch <= "ͯ"))
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:48]


def existing_ids(lines):
    out = set()
    for l in lines:
        if l.startswith("## ") or l.startswith("### "):
            i = head_id(l.split(" ", 1)[1])
            if i: out.add(i)
        m = Q.match(l)
        if m and m.group(2): out.add(m.group(2))
    return out


def assign(lines, rng=random.SystemRandom()):
    taken = existing_ids(lines)
    def new():
        while True:
            i = "".join(rng.choice(ALPHABET) for _ in range(5))
            if i not in taken and not i.isdigit():
                taken.add(i); return i
    out, added = [], 0
    for l in lines:
        if (l.startswith("## ") or l.startswith("### ")) and not head_id(l.split(" ", 1)[1]):
            l = l.rstrip() + " | #" + new(); added += 1
        else:
            m = Q.match(l.rstrip())
            if m and not m.group(2):
                l = "? " + m.group(1) + " #" + new() + (m.group(3) or ""); added += 1
        out.append(l)
    return out, added


def legacy_map(cid, old_lines, new_lines, feed_text):
    """old positional keys (as the app used them before ids) -> new keys."""
    def walk(lines):
        units = []
        for l in lines:
            if l.startswith("## "):
                units.append({"id": head_id(l[3:]), "lessons": []})
            elif l.startswith("### "):
                units[-1]["lessons"].append({"id": head_id(l[4:]), "q": [], "cards": []})
            elif l.startswith("> ") and units and units[-1]["lessons"]:
                units[-1]["lessons"][-1]["cards"].append(l[2:].strip())
            else:
                m = Q.match(l.rstrip())
                if m and units and units[-1]["lessons"]:
                    units[-1]["lessons"][-1]["q"].append(m.group(2))
        return units
    old, new = walk(old_lines), walk(new_lines)
    M = {cid + "-final": cid + ":final"}
    for ui, (uo, un) in enumerate(zip(old, new)):
        ou = f"{cid}-u{ui + 1}"
        M[ou + "-cp"] = f"{cid}:u:{un['id']}:cp"
        for li, (lo, ln) in enumerate(zip(uo["lessons"], un["lessons"])):
            ol, nl = f"{ou}-l{li + 1}", f"{cid}:l:{ln['id']}"
            M[ol] = nl
            for qi, qid in enumerate(ln["q"]):
                M[f"{ol}-q{qi + 1}"] = f"{cid}:q:{qid}"
            for k, title in enumerate(ln["cards"]):            # feed likes/saves of learn cards
                M[f"{ol}:card{k + 1}"] = f"{nl}:c:{slug(title)}"
    # feed posts: "<cid>:post:<index>" and the former profile wall's "p-<lecture>-<index>"
    blocks = [b for b in re.split(r"^=== ", feed_text or "", flags=re.M) if b.strip()]
    for i, b in enumerate(blocks):
        h = [x.strip() for x in b.split("\n", 1)[0].split("|")]
        title = h[2] if len(h) > 2 else ""
        n = int((re.findall(r"\d+", h[1]) or ["1"])[0]) if len(h) > 1 and re.findall(r"\d+", h[1]) else 1
        new_id = f"{cid}:post:{slug(title or str(i))}"
        M[f"{cid}:post:{i}"] = new_id
        M[f"p-{n}-{i}"] = new_id
    return M


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    course = ROOT / "courses" / args[0]
    path = course / "lessons.txt"
    if not path.exists():
        sys.exit(f"{path.relative_to(ROOT).as_posix()} not found")
    old = path.read_text(encoding="utf-8").split("\n")
    new, added = assign(old)
    path.write_text("\n".join(new), encoding="utf-8", newline="\n")
    print(f"{path.relative_to(ROOT).as_posix()}: {added} ids added")
    if "--legacy" in sys.argv:
        if existing_ids(old):
            sys.exit("--legacy only makes sense on a file without ids (positions are only meaningful before ids exist).")
        feed = course / "feed.txt"
        M = legacy_map(args[0], old, new, feed.read_text(encoding="utf-8") if feed.exists() else "")
        out = course / "legacy-ids.json"
        out.write_text(json.dumps(M, ensure_ascii=False, indent=0) + "\n", encoding="utf-8", newline="\n")
        print(f"{out.relative_to(ROOT).as_posix()}: {len(M)} old keys mapped")


if __name__ == "__main__":
    main()
