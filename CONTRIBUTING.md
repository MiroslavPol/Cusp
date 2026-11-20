# Contributing

## Working on a course

1. Make a branch for your change (`git switch -c calc1-more-limits`).
2. Change only your course's folder, `courses/<id>/`. The file formats are in
   [courses/README.md](courses/README.md).
3. Run `python build.py` and open `site/index.html` to check your change. The build validates
   every course and points to `file:line` when something is wrong.
4. Open a pull request. GitHub runs the same build plus a JavaScript syntax check on it, and asks
   the course's owner to review (see `.github/CODEOWNERS`).

If you use an AI agent (Claude Code, Codex, Cursor, …), it reads [AGENTS.md](AGENTS.md), which
keeps it inside your course folder. Still tell it which course you're working on.

## A new course

```bash
python tools/new_course.py <id> "Title"
```

The course starts as a draft, visible only in admin mode (tap the XP pill 7 times). Remove
`"draft": true` from its `course.json` when it's ready. Add yourself as its owner in
`.github/CODEOWNERS` in the same pull request.

## Changing the interface

`app/`, `build.py` and `tools/` are shared by every course. Open an issue or talk to the
maintainer first. After a change, check that every course still builds and plays: the Learn path
of each course, a lesson, and the Feed.
