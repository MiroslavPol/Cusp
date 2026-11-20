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
  learn.js          courses, progress, spaced repetition, path, lesson player, tabs (the core)
pwa/                service worker template, app icons (make_icons.py needs Pillow)
vendor/katex/       KaTeX 0.16.9 (MIT) for the offline app
```

`learn.js` reads the courses from the data blocks that `build.py` embeds
(`<script id="courses">`, `lessons-<id>`, `feed-<id>`, `guide-<id>`) and shares what the feed
needs as `window.LEMMA`. Interface texts are in `STR` at the top of `learn.js` (`cs` and `en`).
