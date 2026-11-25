# Cusp

A math learning app that ships as a single page: a Duolingo-style **Learn** path for each course, plus
one Instagram-style **Feed** that mixes theory and exercises from all courses.

**Open the app: <https://miroslavpol.github.io/Cusp/>** (installable on a phone, see
[Install on a phone](#install-on-a-phone)).

## Quick start

```bash
python build.py                        # build site/ and pwa/ from the sources
python -m http.server 8000 -d site     # then open http://localhost:8000
```

Opening `site/index.html` directly (double-click) works too. You need internet the first time
because KaTeX loads from a CDN. You need Python 3.8+; nothing else is required to build.

In VS Code: **Terminal → Run Build Task** (Ctrl+Shift+B) builds. **Run Task → Serve** starts the
local server, **Run Task → Test** runs the browser tests.

### Tests

```bash
python -m pip install playwright && python -m playwright install chromium     # once
python tools/test_app.py                                            # builds, then tests both builds
```

The tests use the app like a student would: the map, a whole lesson answered correctly, the
feed, saving, the guide, backup and restore, the migration of old progress, and the installable
app offline and on a slow network. They also check the content: every question's own answer must be
accepted by the checker that judges the students, and every generator is run 200 times.
`python -m pip` installs into the Python that runs the tests (a plain `pip` may belong to another
Python, for example a conda environment). On Windows you can skip the Chromium download and use Edge:
`set CUSP_BROWSER=msedge` (PowerShell: `$env:CUSP_BROWSER="msedge"`). GitHub runs the same tests
on every pull request and before every deploy, so a failing test keeps the old version online.

`python tools/playthrough.py [course ["Lesson" …]]` goes further, slower (about 25 minutes for all
courses): it plays every lesson at phone width (375 px, `--width` to change), answers each question
right and wrong, and lists what is cut off, judged wrongly or not typeset, with screenshots in
`playthrough/`. Run it after adding many questions or changing how things are displayed.

**Admin mode:** tap the XP pill (top right) 7 times within 3 s. Every lesson unlocks, draft courses
appear, and you get a "Vynulovat postup" (reset progress) button.

## How the repository is organised

```
build.py               builds the app (finds every course automatically)
app/                   THE INTERFACE: shared by all courses, see app/README.md
courses/               THE CONTENT: one self-contained folder per course, see courses/README.md
  calc1/               Matematická analýza I (M1100), with its guide (Sprievodca)
  hs/                  Středoškolské opakování
tools/                 helpers that take a course id (new_course, assign_ids, insert_icons, …) + test_app.py
site/, pwa/            build output (generated, not in git)
```

The rule that keeps contributors out of each other's way: **work on a course = change only
`courses/<that course>/`**. The interface in `app/` is shared, so changes there affect every
course and need the maintainer's review. See [CONTRIBUTING.md](CONTRIBUTING.md) for people and
[AGENTS.md](AGENTS.md) for AI coding agents.

### Add a course

```bash
python tools/new_course.py linalg1 "Lineární algebra I"
python build.py
```

The new course starts as a draft, visible only in admin mode, until you remove `"draft": true`
from its `course.json`. The file formats are in [courses/README.md](courses/README.md).

## Home

The app opens on **Home** (the first tab; `#learn` and `#feed` in the address open those tabs
directly). At the top are the cusp from the app icon, the name and the tagline *studentský
open-source projekt* ("an open-source student project"). Below it is the next lesson of the current course,
which starts with one tap, then today's review, streak, XP and finished lessons, and a three-line
"how it works" (Learn, Feed, review). A new student sees the explanation and the first lesson first.
Everything is in `app/js/home.js`, `app/html/home.html` and `app/css/home.css`; the texts (`home`,
`tagline`, `h…`) are in `app/js/strings.js`.

## The feed

The Feed tab is one endless scroll over every course. It needs no setup: each course adds its
material automatically.

| | comes from | share |
|---|---|---|
| theory | posts in `feed.txt` (def, thm, proof, cex, hist, tip) and learn cards (`> Title`) in `lessons.txt` | 70 % |
| exercises | questions (`? kind`) in `lessons.txt` and `feed.txt` posts of type app or exam | 30 % |

"Vše" (all courses) starts with a short word about the feed, which the student can hide (×); a
course's pinned posts (`pin` in `feed.txt`) come first only in that course's own filter and are
mixed in normally in "Vše". Half of the picks come from what matters now: theory of the last three
lectures (or, without a schedule, the lessons you've reached), and questions that are due for
review or that you got wrong. The rest is everything else. Inside each group the order is
shuffled and doesn't repeat until everything has been shown. Chips at the top filter by course or
show saved posts.

Multiple-choice, true/false and select-all questions are answered right in the post. The other
kinds (typed answers, ordering) open in the lesson player. Either way the answer updates spaced
repetition just like in a lesson. The shares are `THEORY_SHARE`, `FOCUS` and `RECENT_LECTURES` at
the top of `app/js/feed.js`. Nothing is hidden: future lectures' material appears too, only less
often.

## Learn path and spaced repetition

The Learn tab is a map. Each course is a spiral that starts on the outer rim and winds into a
black hole, the **singularity**: a final test of 12 questions from every unit, which unlocks when
all core lessons are done. Drag to move, pinch or use the wheel or the ± buttons to zoom, ⌖ flies
to your next lesson and ◎ shows the whole spiral. Tap a stop to see what it is; its card has the
Start button. Unit names run along the outside of their arc and lecture numbers (P1, P2 …) along
the inside. The spiral sits on a coordinate grid that is flat far away and twisted around the
hole. The metric of that twist is written on the rim. All of this is `app/js/path.js`.

A lesson shows `LESSON_Q = 7` questions drawn from its pool (at most 3 generated ones), plus 2
review questions from finished lessons. These constants are in `app/js/player.js`. Each unit ends
with a checkpoint.

Lessons, checkpoints and the final test give `HEARTS = 3` lives (also in `player.js`). Each wrong
answer costs one. After the last one the student sees the correct answer, then an "out of lives"
screen: the lesson isn't marked done and starts again from the beginning with a fresh draw of
questions. The mistakes still go to spaced repetition. The daily review and the feed have no lives,
and a question whose own answer is broken never costs one.

Each answered question gets a Leitner box (`P.srs[key] = [box, dueDay]`). Answering correctly on
the first try moves it up a box (due again in 1, 3, 7, 16 or 35 days). A mistake sends it back to
box 0, due tomorrow. Questions due today appear behind the **"Opakování na dnes · N"** button on
the path.

## Storage

All progress lives in the browser's `localStorage` under `cusp.*` keys: `cusp.learn` (progress,
XP, spaced repetition), `cusp.course`, `cusp.lang` (the interface language, if chosen), `cusp.admin`,
`cusp.f.liked`, `cusp.f.saved`, `cusp.f.introHidden` (the feed's intro was closed) and `cusp.bk`
(when the last backup was made). The interface follows the course's language (all courses are Czech
now) unless the student picks another in the course menu under *Jazyk rozhraní*. It belongs to one browser and origin, so localhost and the
published app keep separate progress. If the app is open twice (two tabs, or the installed app and
the browser), each save first takes in what the other one saved, so neither overwrites the other.
If the browser refuses to save (storage full or blocked), the student is told once and asked to make
a backup.

**Backup:** a constellation in the sky next to the map's spiral (an arrow dropping into a tray,
*Záloha*, with the date of the last backup; it glows when a backup is due) opens the backup card. The
course picker has the same box. *Zálohovat* downloads a `.json` file on a computer and opens the
share sheet on a phone or tablet, so you can send it to yourself or save it to Files. *Obnovit*
restores from the file or from pasted text.
Restoring merges: nothing on the device is lost, the backup only adds or moves things forward.
After 5 finished lessons, and then every 10, the lesson's done screen suggests a backup (every 5 if
the student skips it). The constants are `BK_FIRST`, `BK_EVERY` and `BK_SNOOZE` in `app/js/core.js`.

**Report a problem:** every learn card, answered question and feed post has a *Nahlásit chybu*
link. It opens a new GitHub issue with the course, the lesson, the item's id and its text filled in
(students need a GitHub account). A course can send its reports elsewhere with `"report"` in
`course.json`, for example a `mailto:` address. If a question's own answer can't be used (a typo
the tests missed), the player says so, lets the student skip it and offers the same link.

**Stable ids:** progress is stored under ids like `calc1:q:7hx0c`, which are written into
`lessons.txt` by `tools/assign_ids.py` (see courses/README.md). Inserting or reordering
questions doesn't touch anyone's history. Progress saved under the old positional keys
(`calc1-u3-l2-q5`) is moved over automatically, using `courses/<id>/legacy-ids.json`.

## Phone app (PWA) on GitHub Pages

`build.py` writes two versions:

- `site/` has every course inside `index.html` (KaTeX from a CDN), plus `img/` and `fonts/`.
- `pwa/` is the **installable app**. Each course's data is its own file (`data/<id>.json`),
  loaded when that course is opened (the feed loads all of them). The page asks for it as
  `data/<id>.json?v=<hash>`, so after an update it never gets the previous version's lessons. It
  bundles KaTeX, the fonts, a manifest, icons and a service worker, so it works offline after the
  first visit, and asks the browser to keep its data (`navigator.storage.persist()`).

The fonts (Instrument Serif, Literata, IBM Plex Mono; SIL Open Font License) are in
`app/vendor/fonts/`, so the app makes no requests to Google or other third parties.

### Publish (one time)

1. Create a GitHub repository and push this folder to the `main` branch.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. `.github/workflows/pages.yml` builds and deploys. After a minute or so the app is at
   `https://<you>.github.io/<repo>/` (this one: <https://miroslavpol.github.io/Cusp/>). Check the
   **Actions** tab if it doesn't appear.

After that, every push to `main` updates the app, after the tests pass. Installed copies pick
up the new version the next time they're opened online. Pull requests are checked by
`.github/workflows/check.yml`: the build, a JavaScript syntax check and the browser tests.

### Install on a phone

- **Android (Chrome):** open the link → menu ⋮ → **Install app**.
- **iPhone (Safari):** open the link → Share → **Add to Home Screen**.

The app opens full screen and works offline after the first visit. On Android the installed app
hides the system bars (`"display": "fullscreen"` in the manifest, written by `build.py`); a swipe from
the top or bottom edge shows them for a moment. If an older install still shows the bars, the
first tap in the app hides them (`app/js/main.js`). iPhone keeps its status bar. A change to these
settings reaches an installed app only when it is installed again (or after Android's own update,
up to a day later). On iPhone, the home-screen
app keeps its progress separate from Safari (the backup moves it across).

### Test locally

Run the **Build** task, then **Serve app (PWA, offline test)** → `http://localhost:8001`. In
Chrome DevTools → Application you can see the manifest and service worker, and tick *Offline* to
test. Service workers only run over `http://localhost` or `https`, not from a double-clicked file.

### Later: App Store / Google Play

Wrap `pwa/` with [Capacitor](https://capacitorjs.com): `npx cap init`, `webDir: "pwa"`, then
`npx cap add android` / `ios`. The app itself needs no changes.
