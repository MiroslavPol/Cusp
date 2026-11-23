# Instructions for AI coding agents

Cusp is one web app with several courses. Different people, each with their own agent, work on
different courses. Stay inside your scope so you never break someone else's course.

## Scope

1. **Find out which course you are working on** (`courses/<id>/`). If the request doesn't make
   it clear, ask. Don't guess.
2. **Course work changes only files inside `courses/<id>/`.** That covers lessons, questions,
   feed posts, generators, icons, figures, the guide and course.json.
3. **Never edit another course's folder**, not even to "fix" or "align" it. If you notice a
   problem there, mention it in your reply instead.
4. **Don't change `app/`, `build.py`, `tools/` or `.github/`** unless the user explicitly asks
   for an interface or build change. These are shared by every course. If a course needs a new
   feature (a new question type, a new figure primitive), stop and say so rather than
   building it in passing.
5. `site/` and `pwa/` are build output. Never edit them by hand.

## Ids

Every unit (`## … | #id`), lesson (`### … | #id`) and question (`? kind #id`) has a permanent id;
students' progress is stored under it. **Never edit, reuse or invent ids.** After adding units,
lessons or questions, run `python tools/assign_ids.py <id>`, which fills in the missing ones. When you
copy a question, delete the copied `#id` first. Don't edit `legacy-ids.json`.

## Before you finish

- Run `python build.py`. It validates every course and must end without "Build stopped".
- Run `python tools/test_app.py` (browser tests) too if Playwright is installed. It is required after
  changes in `app/`. For course work it checks that every question's own answer is accepted and that
  every generator works.
- If you changed `generators.js` and have Node, run `node --check courses/<id>/generators.js`.
- After new questions or a change to how things are displayed, play them at phone width:
  `python tools/playthrough.py <id> "Lesson title"` (the whole of calc1 takes about 20 minutes). It
  answers each question right and wrong and lists anything cut off, misjudged or not typeset.

## Formats

All file formats are in `courses/README.md`. Follow the existing course files as examples
(`courses/calc1/` is the largest). Keep each course in its own language as set in
course.json (`lang`); the existing courses are Czech.

**Adding questions to a lesson:** a lesson asks 7 questions per play, so its pool can be much larger;
unanswered ones are offered later from the map. Questions written `?! kind` are asked every time.
When you add questions, look at the whole lesson afterwards and mark with `?!` the few (at most 7,
usually 2 to 4) that every student must meet. See *Which questions a lesson asks* in
`courses/README.md`. Source material (exercise sheets, textbooks) may be outside the repository;
ask the course owner where it is, and never commit it.

Follow the writing rules in `courses/README.md` (*Writing for a phone*, *Notation*): a formula longer
than about half a line goes in `$$…$$`, points are `[1, 2]`, decimals take a comma (`0{,}5`), and an
explanation ends with the result. The right sides of `? match` and the options are shuffled, so never
refer to an option by its position ("the last one").

## How changes reach the app

`main` is protected: it changes only through a pull request whose check (build + tests) passes, and
every push to `main` deploys to <https://miroslavpol.github.io/Cusp/>.

- Work on a branch (`git switch -c <short-name>`), one topic per branch. Commit and push only when
  the user asks; then give them the link `https://github.com/MiroslavPol/Cusp/compare/main...<branch>`
  to open and merge the pull request themselves. Don't delete old branches.
- Students report problems with the in-app *Nahlásit chybu* link, which opens a GitHub issue
  titled `[course] Lesson · id` with the item's text. Read open issues with `gh issue list` or, without
  the GitHub CLI, `curl -s https://api.github.com/repos/MiroslavPol/Cusp/issues?state=open`. Find the
  item by its id in `courses/<id>/lessons.txt`. Write `Fixes #N` in the commit message so merging
  closes the issue. If the item is correct after all, say why and make its explanation clearer.

## On Windows

- Run Python as `python` and install with `python -m pip`, so packages go to the Python that runs the
  tests. Use Edge for the browser tests: `$env:CUSP_BROWSER="msedge"` (PowerShell) or
  `CUSP_BROWSER=msedge` (Git Bash).
- Node may be missing: skip `node --check`, GitHub runs it on the pull request.
- A Python script that rewrites a repository file must write `\n` line endings
  (`open(path, "w", encoding="utf-8", newline="\n")`); Windows would otherwise write CRLF.

## Useful commands

```bash
python build.py                                   # build + validate all courses
python tools/new_course.py <id> "Title"           # start a new course (draft)
python tools/assign_ids.py <id>                   # give new units / lessons / questions their ids
python tools/test_app.py                          # build + browser tests (needs: python -m pip install playwright)
python tools/playthrough.py [<id> ["Lesson" …]]   # play lessons at phone width, list what doesn't fit or judge right
python tools/insert_icons.py <id>                 # write icons.py into lessons.txt
python tools/insert_figs.py <id>                  # write figs.py into lessons.txt
```
