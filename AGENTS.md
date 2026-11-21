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

## Formats

All file formats are in `courses/README.md`. Follow the existing course files as examples
(`courses/calc1/` is the largest). Keep each course in its own language as set in
course.json (`lang`); the existing courses are Czech.

Follow the writing rules in `courses/README.md` (*Writing for a phone*, *Notation*): a formula longer
than about half a line goes in `$$…$$`, points are `[1, 2]`, decimals take a comma (`0{,}5`), and an
explanation ends with the result. The right sides of `? match` and the options are shuffled, so never
refer to an option by its position ("the last one").

## Useful commands

```bash
python build.py                                   # build + validate all courses
python tools/new_course.py <id> "Title"           # start a new course (draft)
python tools/assign_ids.py <id>                   # give new units / lessons / questions their ids
python tools/test_app.py                          # build + browser tests (needs: python -m pip install playwright)
python tools/insert_icons.py <id>                 # write icons.py into lessons.txt
python tools/insert_figs.py <id>                  # write figs.py into lessons.txt
```
