# Contributing

## Working on a course

1. Make a branch for your change (`git switch -c calc1-more-limits`).
2. Change only your course's folder, `courses/<id>/`. The file formats are in
   [courses/README.md](courses/README.md).
3. New units, lessons or questions get their ids: `python tools/assign_ids.py <id>`.
4. Run `python build.py` and open `site/index.html` to check your change. The build validates
   every course and points to `file:line` when something is wrong. If you have Playwright
   (see the README), `python tools/test_app.py` also checks every answer and generator.
5. Open a pull request. GitHub runs the build, a JavaScript syntax check and the browser tests
   (`tools/test_app.py`) on it, and asks the course's owner to review (see `.github/CODEOWNERS`).

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
maintainer first. After a change, run `python tools/test_app.py`.

## Protecting `main` (maintainer, once)

On GitHub: **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.

- Name `main`, **Enforcement: Active**, **Target branches → Add target → Include default branch**.
- Tick **Restrict deletions** and **Block force pushes**.
- Tick **Require a pull request before merging** and inside it **Require review from Code Owners**.
- Tick **Require status checks to pass** and add the check **check** (it appears after the first
  pull request has run).
- Under **Bypass list**, add **Repository admin**, so you can still push small fixes directly.

Then colleagues' changes reach the live app only through a reviewed pull request whose tests pass.
