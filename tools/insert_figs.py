"""Write the figures of one course into its lessons.txt.

    python tools/insert_figs.py <course id> [--force]

Reads FIGS from courses/<id>/figs.py, a list of
    ("L", learn-card title, spec)    figure inside that learn card            -> "@@ spec"
    ("Q", question substring, spec)  figure in the question                   -> "@@ spec"
    ("A", question substring, spec)  figure in the explanation after answering -> "@ spec"
removes every existing "@ " / "@@ " line from courses/<id>/lessons.txt and inserts the table's
figures again. Figure spec: see "Figure spec" in courses/README.md.
"""
import pathlib
import re
import runpy
import sys
sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORCE = "--force" in sys.argv[1:]
args = [a for a in sys.argv[1:] if a != "--force"]
if len(args) != 1:
    sys.exit(__doc__)
course = ROOT / "courses" / args[0]
FIGS = runpy.run_path(str(course / "figs.py"))["FIGS"]
path = course / "lessons.txt"
src = [l for l in path.read_text(encoding="utf-8").split("\n") if not re.match(r"^@@? ", l)]

items = []  # [kind, start line, last non-empty line, text]
cur = None
for i, l in enumerate(src):
    if l.startswith("> ") or l.startswith("? ") or l.startswith("?! ") or l.startswith("#"):
        if cur: items.append(cur)
        cur = None
        if l.startswith("> "): cur = ["L", i, i, l[2:].strip()]
        elif l.startswith("? ") or l.startswith("?! "): cur = ["Q", i, i, ""]
    elif cur is not None:
        if cur[0] == "Q" and not re.match(r"^[+\-!] ", l): cur[3] += l + "\n"
        if l.strip(): cur[2] = i
if cur: items.append(cur)

ins, errors, lcur = {}, 0, -1
for kind, key, spec in FIGS:
    if kind == "L":
        c = [k for k, it in enumerate(items) if it[0] == "L" and it[3] == key and k > lcur]
        if not c: print("NO LEARN CARD", key); errors += 1; continue
        lcur = c[0]
        ins.setdefault(items[c[0]][2], []).append("@@ " + spec)
    else:
        c = [it for it in items if it[0] == "Q" and key in it[3]]
        if len(c) != 1: print(len(c), "MATCHES", key); errors += 1; continue
        ins.setdefault(c[0][2], []).append(("@@ " if kind == "Q" else "@ ") + spec)
if errors and not FORCE:
    sys.exit(f"{errors} figure(s) could not be placed; nothing was written. Fix figs.py, or run with --force to write anyway.")
out = []
for i, l in enumerate(src):
    out.append(l)
    out.extend(ins.get(i, []))
path.write_text("\n".join(out), encoding="utf-8", newline="\n")   # keep LF line endings on Windows too
print(path.relative_to(ROOT).as_posix(), "figures inserted:", sum(len(v) for v in ins.values()), "errors:", errors)
