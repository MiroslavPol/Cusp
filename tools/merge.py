"""Merge question additions into a course file.
bank/<file>.txt: blocks "### Lesson title" followed by items; "%% ..." lines are verification notes (stripped).
bank/counter.txt: ">> prompt substring" followed by "+/-" option lines: counterexamples for false tf items.
Usage: python tools/merge.py courses/<id>/lessons.txt add1.txt [add2.txt ...] [--counter counter.txt]"""
import re, sys
args = sys.argv[1:]; counter = None
if "--counter" in args:
    i = args.index("--counter"); counter = args[i + 1]; args = args[:i] + args[i + 2:]
course, adds = args[0], args[1:]
lines = open(course, encoding="utf-8").read().split("\n")
blocks = {}
for a in adds:
    cur = None
    for l in open(a, encoding="utf-8").read().split("\n"):
        if l.startswith("%%"): continue
        m = re.match(r"^### (.*)", l)
        if m: cur = m.group(1).strip(); blocks.setdefault(cur, []); continue
        if cur is not None: blocks[cur].append(l)
# lesson ranges
heads = [(i, l[4:].split("|")[0].strip()) for i, l in enumerate(lines) if l.startswith("### ")]
ends = {}
for k, (i, t) in enumerate(heads):
    j = i + 1
    while j < len(lines) and not lines[j].startswith("### ") and not lines[j].startswith("## "): j += 1
    while j > i + 1 and not lines[j - 1].strip(): j -= 1
    ends[t] = j
missing = [t for t in blocks if t not in ends]
if missing: print("UNKNOWN LESSONS:", missing); sys.exit(1)
ins = {}
for t, body in blocks.items():
    while body and not body[-1].strip(): body.pop()
    while body and not body[0].strip(): body.pop(0)
    ins[ends[t]] = body
out = []
for i, l in enumerate(lines):
    if i in ins: out.extend(ins[i])
    out.append(l)
if len(lines) in ins: out.extend(ins[len(lines)])
# counterexamples
if counter:
    entries = []; cur = None
    for l in open(counter, encoding="utf-8").read().split("\n"):
        if l.startswith(">> "): cur = [l[3:].strip(), []]; entries.append(cur)
        elif cur and re.match(r"^[+-] ", l): cur[1].append(l)
    for key, opts in entries:
        hits = [i for i, l in enumerate(out) if l.startswith("? tf | false") and any(key in out[k] for k in range(i + 1, min(i + 4, len(out))))]
        if len(hits) != 1: print("COUNTER", len(hits), "matches:", key); continue
        j = hits[0] + 1
        while j < len(out) and out[j].strip() and not re.match(r"^(\?!? |### |## |> )", out[j]): j += 1
        if any(re.match(r"^[+-] ", out[k]) for k in range(hits[0] + 1, j)): print("ALREADY HAS OPTIONS:", key); continue
        out[j:j] = opts
open(course, "w", encoding="utf-8").write("\n".join(out))
print("merged", sum(len(b) for b in blocks.values()), "lines into", len(blocks), "lessons")
print("Now give the new questions ids:  python tools/assign_ids.py <course id>")
