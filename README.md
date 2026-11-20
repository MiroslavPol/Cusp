# Cusp

A math learning app that ships as a single page: a Duolingo-style **Learn** path for each course, plus
one Instagram-style **Feed** that mixes theory and exercises from all courses.

## Quick start

```bash
python build.py                        # build site/ and pwa/ from the sources
python -m http.server 8000 -d site     # then open http://localhost:8000
```

Opening `site/index.html` directly (double-click) works too. You need internet the first time
because KaTeX loads from a CDN. You need Python 3.8+; nothing else is required to build.

In VS Code: **Terminal → Run Build Task** (Ctrl+Shift+B) builds. **Run Task → Serve** starts the
local server.

**Admin mode:** tap the XP pill (top right) 7 times within 3 s. Every lesson unlocks, draft courses
appear, and you get a "Vynulovat postup" (reset progress) button.

## How the repository is organised

```
build.py               builds the app (finds every course automatically)
app/                   THE INTERFACE: shared by all courses, see app/README.md
courses/               THE CONTENT: one self-contained folder per course, see courses/README.md
  calc1/               Matematická analýza I (M1100), with its guide (Sprievodca)
  hs/                  Středoškolské opakování
tools/                 helpers that work on one course at a time (new_course, insert_icons, …)
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

## The feed

The Feed tab is one endless scroll over every course. It needs no setup: each course adds its
material automatically.

| | comes from | share |
|---|---|---|
| theory | posts in `feed.txt` (def, thm, proof, cex, hist, tip) and learn cards (`> Title`) in `lessons.txt` | 70 % |
| exercises | questions (`? kind`) in `lessons.txt` and `feed.txt` posts of type app or exam | 30 % |

Pinned posts come first. Inside each group the order is shuffled and doesn't repeat until
everything has been shown. Chips at the top filter by course or show saved posts. Tapping
**Odpovědět** on a question opens it in the lesson player. The answer updates spaced repetition
the same way it would in a lesson. The 70 % share is `THEORY_SHARE` in `app/js/feed.js`.

Everything is shown from day one. Lecture dates are only used for labels.

## Learn path and spaced repetition

The Learn tab is a map. Each course is a spiral that starts on the outer rim and winds into a
black hole, the **singularity**: a final test of 12 questions from every unit, which unlocks when
all core lessons are done. Drag to move, pinch or use the wheel or the ± buttons to zoom, ⌖ flies
to your next lesson and ◎ shows the whole spiral. Tap a stop to see what it is; its card has the
Start button. Unit names run along the outside of their arc and lecture numbers (P1, P2 …) along
the inside. The spiral sits on a coordinate grid that is flat far away and twisted around the
hole. The metric of that twist is written on the rim. All of this is `app/js/path.js`.

A lesson shows `LESSON_Q = 7` questions drawn from its pool (at most 3 generated ones), plus 2
review questions from finished lessons. These constants are in `app/js/learn.js`. Each unit ends
with a checkpoint.

Each answered question gets a Leitner box (`P.srs[key] = [box, dueDay]`). Answering correctly on
the first try moves it up a box (due again in 1, 3, 7, 16 or 35 days). A mistake sends it back to
box 0, due tomorrow. Questions due today appear behind the **"Opakování na dnes · N"** button on
the path.

## Storage

All progress lives in the browser's `localStorage` under `lemma.*` keys: `lemma.learn` (progress,
XP, spaced repetition), `lemma.course`, `lemma.admin`, `lemma.f.liked` and `lemma.f.saved`. It
belongs to one browser and origin, so localhost and the published app keep separate progress.
Question keys contain the course id (`calc1-u3-l2-q5`), so courses never share progress.

## Phone app (PWA) on GitHub Pages

`build.py` writes two versions:

- `site/index.html` is a single file that loads KaTeX from a CDN, e.g. for a claude.ai artifact.
- `pwa/` is the **installable app**. It bundles KaTeX, a manifest, icons and a service worker,
  so it works offline after the first visit.

### Publish (one time)

1. Create a GitHub repository and push this folder to the `main` branch.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. `.github/workflows/pages.yml` builds and deploys. After a minute or so the app is at
   `https://<you>.github.io/<repo>/`. Check the **Actions** tab if it doesn't appear.

After that, every push to `main` updates the app. Installed copies pick up the new version the
next time they're opened online. Pull requests are checked by `.github/workflows/check.yml`,
which runs the build and a JavaScript syntax check.

### Install on a phone

- **Android (Chrome):** open the link → menu ⋮ → **Install app**.
- **iPhone (Safari):** open the link → Share → **Add to Home Screen**.

The app opens full screen and works offline. Web fonts are cached after the first online visit;
until then it falls back to system fonts. On iPhone, the home-screen app keeps its progress
separate from Safari.

### Test locally

Run the **Build** task, then **Serve app (PWA, offline test)** → `http://localhost:8001`. In
Chrome DevTools → Application you can see the manifest and service worker, and tick *Offline* to
test. Service workers only run over `http://localhost` or `https`, not from a double-clicked file.

### Later: App Store / Google Play

Wrap `pwa/` with [Capacitor](https://capacitorjs.com): `npx cap init`, `webDir: "pwa"`, then
`npx cap add android` / `ios`. The app itself needs no changes.
