# Figures of this course. This table is the source of truth for every "@"/"@@" line in lessons.txt:
#     python tools/insert_figs.py linalg1
# removes all of them and writes the figures below again (see courses/README.md, "Figure spec").
#
# The helpers write the figure primitives vec=, seg=, line=, fill= and grid= with a colour name:
# def (blue), ex (pink), prf (green), thm (orange), muted (grey). As in 3Blue1Brown's videos,
# e1 and its image are green and e2 pink.
#
#   F(x0, x1, y0, y1)            a figure window (aspect=equal); F(..., axes=False) without the grid
#   .vec(x, y, c, label, at=(x0, y0))   an arrow from at (default the origin) to at + (x, y)
#   .seg(p, q, c)   .line(p, q, c)      a segment / the whole line through p and q
#   .fill(points)                        a filled polygon (blue, translucent)
#   .grid(A, k=None, c)                  the image of the integer grid under the 2x2 matrix A (k: only |i|, |j| <= k)
#   .path(points, c)                     a polyline through many points (arcs, ellipses)
#   .pt(x, y)  .label(x, y, text)  .raw("f=x^2")
#   3D (oblique projection P): F3(...), .axes3(L), .vec3(v, c, label), .fill3(points), .seg3(p, q, c)
import math

COL = ["def", "ex", "prf", "thm"]


def n(v):
    v = round(v, 3)
    return "%g" % v if v != 0 else "0"


def pw(pieces, var):
    """piecewise-linear expression in var; pieces = [(a0, a1, y0, y1)]: var in [a0, a1) goes from y0 to y1"""
    expr = None
    for a0, a1, y0, y1 in reversed(pieces):
        s = (y1 - y0) / (a1 - a0)
        shift = "%s+%s" % (var, n(-a0)) if a0 < 0 else "%s-%s" % (var, n(a0))      # never "x--1"
        e = n(y0) if abs(s) < 1e-12 else ("%s+%s*(%s)" % (n(y0), n(s), shift)).replace("+-", "-")
        expr = e if expr is None else "%s<%s?%s:%s" % (var, n(a1), e, expr)
    return expr


def P(x, y, z):
    """oblique projection of 3D space: x points towards the viewer (down left), y right, z up"""
    return (y - 0.42 * x, z - 0.32 * x)


def nums(*vs):
    return ",".join(n(v) for v in vs)


class F:
    def __init__(self, x0, x1, y0, y1, axes=True):
        self.parts = ["x=%s..%s" % (n(x0), n(x1)), "y=%s..%s" % (n(y0), n(y1)), "aspect=equal"]
        if not axes:
            self.parts.append("axes=off")
        self.ci, self.sc = 0, max(x1 - x0, y1 - y0)

    def path(self, pts, c="def"):
        """a polyline as one "param" curve; those take the next colour of the cycle, so skip to c"""
        while self.ci % 4 != COL.index(c):
            self.parts.append("param=999,999,0,1")
            self.ci += 1
        self.ci += 1
        m = len(pts) - 1
        xs = [(i, i + 1, pts[i][0], pts[i + 1][0]) for i in range(m)]
        ys = [(i, i + 1, pts[i][1], pts[i + 1][1]) for i in range(m)]
        self.parts.append("param=%s,%s,0,%d" % (pw(xs, "t"), pw(ys, "t"), m))
        return self

    def vec(self, x, y, c="def", label=None, at=(0, 0)):
        x0, y0 = at
        self.parts.append(("vec=%s,%s" % (nums(x, y), c)) if at == (0, 0) else ("vec=%s,%s" % (nums(x0, y0, x0 + x, y0 + y), c)))
        if label:
            L = math.hypot(x, y) or 1
            self.label(x0 + x + 0.07 * self.sc * x / L, y0 + y + 0.07 * self.sc * y / L, label)
        return self

    def seg(self, p, q, c="def"):
        self.parts.append("seg=%s,%s" % (nums(p[0], p[1], q[0], q[1]), c))
        return self

    def line(self, p, q, c="def"):
        self.parts.append("line=%s,%s" % (nums(p[0], p[1], q[0], q[1]), c))
        return self

    def grid(self, A, k=None, c="def"):
        args = [A[0][0], A[0][1], A[1][0], A[1][1]] + ([k] if k is not None else [])
        self.parts.append("grid=%s,%s" % (nums(*args), c))
        return self

    def fill(self, pts, c="def"):
        self.parts.append("fill=%s,%s" % (nums(*[v for p in pts for v in p]), c))
        return self

    def pt(self, x, y):
        self.parts.append("pt=%s,%s" % (n(x), n(y)))
        return self

    def label(self, x, y, t):
        self.parts.append("label=%s,%s,%s" % (n(x), n(y), t))
        return self

    def raw(self, item, colour=False):
        if colour:
            self.ci += 1
        self.parts.append(item)
        return self

    # --- 3D in oblique projection
    def axes3(self, L=2.2, labels=True):
        for v, name in (((L, 0, 0), "x"), ((0, L, 0), "y"), ((0, 0, L), "z")):
            q = P(*v)
            self.seg((0, 0), q, "muted")
            if labels:
                self.label(q[0] * 1.1, q[1] * 1.1 + 0.05, name)
        return self

    def vec3(self, v, c="def", label=None, at=(0, 0, 0)):
        p0, p1 = P(*at), P(at[0] + v[0], at[1] + v[1], at[2] + v[2])
        return self.vec(p1[0] - p0[0], p1[1] - p0[1], c, label, at=p0)

    def seg3(self, p, q, c="def"):
        return self.seg(P(*p), P(*q), c)

    def fill3(self, pts):
        return self.fill([P(*p) for p in pts])

    def __str__(self):
        return "; ".join(self.parts)


def F3(x0=-1.6, x1=2.6, y0=-1.1, y1=2.5):
    return F(x0, x1, y0, y1, axes=False)


def square(A):
    """image of the unit square under the 2x2 matrix A, as a polygon"""
    a, b = (A[0][0], A[1][0]), (A[0][1], A[1][1])
    return [(0, 0), a, (a[0] + b[0], a[1] + b[1]), b]


def basis_picture(A, win=(-1.5, 3, -1.5, 2.5), grid=True, k=None):
    """3Blue1Brown style: the transformed grid, the image of the unit square and of e1 (green), e2 (pink)"""
    f = F(*win)
    if grid:
        f.grid(A, k, "def")
    f.fill(square(A))
    f.vec(A[0][0], A[1][0], "prf", "Ae₁").vec(A[0][1], A[1][1], "ex", "Ae₂")
    return f


def square_pic(A):
    """a small answer option: image of the unit square under A, e1 green, e2 pink, the same window for all"""
    return str(F(-2.2, 2.2, -2.2, 2.2).fill(square(A)).vec(A[0][0], A[1][0], "prf").vec(A[0][1], A[1][1], "ex"))


def cross_pic(w):
    """a small answer option: u = e1 (green), v = e2 (pink) and a candidate w for u x v (blue)"""
    return str(F3(-1.6, 2.2, -1.6, 2).fill3([(0, 0, 0), (1.4, 0, 0), (1.4, 1.4, 0), (0, 1.4, 0)]).axes3(1.8, labels=False)
               .vec3((1.4, 0, 0), "prf").vec3((0, 1.4, 0), "ex").vec3(w, "def"))


def grid_pic(B, vecs, win, k=None):
    """the grid of the basis given by the columns of B, the basis vectors (green, pink) and further vectors (orange)"""
    f = F(*win).grid(B, k, "def").vec(B[0][0], B[1][0], "prf", "u₁").vec(B[0][1], B[1][1], "ex", "u₂")
    for v, lab in vecs:
        f.vec(v[0], v[1], "thm", lab)
    return f


S = str
FIGS = [
# ---------------------------------------------------------------- Soustavy lineárních rovnic
("L", "Geometrický pohled", S(F(-1, 4, -1, 4).line((0, 1), (1, 3), "def").line((0, 5), (5, 0), "ex").pt(2, 3).label(2.5, 3.2, "[2, 3]"))),
("A", "Řešte soustavu $2x - y = 1$, $x + y = 5$", S(F(-1, 4, -1, 5).line((0, -1), (1, 1), "def").line((0, 5), (5, 0), "ex").pt(2, 3))),
("A", "Kolik řešení má soustava $x+y=1$, $2x+2y=3$", S(F(-1, 3, -1.5, 2.5).line((0, 1), (1, 0), "def").line((0, 1.5), (1.5, 0), "ex"))),
("A", "Soustava tří rovnic o dvou neznámých může mít právě jedno", S(F(-1, 3, -1, 3).line((0, 1), (1, 1), "def").line((0, 2), (2, 0), "ex").line((1, 0), (1, 1), "prf").pt(1, 1))),
("A", "Jak vypadá v prostoru množina řešení jediné rovnice $x + y + z = 1$", S(F3(-1.2, 1.8, -0.8, 1.7).fill3([(1, 0, 0), (0, 1, 0), (0, 0, 1)]).axes3(1.6).seg3((1, 0, 0), (0, 1, 0), "def").seg3((0, 1, 0), (0, 0, 1), "def").seg3((0, 0, 1), (1, 0, 0), "def"))),
("A", "Pro která $a\\in\\mathbb R$ nemá soustava $x + ay = 1$, $ax + y = 1$", S(F(-2.5, 2.5, -2, 2).line((0, -1), (1, 0), "def").line((0, 1), (1, 2), "ex").label(1.6, 0.2, "x − y = 1").label(-1.2, 0.2, "−x + y = 1"))),
("A", "Pro která $a\\in\\mathbb R$ má soustava $x + ay = 1$, $ax + y = 1$ nekonečně", S(F(-1.5, 2.5, -1.5, 2.5).line((0, 1), (1, 0), "def").label(1.3, 0.5, "x + y = 1"))),
("A", "Pro jaké $t$ prochází přímky $x + y = 2$", S(F(-1, 3, -1, 3).line((0, 2), (2, 0), "def").line((0, 0), (1, 1), "ex").line((0, 1), (1, 1), "prf").pt(1, 1))),
("L", "Přímka a rovina", S(F(-1, 4, -1, 3).line((0.5, 0.5), (2.5, 1.5), "def").pt(0.5, 0.5).label(0.4, 0.15, "A").vec(2, 1, "ex", "u", at=(0.5, 0.5)))),
("A", "Přímky $x + y = 3$ a $x - y = 1$ v rovině se protínají", S(F(-1, 4, -1, 4).line((0, 3), (3, 0), "def").line((1, 0), (2, 1), "ex").pt(2, 1))),
("A", "Která rovnice popisuje přímku v rovině procházející body $[1", S(F(-0.5, 4, -0.5, 7).line((1, 2), (3, 6), "def").pt(1, 2).pt(3, 6).vec(2, 4, "ex", "(2, 4)ᵀ", at=(1, 2)))),
("A", "Dvě přímky v prostoru, které nemají společný bod, jsou rovnoběžné", S(F3().axes3(2).seg3((-1.5, 0, 0), (2.2, 0, 0), "def").seg3((0, -1.2, 1), (0, 2, 1), "ex").label(*P(0, 2, 1.25), "q"))),
("L", "Goniometrický tvar a Moivreova věta", S(F(-1.4, 1.4, -1.2, 1.3).raw("circle=0,0,1").vec(0.766, 0.643, "def", "z").path([(0.3 * math.cos(t / 10), 0.3 * math.sin(t / 10)) for t in range(0, 8)], "thm").label(0.42, 0.14, "φ"))),
("A", "Kolik je $|3-4i|$?", S(F(-1, 4, -4.5, 1).vec(3, -4, "def", "3 − 4i").seg((3, 0), (3, -4), "thm").label(1.5, 0.3, "3").label(3.35, -2, "4"))),
("A", "Který je goniometrický tvar čísla $1 - i\\sqrt3$?", S(F(-2.3, 2.3, -2.3, 2.3).raw("circle=0,0,2").vec(1, -1.732, "def", "1 − i√3").path([(0.5 * math.cos(-t / 10), 0.5 * math.sin(-t / 10)) for t in range(0, 11)], "thm"))),
("A", "Jaký je argument čísla $i$ ve stupních", S(F(-1.5, 1.5, -1.2, 1.4).raw("circle=0,0,1").vec(0, 1, "def", "i"))),
# ---------------------------------------------------------------- Počítání s maticemi
("L", "Vektory jako sloupce", S(F(-2.5, 3, -0.5, 3.5).vec(2, 1, "prf", "1·s₁").vec(-2, 2, "ex", at=(2, 1)).label(1.6, 2.4, "2·s₂").vec(0, 3, "def").label(-0.45, 3.1, "Ax"))),
("A", "Pro $A = \\begin{pmatrix}1&-1\\\\-1&1\\end{pmatrix}$ a $x = (1,1)^T$", S(F(-1.6, 1.6, -1.4, 1.4).vec(1, -1, "prf", "s₁").vec(-1, 1, "ex", "s₂"))),
("A", "Matice $R = \\begin{pmatrix}\\cos\\alpha & -\\sin\\alpha", S(F(-1.6, 2, -0.4, 2).vec(1.5, 0.5, "prf", "u").vec(-0.5, 1.5, "ex", "Ru").path([(0.6 * math.cos(0.32 + i * 0.157), 0.6 * math.sin(0.32 + i * 0.157)) for i in range(11)], "thm").label(0.25, 0.75, "90°"))),
("A", "Matice $A = \\begin{pmatrix}0{,}5 & 0\\\\ 0 & 2\\end{pmatrix}$ p", "x=0..8; y=-1..12; seq=10*0.5^n; seq=0.1*2^n"),
("L", "Matice pohybuje rovinou", S(basis_picture([[2, -1], [1, 1]], (-2.5, 3, -1.5, 2.5)))),
("L", "Galerie zobrazení", S(basis_picture([[0.866, -0.5], [0.5, 0.866]], (-1.8, 1.8, -0.6, 1.6), grid=False).label(-0.9, 1.4, "otočení o 30°"))),
("Q", "Matice $A$ zobrazí $e_1$ na $(2,1)^T$ a $e_2$ na $(-1,1)^T$", S(F(-1.6, 2.8, -0.6, 1.8).vec(2, 1, "prf", "Ae₁").vec(-1, 1, "ex", "Ae₂"))),
("A", "Která matice popisuje souměrnost podle přímky $y = x$?", S(F(-0.6, 2, -0.6, 2).line((0, 0), (1, 1), "thm").vec(1.6, 0.5, "prf", "u").vec(0.5, 1.6, "ex", "Su").seg((1.6, 0.5), (0.5, 1.6), "def"))),
("A", "Na co zobrazí zkosení $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ jednotkový čtverec", S(basis_picture([[1, 1], [0, 1]], (-1.2, 2.8, -1, 1.8)))),
("A", "Matice $P = \\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$ promítá na osu $x$", S(F(-0.5, 2, -0.5, 1.5).vec(1, 1, "def", "u").seg((1, 1), (1, 0), "thm").vec(1, 0, "prf", "Pu"))),
("A", "Nejdřív zkosení $B = \\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$, potom otočení", S(basis_picture([[0, -1], [1, 1]], (-1.8, 1.6, -0.6, 2.2), grid=False))),
("A", "Zobrazení $x\\mapsto Ax$ zobrazí každou přímku procházející počátkem", S(F(-2, 2, -1.6, 1.6).line((0, 0), (1, 0.5), "def").line((0, 0), (1.5, 1), "ex").vec(1, 0.5, "def", "u").vec(1.5, 1, "ex", "Au"))),
("A", "Projekce $P = \\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$ na osu $x$ má inverzní", S(F(-1, 1.8, -0.4, 2.3).pt(0, 1).pt(0, 2).vec(0, -0.9, "ex", at=(0, 1.9)).vec(0, -0.85, "thm", at=(0, 0.9)).pt(0, 0).label(0.3, 1, "(0,1)").label(0.3, 2, "(0,2)"))),
# ---------------------------------------------------------------- Vektorové prostory
("L", "Příklady podprostorů", S(F(-2.5, 2.5, -1.8, 1.8).line((0, 0), (2, 1), "def").line((0, 1), (2, 2), "ex").pt(0, 0).label(1.6, 1.15, "podprostor").label(-1.2, 0.85, "není"))),
("A", "Které množiny jsou podprostory $\\mathbb R^3$?", S(F3().fill3([(1.5, -1, 0), (1.5, 1.5, 0), (-1, 1.5, 0), (-1, -1, 0)]).axes3(2))),
("A", "Sjednocení dvou podprostorů je vždy podprostor", S(F(-0.6, 1.8, -0.6, 1.6).line((0, 0), (1, 0), "def").line((0, 0), (0, 1), "def").vec(1, 0, "prf").vec(0, 1, "ex").vec(1, 1, "thm", "(1,1)ᵀ"))),
("A", "Která množina je podprostorem $\\mathbb R^2$?", "x=-2..2; y=-3..4; f=2*x; f=2*x+1; f=x^2"),
("L", "Lineární kombinace a obal", S(F(-0.5, 4.2, -0.6, 3).vec(2, 0.5, "prf", "2u").vec(1, 2, "ex", at=(2, 0.5)).label(2.25, 1.6, "v").vec(3, 2.5, "def").label(1.1, 1.85, "2u + v"))),
("L", "Obal geometricky", S(F(-2.5, 3, -1.5, 2).line((0, 0), (2, 1), "def").vec(1, 0.5, "ex", "u").vec(1, 0.5, "thm", "2u", at=(1, 0.5)).vec(-1, -0.5, "prf", "−u").label(-1.6, -1.2, "[u]"))),
("A", "Vyjádřete $(5,1)^T = a(1,1)^T + b(1,-1)^T$", S(F(-0.5, 5.5, -1, 3.6).vec(1, 1, "prf").vec(1, 1, "prf", at=(1, 1)).vec(1, 1, "prf", "3·(1,1)ᵀ", at=(2, 2)).vec(1, -1, "ex", at=(3, 3)).vec(1, -1, "ex", "2·(1,−1)ᵀ", at=(4, 2)).vec(5, 1, "def"))),
("A", "Které obaly se rovnají celému $\\mathbb R^2$?", S(F(-2.5, 2.8, -1, 4.5).line((0, 0), (1, 2), "thm").vec(1, 2, "def", "(1,2)ᵀ").vec(2, 4, "ex", "(2,4)ᵀ"))),
("A", "Co je lineární obal $[(1,0,0)^T]$ v $\\mathbb R^3$?", S(F3().axes3(2).seg3((-1.5, 0, 0), (2.4, 0, 0), "thm").vec3((1, 0, 0), "def", "e₁"))),
("A", "Co je obal $[(1,1,0)^T, (0,0,1)^T]$ v $\\mathbb R^3$?", S(F3(-1.8, 2.6, -1.1, 2.4).fill3([(1.4, 1.4, -0.4), (1.4, 1.4, 1.8), (-0.8, -0.8, 1.8), (-0.8, -0.8, -0.4)]).axes3(2).vec3((1, 1, 0), "ex", "(1,1,0)ᵀ").vec3((0, 0, 1), "prf", "e₃"))),
# ---------------------------------------------------------------- Nezávislost a báze
("L", "Jak si to představit", S(F(-0.5, 3.2, -0.6, 2.4).vec(2, 0.5, "prf", "u").vec(0.5, 1.5, "ex", "v").vec(2.5, 2, "def", "u + v").seg((2, 0.5), (2.5, 2), "thm").seg((0.5, 1.5), (2.5, 2), "thm"))),
("A", "Pro které $t$ jsou vektory $(1,2)^T$ a $(3,t)^T$", S(F(-1, 4, -1, 7).line((0, 0), (1, 2), "thm").vec(1, 2, "def", "(1,2)ᵀ").vec(3, 6, "ex", "(3,6)ᵀ"))),
("A", "Jsou-li vektory $u, v, w$ po dvou lineárně nezávislé", S(F(-0.5, 1.8, -0.5, 1.6).vec(1, 0, "prf", "u").vec(0, 1, "ex", "v").vec(1, 1, "def", "w"))),
("A", "Každé tři vektory v $\\mathbb R^2$ jsou lineárně závislé", S(F(-1, 3, -0.6, 2.8).vec(2, 0.5, "prf", "u").vec(-0.75, 1.8, "ex", at=(2, 0.5)).label(2.05, 1.7, "1,5v").vec(1.25, 2.3, "def", "w").vec(-0.5, 1.2, "ex", "v"))),
("L", "Báze", S(F(-1.5, 2.5, -1.5, 1.8).grid([[1, 1], [1, -1]], None, "def").vec(1, 1, "prf", "u₁").vec(1, -1, "ex", "u₂"))),
("A", "Které dvojice tvoří bázi $\\mathbb R^2$?", S(F(-1, 3, -0.6, 4.4).line((0, 0), (1, 2), "thm").vec(1, 2, "def", "(1,2)ᵀ").vec(2, 4, "ex", "(2,4)ᵀ"))),
("A", "Kterým vektorem lze doplnit $(1,1,0)^T$, $(0,1,1)^T$ na bázi", S(F3(-1.8, 2.6, -1.1, 2.4).fill3([(0, 0, 0), (1, 1, 0), (1, 2, 1), (0, 1, 1)]).axes3(2).vec3((1, 1, 0), "prf").vec3((0, 1, 1), "ex").vec3((1, 0, 0), "def", "e₁"))),
# ---------------------------------------------------------------- Dimenze a souřadnice
("L", "Souřadnice geometricky", S(F(-1.2, 4.8, -1.8, 2.8).grid([[1, 1], [1, -1]], None, "def").vec(1, 1, "prf", "u₁").vec(1, -1, "ex", "u₂").vec(4, 2, "thm", "v = 3u₁ + u₂"))),
("A", "Jakou první souřadnici má vektor $(4,2)^T$ v bázi", S(F(-0.6, 4.8, -0.6, 3.6).vec(3, 3, "prf", "3u₁").vec(1, -1, "ex", "u₂", at=(3, 3)).vec(4, 2, "def", "(4,2)ᵀ"))),
("A", "Jakou první souřadnici má vektor $(3, 1)^T$ v bázi", S(F(-0.6, 3.6, -0.6, 2.6).vec(2, 2, "prf", "2u₁").vec(1, -1, "ex", "u₂", at=(2, 2)).vec(3, 1, "def", "(3,1)ᵀ"))),
("L", "Průnik a součet", S(F3(-1.8, 2.6, -1.2, 2.4).fill3([(1.5, -1, 0), (1.5, 1.6, 0), (-1, 1.6, 0), (-1, -1, 0)]).axes3(2).seg3((0, 0, -0.8), (0, 0, 2.2), "ex").label(*P(0, 0.25, 2.1), "W").label(*P(1.4, 1.4, 0.1), "V"))),
("A", "$V$ a $W$ jsou dvě různé přímky v $\\mathbb R^2$ procházející počátkem", S(F(-2, 2, -1.5, 1.5).line((0, 0), (2, 1), "def").line((0, 0), (-1, 2), "ex").pt(0, 0).label(1.6, 1.05, "V").label(-0.9, 1.3, "W"))),
("A", "$V$ a $W$ jsou dvě různé roviny v $\\mathbb R^3$ procházející počátkem", S(F3(-2, 2.6, -1.4, 2.2).fill3([(1.5, -1, 0), (1.5, 1.6, 0), (-1, 1.6, 0), (-1, -1, 0)]).fill3([(1.5, 0, -1), (1.5, 0, 1.8), (-1, 0, 1.8), (-1, 0, -1)]).seg3((-1.6, 0, 0), (2.2, 0, 0), "ex").label(*P(2.3, 0, 0.2), "V ∩ W"))),
("L", "Geometrická báze a Binetův vzorec", "x=0..9; y=-2..36; seq=(((1+sqrt(5))/2)^n-((1-sqrt(5))/2)^n)/sqrt(5); f=((1+sqrt(5))/2)^x/sqrt(5)"),
# ---------------------------------------------------------------- Lineární zobrazení
("L", "Lineární zobrazení geometricky", S(basis_picture([[1, 1], [0, 1]], (-1.6, 2.8, -1.4, 1.8)))),
("A", "Které zobrazení roviny je lineární?", S(basis_picture([[0.866, -0.5], [0.5, 0.866]], (-1.8, 1.8, -0.6, 1.6)))),
("A", "Otočení o $90^\\circ$ kolem počátku zobrazí vektor $(3,1)^T$", S(F(-1.8, 3.6, -0.6, 3.6).vec(3, 1, "def", "(3,1)ᵀ").vec(-1, 3, "ex", "(−1,3)ᵀ"))),
("A", "Která matice promítá rovinu kolmo na přímku $y = x$?", S(F(-0.6, 2.2, -0.6, 1.6).line((0, 0), (1, 1), "thm").vec(2, 0, "def", "u").seg((2, 0), (1, 1), "ex").vec(1, 1, "prf", "Pu"))),
("L", "Jádro a obraz", S(F(-2, 2.2, -1.6, 1.6).line((0, 0), (0, 1), "ex").line((0, 0), (1, 0), "prf").vec(1.2, 1, "def", "u").seg((1.2, 1), (1.2, 0), "thm").pt(1.2, 0).label(0.35, 1.4, "ker").label(1.75, 0.25, "im"))),
("A", "Jakou dimenzi má jádro projekce $\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$", S(F(-2, 2, -1.5, 1.5).line((0, 0), (0, 1), "ex").line((0, 0), (1, 0), "prf").label(0.4, 1.2, "ker").label(1.6, 0.25, "im"))),
("A", "Souměrnost $\\varphi$ podle přímky $y = x$ zapíšeme v bázi", S(F(-1.6, 1.8, -1.4, 1.6).line((0, 0), (1, 1), "thm").vec(1, 1, "prf", "u₁ = φ(u₁)").vec(1, -1, "ex", "u₂").vec(-1, 1, "def", "φ(u₂)"))),
("A", "Matice otočení roviny o $90^\\circ$ v kladném směru", S(F(-1.6, 1.6, -0.5, 1.5).vec(1, 0, "prf", "e₁").vec(0, 1, "ex").vec(-1, 0, "def", "φ(e₂)").label(0.45, 1.2, "e₂ = φ(e₁)"))),
# ---------------------------------------------------------------- Matice přechodu
("L", "Matice přechodu", S(F(-1.6, 2.8, -1.6, 2.8).grid([[1, 1], [1, 2]], None, "def").vec(1, 1, "prf", "u₁").vec(1, 2, "ex", "u₂").vec(1, 0, "thm", "e₁"))),
("A", "V $\\mathbb R^2$ je $\\alpha = \\big((1,1)^T, (1,2)^T\\big)$ a $(u)_\\alpha = (2,-1)^T$", S(F(-0.6, 2.6, -0.6, 2.6).vec(2, 2, "prf", "2u₁").vec(-1, -2, "ex", at=(2, 2)).label(1.95, 0.9, "−u₂").vec(1, 0, "def").label(0.5, -0.3, "u"))),
# ---------------------------------------------------------------- Determinanty
("L", "Determinant geometricky", S(basis_picture([[3, 1], [1, 2]], (-1, 4.5, -1, 3.5), grid=False).label(2, 1.5, "obsah 5"))),
("A", "Jaký obsah má obraz jednotkového čtverce v zobrazení $x\\mapsto\\begin{pmatrix}3&1", S(basis_picture([[3, 1], [1, 2]], (-1, 4.5, -1, 3.5)))),
("A", "Co dělá s rovinou zobrazení $x\\mapsto Ax$, když $\\det A = 0$?", S(F(-1, 3.5, -1, 3.5).line((0, 0), (1, 2), "thm").vec(1, 2, "prf", "Ae₁").vec(0.5, 1, "ex", "Ae₂"))),
("A", "Jaký je determinant matice otočení", S(basis_picture([[0.707, -0.707], [0.707, 0.707]], (-1.6, 1.6, -0.5, 1.7), grid=False))),
("A", "Jaký je determinant souměrnosti $\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$", S(basis_picture([[0, 1], [1, 0]], (-0.6, 1.8, -0.6, 1.6), grid=False).line((0, 0), (1, 1), "thm"))),
("A", "Jaký je determinant zkosení $\\begin{pmatrix}1&5\\\\0&1\\end{pmatrix}$?", S(basis_picture([[1, 5], [0, 1]], (-0.6, 6.6, -0.6, 1.8), grid=False))),
# ---------------------------------------------------------------- Aplikace determinantu
("A", "Cramerovým pravidlem řešte $2x+y = 5$, $x+3y = 10$", S(F(-1, 5, -1, 5).line((0, 5), (2.5, 0), "def").line((1, 3), (4, 2), "ex").pt(1, 3))),
("L", "Orientace", S(F(-1.2, 3.2, -0.6, 2.4).vec(2.5, 0.5, "prf", "u").vec(0.8, 1.8, "ex", "v").path([(0.6 * math.cos(0.197 + i * 0.1), 0.6 * math.sin(0.197 + i * 0.1)) for i in range(0, 10)], "thm").label(0.9, 0.85, "det > 0"))),
("L", "Obsah a objem", S(F(-0.5, 4.5, -0.5, 3.5).fill([(0, 0), (3, 1), (4, 3), (1, 2)]).vec(3, 1, "prf", "u").vec(1, 2, "ex", "v").label(2, 1.5, "|det(u v)|"))),
("A", "Jaký obsah má rovnoběžník určený vektory $(3,1)", S(F(-0.5, 4.5, -0.5, 3.5).fill([(0, 0), (3, 1), (4, 3), (1, 2)]).vec(3, 1, "prf", "u").vec(1, 2, "ex", "v"))),
("A", "Jaký obsah má trojúhelník $A = [1,2]$, $B = [3,5]$, $C = [-1,8]$?", S(F(-2, 4, 0, 9).fill([(1, 2), (3, 5), (-1, 8)]).vec(2, 3, "prf", "AB", at=(1, 2)).vec(-2, 6, "ex", "AC", at=(1, 2)))),
("A", "Body jsou $A = [0,0]$, $B = [4,1]$, $C = [1,3]$. Kde leží $C", S(F(-0.5, 5, -0.5, 3.6).line((0, 0), (4, 1), "thm").vec(4, 1, "prf", "AB").vec(1, 3, "ex", "AC").label(0.2, -0.35, "A"))),
("A", "Jaký obsah má trojúhelník $[0,0]$, $[4,1]$, $[1,3]$?", S(F(-0.5, 4.5, -0.5, 3.5).fill([(0, 0), (4, 1), (1, 3)]).vec(4, 1, "prf").vec(1, 3, "ex"))),
("A", "Jaký obsah má rovnoběžník určený vektory $(2,1)^T$ a $(-1,3)^T$?", S(F(-1.5, 2.5, -0.5, 4.5).fill([(0, 0), (2, 1), (1, 4), (-1, 3)]).vec(2, 1, "prf", "u").vec(-1, 3, "ex", "v"))),
("A", "Jaký obsah má obraz jednotkového kruhu v zobrazení", S(F(-3, 3, -3.3, 3.3).raw("circle=0,0,1").path([(2 * math.cos(i * math.pi / 30), 3 * math.sin(i * math.pi / 30)) for i in range(61)], "ex"))),
("A", "Jak je orientovaná dvojice $u = (1,0)^T$, $v = (0,-1)^T$?", S(F(-0.8, 1.6, -1.4, 0.8).vec(1, 0, "prf", "u").vec(0, -1, "ex", "v").path([(0.45 * math.cos(-i * 0.1), 0.45 * math.sin(-i * 0.1)) for i in range(16)], "thm"))),
("A", "Jaký objem má čtyřstěn s vrcholy $o$, $e_1$, $e_2$, $e_3$?", S(F3(-1.2, 1.8, -0.8, 1.7).fill3([(1, 0, 0), (0, 1, 0), (0, 0, 1)]).axes3(1.6).seg3((1, 0, 0), (0, 1, 0), "def").seg3((0, 1, 0), (0, 0, 1), "def").seg3((0, 0, 1), (1, 0, 0), "def"))),
("L", "Vlastnosti", S(F3(-1.6, 2.6, -1, 2.4).fill3([(0, 0, 0), (1.4, 0, 0), (1.4, 1.4, 0), (0, 1.4, 0)]).axes3(2, labels=False).vec3((1.4, 0, 0), "prf", "u").vec3((0, 1.4, 0), "ex", "v").vec3((0, 0, 1.96), "def", "u × v"))),
("A", "Čemu se rovná $e_1\\times e_2$?", S(F3(-1.4, 2.2, -0.8, 1.9).axes3(1.8, labels=False).vec3((1, 0, 0), "prf", "e₁").vec3((0, 1, 0), "ex", "e₂").vec3((0, 0, 1), "def", "e₁ × e₂"))),
("A", "Jaký obsah má rovnoběžník určený vektory $(1,0,0)^T$ a $(0,2,0)^T$?", S(F3(-1.4, 2.6, -0.8, 2.4).fill3([(0, 0, 0), (1, 0, 0), (1, 2, 0), (0, 2, 0)]).axes3(2.2, labels=False).vec3((1, 0, 0), "prf").vec3((0, 2, 0), "ex").vec3((0, 0, 2), "def", "(0,0,2)ᵀ"))),
# ---------------------------------------------------------------- Hodnost a soustavy
("L", "Jak je číst", S(F(-1.5, 2.5, -1.5, 2).line((0, 0), (1, -1), "ex").line((1, 0), (0, 1), "def").vec(1, 0, "prf", "z").label(-1, 1.3, "Ax = o").label(1.7, -0.4, "Ax = b"))),
("L", "Afinní podprostor", S(F(-1.5, 3, -1.2, 2.5).line((0, 0), (2, 1), "ex").line((0.5, 1.5), (2.5, 2.5), "def").vec(0.5, 1.5, "prf", "p").label(2.4, 0.9, "V").label(1.4, 2.25, "p + V"))),
("A", "Jaká je vzájemná poloha přímek $p\\colon X = [1,0,0] + s(1,1,0)^T$", S(F3(-1.8, 2.4, -1, 2).axes3(1.8).seg3((2, 1, 0), (-0.8, -1.8, 0), "def").seg3((-1, 1, 1), (1, -1, 1), "ex").label(*P(2, 1.2, 0), "p").label(*P(-1, 1.2, 1), "q"))),
("L", "Malý příklad a metoda ART", S(F(-0.3, 3.2, -0.3, 2.6, axes=False).raw("poly=0,0,2,0,2,2,0,2,0,0").raw("poly=1,0,1,2").raw("poly=0,1,2,1").label(0.22, 1.12, "a").label(1.22, 1.12, "b").label(0.22, 0.12, "c").label(1.22, 0.12, "d").vec(2.8, 0, "prf", at=(-0.2, 1.5)).vec(0, -2.4, "ex", at=(0.5, 2.3)).vec(2.3, -2.3, "thm", at=(-0.15, 2.15)))),
# ---------------------------------------------------------------- questions that are read off a picture
("Q", "jejichž přímky jsou na obrázku?", S(F(-1, 3, -1, 2.6).line((0, 2), (2, 0), "def").line((0, 0), (1, 1), "ex").line((0, 0.3), (1, 0.3), "prf").pt(1, 1).pt(1.7, 0.3).pt(0.3, 0.3))),
("Q", "Co je lineární obal dvou nerovnoběžných vektorů na obrázku?", S(F(-1.6, 2.6, -0.6, 2).vec(2, 1, "prf", "u").vec(-1, 1.5, "ex", "v"))),
("Q", "Co je lineární obal dvou vektorů na obrázku, které leží na jedné přímce?", S(F(-2.6, 1.8, -1.4, 1).vec(1, 0.5, "prf", "u").vec(-2, -1, "ex", "v"))),
("Q", "Tři vektory na obrázku jsou lineárně nezávislé.", S(F(-1.4, 2.6, -0.6, 2).vec(2, 0.5, "prf").vec(0.5, 1.5, "ex").vec(-1, 1, "def"))),
("Q", "Na obrázku je báze $(u_1, u_2)$ se svou sítí", S(grid_pic([[1, -0.5], [0.5, 1]], [((1.5, 2), "v")], (-1.4, 2.6, -1, 2.6)))),
("Q", "Síť na obrázku patří bázi $u_1 = (1,1)^T$", S(grid_pic([[1, 1], [1, -1]], [((-1, 3), "w")], (-2.4, 2.4, -1.4, 3.4)))),
("Q", "a vektor $e_1$ (oranžově). Jaká je první souřadnice", S(grid_pic([[1, 1], [1, 2]], [((1, 0), "e₁")], (-1.6, 2.8, -1.6, 2.8)))),
("Q", "Zobrazení na obrázku natáhne rovinu.", S(basis_picture([[2, 0], [0, 1]], (-2.6, 2.8, -1.6, 1.8)))),
("Q", "Zobrazení na obrázku překlopí rovinu.", S(basis_picture([[-1, 0], [0, 1]], (-2, 2, -1.6, 1.8)))),
("Q", "Zobrazení na obrázku zkosí rovinu ve svislém směru.", S(basis_picture([[1, 0], [1, 1]], (-2, 2.4, -1.6, 2.2)))),
("Q", "Zobrazení na obrázku otočí rovinu.", S(basis_picture([[0, 1], [-1, 0]], (-2, 2, -1.6, 1.6)))),
("Q", "Zobrazení na obrázku splácne rovinu do přímky", S(F(-1.4, 2.8, -1, 1.8).line((0, 0), (2, 1), "thm").vec(1, 0.5, "prf", "Ae₁").vec(2, 1, "ex", "Ae₂"))),
("Q", "Z obrázku vyčtěte, kam zobrazení pošle $e_1$", S(basis_picture([[2, 1], [1, 3]], (-1.4, 3.6, -1, 4.4)))),
("Q", "Zobrazení na obrázku obrací orientaci roviny.", S(basis_picture([[1, 2], [2, 1]], (-1.4, 3.6, -1, 3.4), grid=False))),
("Q", "Zobrazení na obrázku zkosí jednotkový čtverec", S(basis_picture([[1, 1.5], [0, 1]], (-1, 3, -0.8, 1.8), grid=False))),
("Q", "Dvojice $(u, v)$ na obrázku, kde $u$ je zelený", S(F(-0.6, 2.6, -1, 2).vec(2, -0.5, "prf", "u").vec(1, 1.5, "ex", "v"))),
("Q", "Vektor $u$ (zelený) a vektor $v$ (růžový) na obrázku", S(F(-0.6, 2.6, -1, 2).vec(1, 1.5, "prf", "u").vec(2, -0.5, "ex", "v"))),
("A", "Krok metody ART promítne odhad $x = o$ na přímku", S(F(-0.5, 2.5, -0.5, 2.5).line((0, 2), (2, 0), "def").vec(1, 1, "ex", "(1,1)ᵀ").pt(0, 0))),
]
