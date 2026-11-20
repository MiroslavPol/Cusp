"""Start a new course.

    python tools/new_course.py <course id> "Course title"

Creates courses/<id>/ with a working example of every file. The course starts as a draft
("draft": true in course.json): it is only visible in admin mode (tap the XP pill 7 times)
until you delete that line. Then run  python build.py  and open site/index.html.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 3:
    sys.exit(__doc__)
cid, title = sys.argv[1], sys.argv[2]
if not re.match(r"^[a-z][a-z0-9-]*$", cid):
    sys.exit("The course id must be lowercase letters, digits and '-', starting with a letter (e.g. 'linalg1').")
d = ROOT / "courses" / cid
if d.exists():
    sys.exit(f"courses/{cid} already exists.")
d.mkdir(parents=True)


def write(name, text):
    (d / name).write_text(text, encoding="utf-8", newline="\n")


write("course.json", json.dumps({
    "title": title,
    "short": title[:4],
    "handle": cid,
    "lang": "cs",
    "order": 50,
    "draft": True,
    "blurb": "Krátký popis kurzu (jedna nebo dvě věty).",
}, ensure_ascii=False, indent=2) + "\n")

write("lessons.txt", """## První kapitola
### První lekce
> Nový pojem
Text vysvětlení s matematikou: $f(x) = x^2$ a
$$\\int_0^1 x^2\\,dx = \\frac13.$$
@@ x=-2..2; f=x^2
? mc
Kolik je $2+2$?
+ $4$
- $3$
- $5$
! Sečteme: $2+2=4$.
? tf | true
Funkce $x^2$ je sudá.
! $(-x)^2 = x^2$.
? input | 1/3; 0.3333
Spočtěte $\\int_0^1 x^2\\,dx$.
! $\\left[\\frac{x^3}{3}\\right]_0^1 = \\frac13$.
? gen | example_sum
""")

write("feed.txt", """=== def | | Ukázková definice | f(x) = x^2
Text příspěvku do feedu. Typy: def thm proof cex app exam hist tip.

=== thm | | Ukázková věta | a^2+b^2=c^2
Znění věty.
--- proof
Důkaz se zobrazí po klepnutí na tlačítko.
""")

write("generators.js", f"""/* Random question generators for this course. In lessons.txt, "? gen | name" calls G.name.
   Each generator returns a fresh question object (see app/js/genkit.js for the helpers in K). */
LEMMA_GEN.define("{cid}", function (K, G) {{
  "use strict";
  var ri = K.ri, P = K.P, inp = K.inp;

  G.example_sum = function () {{
    var a = ri(2, 9), b = ri(2, 9);
    return inp(P("Kolik je $" + a + " + " + b + "$?"), String(a + b), "$" + a + " + " + b + " = " + (a + b) + "$.");
  }};
}});
""")

write("icons.py", f"""# Lesson icons for this course: lesson title -> icon spec (coordinates in [-1,1]^2, see app/js/path.js).
# Apply with:  python tools/insert_icons.py {cid}   (rewrites the "~ " line under each "### " lesson)
ICONS = {{
"První lekce": "f=x^2-0.5",
}}
""")

# give the example's units, lessons and questions their permanent ids (tools/assign_ids.py)
import importlib.util
spec = importlib.util.spec_from_file_location("assign_ids", ROOT / "tools" / "assign_ids.py")
ids = importlib.util.module_from_spec(spec); spec.loader.exec_module(ids)
lp = d / "lessons.txt"
lp.write_text("\n".join(ids.assign(lp.read_text(encoding="utf-8").split("\n"))[0]), encoding="utf-8", newline="\n")
print(f"Created courses/{cid}/ (course.json, lessons.txt, feed.txt, generators.js, icons.py).")
print("Next: python build.py, then open site/index.html; turn on admin mode to see the draft.")
