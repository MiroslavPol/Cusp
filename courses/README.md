# Writing a course

Every folder here is one course. The folder name is the course id (lowercase letters, digits
and `-`). `build.py` picks up every folder automatically. No other file needs to change to add
a course.

```
courses/<id>/
  course.json      title, language, schedule, guide …        required
  lessons.txt      units, lessons, learn cards, questions     required
  feed.txt         hand-written posts for the feed             optional
  generators.js    random question generators ("? gen")        optional
  icons.py         lesson icons for the path                   optional, used by tools/insert_icons.py
  figs.py          figure table                                optional, used by tools/insert_figs.py
  guide/           a reader text (guide.json + img/)           optional, see calc1/guide
  legacy-ids.json  old progress keys → ids                     written once by tools/assign_ids.py --legacy
```

Start a new course with `python tools/new_course.py <id> "Title"`, which writes an example of
every file. Then run `python build.py`. The build checks every course and stops with
`file:line` messages if something is wrong (an unknown question kind, a missing generator, a
header without a space, invalid JSON, an `mc` without exactly one `+`, a `tf` that isn't `true` or
`false`, a question without a prompt or answer, a `P#` beyond the lecture dates …).

The build reads the files but not the maths. `python tools/test_app.py` also checks that every
question's own answer is accepted by the checker the students get (a formula that parses and is
defined on its sample range, an interval or set that can be read, alternatives that agree), and
runs every generator 200 times. Run it after adding questions if you can (see the main README).

### Ids: every unit, lesson and question has one

```
## Funkce | P3–P4 | #k2f9a
### Limita posloupnosti | P4 | #q81zd
? mc #7hx0c
? input #rrj8n | 1/2; 0.5
```

Students' progress is stored under these ids, so you can insert, move and reorder freely. After
adding units, lessons or questions, run `python tools/assign_ids.py <id>`: it gives everything
that has no id yet a new one and never changes existing ids. The build stops if something has no
id or an id is used twice. **Never change or reuse an id**. When you copy a question, delete the
copied `#id` and run the tool again. Deleting a question deletes its history, which is fine.

## course.json

```json
{
  "title": "Matematická analýza I",
  "short": "MA I",
  "handle": "m1100.analyza",
  "lang": "cs",
  "order": 10,
  "blurb": "One or two sentences for the course picker.",
  "draft": true,
  "default": true,
  "lectures": ["2026-09-15", "2026-09-17"],
  "guide": { "name": "Sprievodca", "title": "…", "author": "…", "url": "https://…/", "anchors": { "1": "#úvod" } }
}
```

| field | |
|---|---|
| `title`, `lang`, `blurb` | required. `lang` is `cs` or `en` (the interface language while this course is open) |
| `short`, `handle` | the avatar text and the account name on feed posts |
| `order` | position in the course list (smaller first) |
| `draft` | only visible in admin mode. Remove it to publish the course |
| `default` | the course a new visitor sees first (only one course should have it) |
| `lectures` | lecture dates. Lecture *n* is the *n*-th date. Turns on the `P1`, `P2` … labels |
| `guide` | in-app reader. `anchors` maps lecture numbers to guide sections, shown as "Z Průvodce" buttons |
| `report` | where "Nahlásit chybu" sends reports: an `https://…/issues/new` page or `mailto:address`. Default: this repository's GitHub issues |

## lessons.txt

```
## Unit title | P1–P2                 unit (lecture range; "| soon" = locked placeholder)
### Lesson title | P3                 lesson for lecture 3 ("| bonus" = optional lesson)
~ f=x^2; tan=0.5                     lesson icon on the path (written by tools/insert_icons.py)
> Card title                          learn card; the following lines are its HTML/TeX body
@@ x=-2..2; f=x^2                     figure inside the card / question prompt

? mc                                  multiple choice
Prompt text with $TeX$
+ correct option
- wrong option
! Explanation shown after answering
@ x=0..4; f=sqrt(x); tan=sqrt(x),1    figure shown in the explanation (after answering)

? multi                               several correct options (+ lines)
? tf | true                           true/false
? tf | false                          false statement; optional "+/-" lines = second step:
+ counterexample                        "which example disproves it?"
- not a counterexample
? input | 1/2; 0.5                    a number; alternatives (spellings of the same answer) separated by ";"
? expr | 2x cos(x^2)                  a formula, compared with the answer at sample points
? expr | x^3/3 | +C                     … equal up to a constant (antiderivatives)
? expr | sqrt(1-x^2) | dom=-0.9..0.9    … sampled on a given range (default 0.4..2.6)
? expr | 3t^2 | var=t                   … in another variable
= $2x\cos(x^2)$                        optional: how to print the correct answer
? interval | (-∞; -2) ∪ [2; ∞)        an interval or a union of intervals
? set | -2; 2                         a finite set (order and repeats don't matter, ∅ = empty)
? order                               put the "+" lines in order (proof steps)
? build                               assemble the "+" tokens in order; "-" tokens are decoys
? mc  (with "+ @ spec" options)       choose a graph: an option starting with "@ " is a figure
? gen | name                          a fresh instance from this course's generators.js
```

Typed numbers accept fractions, decimal commas, π, e, √, ln, ∞, powers (`e^2`, `e²`, `2^-3`) and
½-style fractions. The tolerance is 1e-3 (relative). Formulas accept implicit multiplication
(`2x cos x`), `sin^2 x`, `e^-x`, `√(1-x²)`, `|x|`, `tg`, `arctg`, `ln`, `log` (base 10) and show a
live preview ("Rozumím: …"). Intervals accept `( )`, `[ ]` and Czech `⟨ ⟩`, separated by `;`.

Learn cards are the *theory* of the feed and questions are its *exercises*, so a course with
good learn cards also gets a good feed.

## feed.txt

```
=== type | P# | Title | cover TeX [| pin] [| #guide-anchor]
Body (HTML + $TeX$)
--- proof | solution | hint            collapsible section
```

Types: `def thm proof cex app exam hist tip`. `app` and `exam` count as exercises, the rest as
theory. `P#` is the lecture (it may be empty for courses without lectures). The cover is the
large formula on the post. `pin` puts the post at the top of the feed.

## generators.js

```js
LEMMA_GEN.define("<course id>", function (K, G) {
  var ri = K.ri, P = K.P, inp = K.inp;
  G.my_sum = function () {
    var a = ri(2, 9), b = ri(2, 9);
    return inp(P("Kolik je $" + a + " + " + b + "$?"), String(a + b), "Vysvětlení.");
  };
});
```

Use it in lessons.txt as `? gen | my_sum`. Generators belong to their course, so other courses
may reuse the name. Helpers in `K` (from `app/js/genkit.js`): `ri(a,b)` random integer,
`pick(list)`, `nz(a,b)` non-zero integer, `fr(p,q)` fraction, `ft` / `fs` / `ans` fraction as
TeX / answer string, `poly([[coef, power], …])` polynomial TeX, `P(text)` paragraph,
`mc(html, right, [wrong…], explain)`, `inp(html, answer, explain)`,
`expr(html, answer, explain, flags, show)`, `ivl(…)`, `set(…)`, `withFig(spec, question)`.
If this file has an error, only this course's generated questions disappear. The rest of the
app keeps working, and the browser console names the file.

## Figure spec (`@`, `@@`, figs.py, `withFig`)

`x=a..b; y=c..d; aspect=equal; axes=off` then any of:
`f=expr` · `seq=expr(n)` · `rec=a1; expr(a)` · `param=x(t),y(t),t0,t1` · `shade=f,g,a,b` ·
`rect=upper|lower,f,a,b,n` · `tan=f,x0` · `sec=f,x1,x2` · `pt=x,y` · `hole=x,y` · `vline=x` ·
`hline=y` · `band=y1,y2` · `vband=x1,x2` · `poly=x1,y1,...` · `circle=cx,cy,r` · `label=x,y,text`.
Expressions use `^`, `pi`, `E`, `sin cos tan asin acos atan sinh cosh exp ln sqrt abs floor sign cbrt`
and ternaries (`x<0?-1:1`, `NaN` = gap). If `y` is omitted, the range is chosen automatically.

Usually you write `@`/`@@` lines straight into lessons.txt (MA I does). Optionally, a course can
keep its figures in a table, `figs.py`, which `python tools/insert_figs.py <id>` writes into
lessons.txt. It removes all `@`/`@@` lines first, so use it only if the table is the source of
truth for your course. It refuses to write if a table entry doesn't match exactly one item.

## Lesson icons (icons.py)

Each lesson node shows a small plot. Icons use the figure-spec style, but coordinates are in
[-1,1]² and the plot is drawn in the node colour. Edit the table in `icons.py` and run
`python tools/insert_icons.py <id>`:

`f=expr` · `fd=expr` (dashed) · `seq=expr(n)` with `N=8` · `pt=x,y` · `hole=x,y` ·
`line/dash/bar/arrow=x1,y1,x2,y2` · `tan=x0` · `sec=a,b` · `shade=a,b` · `between=a,b` ·
`rect=a,b,n` · `band=y1,y2` · `circle=cx,cy,r` · `ell=cx,cy,rx,ry` · `poly=x1,y1,...` ·
`text=∫` with `size=1` · `ax=x0,y0` (axis origin) · `noaxes`.

## Guide (in-app reader)

`guide/guide.json` holds `{"order": [slug…], "sections": {slug: {"title", "chapter", "html"}}}`,
and `guide/img/` its images. For MA I it is generated from Quarto sources:
`python courses/calc1/guide/convert.py` (needs `pip install matplotlib numpy`).

## Adding questions in bulk

Write new items in a separate file under `### Lesson title` headers, optionally with check lines
`%% py: <SymPy condition on A or S>` or `%% deriv: f` / `%% antider: f` / `%% inverse: f` /
`%% same: g` for formulas, then:

```bash
python tools/verify.py my-additions.txt                                # needs sympy (+ node for %% deriv etc.)
python tools/merge.py courses/<id>/lessons.txt my-additions.txt [--counter counter.txt]
python tools/assign_ids.py <id>
```

Without Node, `verify.py` runs the `%% py` checks and skips the formula ones, and says how many it
skipped. `python tools/test_app.py` still checks that every formula answer is valid, but not that it is
the right derivative.
