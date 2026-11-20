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

## Before you finish

- Run `python build.py`. It validates every course and must end without "Build stopped".
- If you changed `generators.js` and have Node, run `node --check courses/<id>/generators.js`.
- If students already use the course, don't reorder or delete existing units, lessons or
  questions. Add new questions at the end of a lesson. Keys like `calc1-u3-l2-q5` come from
  positions, and students' spaced-repetition history depends on them.

## Formats

All file formats are in `courses/README.md`. Follow the existing course files as examples
(`courses/calc1/` is the largest). Keep each course in its own language as set in
course.json (`lang`); the existing courses are Czech.

## Useful commands

```bash
python build.py                                   # build + validate all courses
python tools/new_course.py <id> "Title"           # start a new course (draft)
python tools/insert_icons.py <id>                 # write icons.py into lessons.txt
python tools/insert_figs.py <id>                  # write figs.py into lessons.txt
```
