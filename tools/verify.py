"""Usage: python3 tools/verify.py additions.txt  (needs sympy and node)
Check the %% notes of bank files: py (SymPy) and deriv/antider/inverse/same (numerically, with the app's own parser)."""
import sys, json, subprocess, math
from sympy import *
import re as rx
x, n, t, k = symbols('x n t k', real=True)
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
TR = standard_transformations + (implicit_multiplication_application, convert_xor)
def sy(s):
    s = s.strip().replace('π', ' pi ').replace('∞', 'oo').replace('²', '^2').replace('³', '^3').replace('√', ' sqrt ')
    s = rx.sub(r'ln\s*', 'log ', s)
    s = rx.sub(r'(?<![a-z])e(?![a-z])', ' E ', s)
    return parse_expr(s, transformations=TR, local_dict={'E': E, 'pi': pi, 'oo': oo})
def close(a, b, tol=1e-6):
    a, b = complex(N(a)), complex(N(b)) if not (b in (oo, -oo)) else b
    if b in (oo, -oo): return a == b
    return abs(a - b) <= tol * max(1, abs(b))
def setclose(a, b): a = sorted(float(N(v)) for v in a); b = sorted(float(N(v)) for v in b); return len(a) == len(b) and all(abs(p - q) < 1e-6 for p, q in zip(a, b))
bad = 0; node_jobs = []; total = 0
for f in sys.argv[1:]:
    cur = None; lesson = None
    for i, l in enumerate(open(f, encoding='utf-8').read().split('\n'), 1):
        if l.startswith('### '): lesson = l[4:]; continue
        m = rx.match(r'^\? (\w+)(?:\s+#[A-Za-z0-9_-]+)?(?:\s*\|\s*(.*))?$', l)   # an optional #id after the kind
        if m:
            parts = [p.strip() for p in (m.group(2) or '').split('|')]
            cur = {'kind': m.group(1), 'answer': parts[0], 'flags': parts[1:] if m.group(1) == 'expr' else [], 'line': i, 'file': f}
            continue
        m = rx.match(r'^%% (\w+): (.*)$', l)
        if not m or not cur: continue
        typ, body = m.groups(); total += 1
        if typ == 'py':
            ans = cur['answer'].split(';')[0] if cur['kind'] == 'input' else cur['answer']
            env = dict(globals())
            try:
                if cur['kind'] == 'input': env['A'] = sy(ans)
                if cur['kind'] == 'set':
                    raw = [p for p in rx.split(r';', cur['answer'].strip('{}')) if p.strip()]
                    vals = []
                    for p in raw:
                        p = p.strip()
                        if p.startswith('±'): v = sy(p[1:]); vals += [v, -v]
                        elif p == '∅': pass
                        else: vals.append(sy(p))
                    env['S'] = vals
                ok = eval(body, env)
            except Exception as e:
                ok = False; print(f"{f}:{i} ERROR {e} :: {body}")
            if not ok: bad += 1; print(f"{f}:{i} FAIL [{lesson}] {cur['answer']} :: {body}")
        else:
            node_jobs.append({'typ': typ, 'f': body, 'answer': cur['answer'], 'flags': cur['flags'], 'where': f"{f}:{i}"})
if node_jobs:
    js = r'''
global.window = {}; require(require('path').join(process.argv[1] || '', 'answers.js')); const A = window.LEMMA_ANS;
const jobs = JSON.parse(require('fs').readFileSync(0, 'utf8')); let bad = 0;
for (const j of jobs) {
  try {
    const spec = A.exprSpec({ answer: j.answer, flags: j.flags }), v = spec.vars[0];
    const ans = A.parse(j.answer, spec.vars), ref = A.parse(j.f, spec.vars);
    const ev = (tree, val) => { const e = {}; e[v] = val; return A.evaluate(tree, e); };
    let ok = true, used = 0, consts = [];
    for (let i = 0; i < 9; i++) {
      const p = spec.dom[0] + (spec.dom[1] - spec.dom[0]) * (i + 0.37) / 9.13, h = 1e-5;
      let lhs, rhs;
      if (j.typ === 'deriv') { lhs = ev(ans, p); rhs = (ev(ref, p + h) - ev(ref, p - h)) / (2 * h); }
      else if (j.typ === 'antider') { lhs = (ev(ans, p + h) - ev(ans, p - h)) / (2 * h); rhs = ev(ref, p); }
      else if (j.typ === 'inverse') { lhs = ev(ref, ev(ans, p)); rhs = p; }
      else { lhs = ev(ans, p); rhs = ev(ref, p); }
      if (!isFinite(lhs) || !isFinite(rhs)) continue;
      used++;
      if (Math.abs(lhs - rhs) > 1e-4 * Math.max(1, Math.abs(rhs))) ok = false;
    }
    if (!ok || used < 4) { bad++; console.log(j.where, 'FAIL', j.typ, j.answer, 'vs', j.f, 'points', used); }
  } catch (e) { bad++; console.log(j.where, 'ERROR', e.message, j.answer, j.f); }
}
console.log('node checks', jobs.length, 'failed', bad);
'''
    import os
    build = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app', 'js')   # answers.js
    r = subprocess.run(['node', '-e', js, build], input=json.dumps(node_jobs), capture_output=True, text=True)
    print(r.stdout.strip(), r.stderr.strip()[:500])
print('py/num checks', total, 'failed (py)', bad)
