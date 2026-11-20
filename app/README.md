# app/: the interface

Shared by every course. A change here affects all courses, so it needs the maintainer's review
(see `.github/CODEOWNERS`). Course content never goes here; it belongs in `courses/<id>/`.

```
shell.html          page skeleton; build.py fills in the markers @HEAD @CSS @HTML @COURSES @JS
css/
  base.css          theme tokens (light + dark), page column, buttons, math
  learn.css         header, course picker, lesson player, keypad, guide reader, figures
  feed.css          feed posts, learn cards and questions in the feed
  path.css          the Learn view as a space map: spiral, twisted grid, black hole, HUD (always dark)
html/
  learn.html        Learn view, tab bar, course sheet
  feed.html         Feed view
  overlays.html     lesson player, guide reader, toast
js/                 loaded in this order (see build.py):
  fig.js            tiny SVG plotting engine for figures (@, @@)
  answers.js        parsing and checking typed answers: formulas, intervals, sets
  genkit.js         helpers + registry for courses/<id>/generators.js
  (courses/*/generators.js)
  path.js           the Learn map: spiral geometry, twisted coordinate grid, pan & zoom, lesson icons
  feed.js           the cross-course feed
  strings.js        every interface text, per language (cs, en)
  core.js           courses and loading their data, stable ids, progress, spaced repetition, backup, helpers
  guide.js          the guide reader
  player.js         the lesson player (all question kinds), also for single questions from the feed
  map.js            the Learn view: header, the map's stops and card, course picker, admin mode
  main.js           tabs and start-up
pwa/                service worker template, app icons (make_icons.py needs Pillow)
vendor/katex/       KaTeX 0.16.9 (MIT) for the offline app
vendor/fonts/       the web fonts, self-hosted (SIL OFL), with fonts.css
```

The modules share one object, `window.CUSP` (defined in `core.js`), and talk through it:
`C.on("progress" | "admin" | "loaded", fn)` / `C.emit(...)`. The course registry is embedded in
the page (`<script id="courses">`); a course's lessons, feed posts, guide and legacy-id map come
from `<script id="data-<id>">` in `site/` or from `data/<id>.json` in `pwa/` (`C.load(course)`).
Interface texts are in `strings.js`; a course's `lang` picks the language.
