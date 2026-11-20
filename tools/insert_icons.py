"""Write the lesson icons of one course into its lessons.txt.

    python tools/insert_icons.py <course id>

Reads the ICONS table (lesson title -> icon spec) from courses/<id>/icons.py and rewrites the
"~ " line under every "### " lesson header of courses/<id>/lessons.txt. Lessons that are not in
the table get no icon (the path then shows a star). Icon spec: see the top of app/js/path.js.
"""
import pathlib
import re
import runpy
import sys
sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 2:
    sys.exit(__doc__)
course = ROOT / "courses" / sys.argv[1]
ICONS = runpy.run_path(str(course / "icons.py"))["ICONS"]
path = course / "lessons.txt"
lines = [l for l in path.read_text(encoding="utf-8").split("\n") if not l.startswith("~ ")]
out, missing = [], []
for l in lines:
    out.append(l)
    m = re.match(r"^### (.*)", l)
    if m:
        title = m.group(1).split("|")[0].strip()
        if title in ICONS: out.append("~ " + ICONS[title])
        else: missing.append(title)
path.write_text("\n".join(out), encoding="utf-8", newline="\n")   # keep LF line endings on Windows too
print(path.relative_to(ROOT).as_posix(), "icons:", sum(1 for l in out if l.startswith("~ ")), "without icon:", missing)
