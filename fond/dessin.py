"""Génère fond-cantine.svg : self moderne avec vue sur les ocres du Vaucluse et la borne de scan."""
import math, random

random.seed(7)
W, H = 1600, 900
o = []
a = o.append

a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
a('''<defs>
<linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2df"/><stop offset=".6" stop-color="#bcd8ec"/><stop offset="1" stop-color="#f3dfbf"/></linearGradient>
<linearGradient id="soleil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".9"/><stop offset=".45" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>
<linearGradient id="sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe4d2"/><stop offset="1" stop-color="#d9c8ad"/></linearGradient>
<linearGradient id="mur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8d9c2"/><stop offset="1" stop-color="#dcc8aa"/></linearGradient>
<linearGradient id="sep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d27a2e"/><stop offset="1" stop-color="#b9611d"/></linearGradient>
<linearGradient id="inox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f4f4"/><stop offset=".5" stop-color="#b9bfc2"/><stop offset="1" stop-color="#8d9497"/></linearGradient>
<linearGradient id="reflet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
<clipPath id="baie"><rect x="120" y="70" width="1360" height="450"/></clipPath>
</defs>''')

# ---------- Intérieur : mur, plafond ----------
a(f'<rect width="{W}" height="{H}" fill="url(#mur)"/>')
a('<rect x="0" y="0" width="1600" height="62" fill="#b98c5c"/>')
for x in range(0, 1600, 26):
    a(f'<rect x="{x}" y="0" width="16" height="62" fill="#a77a4c"/>')

# ---------- Paysage dans la baie ----------
a('<g clip-path="url(#baie)">')
a('<rect x="120" y="70" width="1360" height="450" fill="url(#ciel)"/>')
# Mont Ventoux (sommet pelé)
a('<path d="M420 350 C600 330 800 296 960 272 C1010 265 1050 262 1090 266 C1200 280 1330 312 1480 330 L1480 520 L420 520Z" fill="#93a3b7"/>')
a('<path d="M930 277 C980 266 1040 261 1090 266 C1130 270 1170 278 1210 287 C1160 288 1120 284 1080 287 C1030 290 980 286 930 277Z" fill="#e4e7ea"/>')
# collines lointaines
a('<path d="M120 360 C260 320 380 330 500 350 C640 372 760 330 900 345 C1060 362 1200 335 1480 350 L1480 520 L120 520Z" fill="#8aa17a"/>')
a('<path d="M120 395 C300 372 470 390 640 400 C820 410 980 385 1160 398 C1300 408 1400 398 1480 392 L1480 520 L120 520Z" fill="#6f8c5c"/>')
# falaises d'ocre
def falaise(x0, base, larg, haut, couleurs):
    pts = [(x0, base)]
    n = 9
    for i in range(1, n):
        x = x0 + larg * i / n
        y = base - haut * (0.55 + 0.45 * math.sin(i * 1.3 + x0)) - random.uniform(0, haut * 0.15)
        pts.append((x, y))
    pts.append((x0 + larg, base))
    def lisse(ps):
        d = f"M{ps[0][0]:.0f} {ps[0][1]:.0f}"
        for i in range(1, len(ps) - 1):
            mx, my = (ps[i][0] + ps[i+1][0]) / 2, (ps[i][1] + ps[i+1][1]) / 2
            d += f" Q{ps[i][0]:.0f} {ps[i][1]:.0f} {mx:.0f} {my:.0f}"
        return d + f" L{ps[-1][0]:.0f} {ps[-1][1]:.0f}Z"
    d = lisse(pts)
    a(f'<path d="{d}" fill="{couleurs[0]}"/>')
    # strates
    for k, c in enumerate(couleurs[1:]):
        dy = (k + 1) * haut * 0.22
        pts2 = [(x, min(base, y + dy)) for x, y in pts]
        d2 = lisse(pts2)
        a(f'<path d="{d2}" fill="{c}"/>')
    # ravines
    for i in range(1, n, 2):
        x, y = pts[i]
        a(f'<path d="M{x:.0f} {y+6:.0f} q{random.uniform(-8,8):.0f} {haut*0.4:.0f} {random.uniform(-4,4):.0f} {base-y-8:.0f}" stroke="#9c3f1c" stroke-opacity=".35" stroke-width="3" fill="none"/>')

falaise(640, 520, 360, 120, ["#e8b765", "#d9792f", "#c2552a", "#e9c98c"])
falaise(930, 520, 560, 150, ["#f0c977", "#e08a3a", "#c8532b", "#f2dcae"])
falaise(380, 520, 260, 70, ["#ecc27a", "#d47038", "#e7caa0"])

# pins parasols
def pin(x, y, s):
    a(f'<path d="M{x} {y} l{-2*s:.1f} {-26*s:.1f}" stroke="#5b3d24" stroke-width="{3*s:.1f}"/>')
    a(f'<ellipse cx="{x-2*s:.1f}" cy="{y-30*s:.1f}" rx="{22*s:.1f}" ry="{9*s:.1f}" fill="#3f6b3a"/>')
    a(f'<ellipse cx="{x+6*s:.1f}" cy="{y-35*s:.1f}" rx="{14*s:.1f}" ry="{6*s:.1f}" fill="#4f7d45"/>')
for x, y, s in [(700, 412, 1.0), (760, 404, .8), (1010, 360, 1.2), (1160, 352, 1.1), (1290, 350, 1.3), (1420, 350, 1.0), (450, 455, .9), (560, 470, .8), (880, 470, .9)]:
    pin(x, y, s)
# garrigue au pied
for i in range(60):
    x = 120 + i * 23 + random.uniform(-6, 6)
    a(f'<ellipse cx="{x:.0f}" cy="{512 + random.uniform(-6, 4):.0f}" rx="{random.uniform(14, 26):.0f}" ry="{random.uniform(8, 14):.0f}" fill="{random.choice(["#5d7e48", "#4b6d3c", "#6b8b52"])}"/>')
a('<rect x="120" y="70" width="1360" height="450" fill="url(#soleil)"/>')
a('</g>')

# cadre de la baie (menuiseries fines)
a('<rect x="120" y="70" width="1360" height="450" fill="url(#reflet)"/>')
a('<rect x="114" y="64" width="1372" height="462" fill="none" stroke="#3b3b3b" stroke-width="10"/>')
for x in (460, 800, 1140):
    a(f'<rect x="{x-3}" y="70" width="6" height="450" fill="#3b3b3b"/>')

# ---------- Sol ----------
a('<path d="M0 526 L1600 526 L1600 900 L0 900Z" fill="url(#sol)"/>')
for i in range(1, 8):
    y = 526 + i * i * 6.5
    a(f'<line x1="0" y1="{y:.0f}" x2="1600" y2="{y:.0f}" stroke="#cdb995" stroke-width="1.5" stroke-opacity=".6"/>')
for x in range(-800, 2400, 160):
    a(f'<line x1="{800 + (x-800)*0.35:.0f}" y1="526" x2="{x:.0f}" y2="900" stroke="#cdb995" stroke-width="1.5" stroke-opacity=".5"/>')
# lumière de la baie au sol
a('<path d="M120 526 L1480 526 L1600 760 L-40 760Z" fill="#fff4dc" fill-opacity=".35"/>')

# ---------- Tables, chaises, plateaux ----------
def chaise(x, y, s, couleur):
    a(f'<rect x="{x}" y="{y}" width="{30*s:.0f}" height="{6*s:.0f}" rx="{2*s:.0f}" fill="{couleur}"/>')
    a(f'<rect x="{x+2*s:.0f}" y="{y-34*s:.0f}" width="{26*s:.0f}" height="{30*s:.0f}" rx="{5*s:.0f}" fill="{couleur}"/>')
    a(f'<rect x="{x+3*s:.0f}" y="{y+6*s:.0f}" width="{3*s:.0f}" height="{24*s:.0f}" fill="#555"/>')
    a(f'<rect x="{x+24*s:.0f}" y="{y+6*s:.0f}" width="{3*s:.0f}" height="{24*s:.0f}" fill="#555"/>')

def plateau(x, y, s):
    a(f'<rect x="{x}" y="{y}" width="{46*s:.0f}" height="{14*s:.0f}" rx="{3*s:.0f}" fill="#c9cfd2" stroke="#9aa2a6" stroke-width="1"/>')
    a(f'<ellipse cx="{x+16*s:.0f}" cy="{y+7*s:.0f}" rx="{11*s:.0f}" ry="{5*s:.0f}" fill="#fff"/>')
    a(f'<ellipse cx="{x+15*s:.0f}" cy="{y+6.5*s:.0f}" rx="{6*s:.0f}" ry="{2.6*s:.0f}" fill="{random.choice(["#d98a3a", "#7aa05a", "#e6b84a"])}"/>')
    a(f'<circle cx="{x+36*s:.0f}" cy="{y+6*s:.0f}" r="{4*s:.0f}" fill="#e14b3b"/>')
    a(f'<rect x="{x+27*s:.0f}" y="{y-6*s:.0f}" width="{5*s:.0f}" height="{9*s:.0f}" fill="#d9eef5" stroke="#a9c6cf" stroke-width=".8"/>')

def table(cx, y, s):
    w, h = 220 * s, 16 * s
    x = cx - w / 2
    couleurs = ["#2f7d5b", "#e0a33a", "#3b6ea5", "#c75b3a"]
    for i in range(3):
        chaise(x + 20*s + i * 66*s, y - 8*s, s, couleurs[(i + int(cx)) % 4])
    a(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" rx="{4*s:.0f}" fill="#c99a62"/>')
    a(f'<rect x="{x:.0f}" y="{y+h:.0f}" width="{w:.0f}" height="{5*s:.0f}" fill="#a87b48"/>')
    a(f'<rect x="{x+16*s:.0f}" y="{y+h+5*s:.0f}" width="{6*s:.0f}" height="{40*s:.0f}" fill="#4a4a4a"/>')
    a(f'<rect x="{x+w-22*s:.0f}" y="{y+h+5*s:.0f}" width="{6*s:.0f}" height="{40*s:.0f}" fill="#4a4a4a"/>')
    for i in range(3):
        plateau(x + 14*s + i * 68*s, y - 10*s, s)
    for i in range(3):
        chaise(x + 24*s + i * 66*s, y + 34*s, s * 1.05, couleurs[(i + 2 + int(cx)) % 4])

table(260, 590, .95)
table(560, 600, 1.0)
table(860, 590, .95)
table(300, 700, 1.25)
table(700, 712, 1.3)

# plantes (oliviers en pot)
def olivier(x, y, s):
    a(f'<path d="M{x} {y} q{-6*s:.0f} {-60*s:.0f} {4*s:.0f} {-120*s:.0f}" stroke="#6b5136" stroke-width="{5*s:.0f}" fill="none"/>')
    for i in range(16):
        a(f'<ellipse cx="{x + random.uniform(-40,40)*s:.0f}" cy="{y - random.uniform(90,170)*s:.0f}" rx="{random.uniform(14,26)*s:.0f}" ry="{random.uniform(6,10)*s:.0f}" fill="{random.choice(["#7d9466", "#8fa676", "#6c845a"])}" fill-opacity=".9"/>')
    a(f'<path d="M{x-28*s:.0f} {y} h{56*s:.0f} l{-6*s:.0f} {46*s:.0f} h{-44*s:.0f}Z" fill="#e9e1d3" stroke="#cbbfa9"/>')
olivier(70, 600, 1.2)

# ---------- Borne de scan au premier plan (droite) ----------
bx, by = 1060, 470
a('<g transform="translate(1575 900) scale(.74) translate(-1660 -920)">')
# séparateur orange incurvé
a(f'<path d="M{bx} {by+70} C{bx+120} {by+20} {bx+330} {by+10} {bx+540} {by+40} L{bx+540} {by+330} L{bx} {by+330}Z" fill="url(#sep)"/>')
# découpes rayonnantes
cxr, cyr = bx + 270, by + 330
for ang in (-62, -44, -26, -9, 9, 26, 44, 62):
    r1, r2 = 110, 220
    t = math.radians(ang - 90)
    x1, y1 = cxr + r1 * math.cos(t), cyr + r1 * math.sin(t)
    x2, y2 = cxr + r2 * math.cos(t), cyr + r2 * math.sin(t)
    a(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#f3e6d0" stroke-width="13" stroke-linecap="round"/>')
    a(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#ffffff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>')
a(f'<path d="M{bx+40} {by+300} Q{bx+270} {by+282} {bx+500} {by+300}" stroke="#f3e6d0" stroke-width="10" fill="none" stroke-linecap="round"/>')
# montant inox
a(f'<rect x="{bx-14}" y="{by+60}" width="16" height="320" rx="6" fill="url(#inox)"/>')
# boîtier caméra vert imprimé en 3D
a(f'<rect x="{bx+200}" y="{by-34}" width="110" height="96" rx="8" fill="#1fa64a" stroke="#14823a" stroke-width="4"/>')
a(f'<rect x="{bx+214}" y="{by-22}" width="82" height="70" rx="4" fill="#178a3d"/>')
a(f'<rect x="{bx+238}" y="{by-26}" width="34" height="42" rx="3" fill="#22b553"/>')
a(f'<circle cx="{bx+255}" cy="{by-2}" r="11" fill="#111"/><circle cx="{bx+252}" cy="{by-5}" r="3.5" fill="#6a7a8a"/>')
# rail à plateaux inox + plateau
for k, yy in enumerate((by+318, by+350, by+382)):
    a(f'<rect x="{bx-60}" y="{yy}" width="620" height="12" rx="6" fill="url(#inox)"/>')
a(f'<path d="M{bx+60} {by+300} h290 l14 34 h-318Z" fill="#c5cbce" stroke="#8d9497" stroke-width="3"/>')
a(f'<ellipse cx="{bx+205}" cy="{by+316}" rx="110" ry="15" fill="#b3babd"/>')
a(f'<ellipse cx="{bx+180}" cy="{by+314}" rx="20" ry="6" fill="#d38c3c"/>')
a(f'<rect x="{bx+250}" y="{by+282}" width="26" height="34" fill="#e3f1f5" fill-opacity=".85" stroke="#a9c6cf" stroke-width="2"/>')
# meuble bois + tablette + bouton
mx = bx + 440
a(f'<rect x="{mx}" y="{by+190}" width="160" height="260" fill="#e2c595"/>')
a(f'<rect x="{mx}" y="{by+190}" width="160" height="14" fill="#cfae7a"/>')
# tablette durcie
a(f'<g transform="rotate(-6 {mx+60} {by+130})">')
a(f'<rect x="{mx-10}" y="{by+70}" width="150" height="110" rx="12" fill="#2c3136"/>')
a(f'<rect x="{mx+2}" y="{by+82}" width="126" height="86" rx="4" fill="#f7f7f5"/>')
a(f'<rect x="{mx+2}" y="{by+82}" width="56" height="86" fill="#1f8f4c"/>')
a(f'<text x="{mx+8}" y="{by+100}" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">A.B.C.</text>')
for i in range(4):
    a(f'<rect x="{mx+8}" y="{by+108+i*12}" width="{40 - i*6}" height="5" rx="2" fill="#bfe6cf"/>')
a(f'<rect x="{mx+64}" y="{by+86}" width="60" height="16" fill="#d84a3a"/>')
for i, (hh, c) in enumerate(((22, "#3fae5a"), (34, "#e2b33c"), (14, "#d84a3a"))):
    a(f'<rect x="{mx+68+i*12}" y="{by+162-hh}" width="9" height="{hh}" fill="{c}"/>')
a(f'<circle cx="{mx+114}" cy="{by+140}" r="12" fill="none" stroke="#3fae5a" stroke-width="5"/>')
a('</g>')
# panneau bouton vert
a(f'<rect x="{mx+20}" y="{by+218}" width="130" height="120" rx="8" fill="#22b553" stroke="#178a3d" stroke-width="3"/>')
a(f'<text x="{mx+85}" y="{by+244}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">APPUYER POUR</text>')
a(f'<text x="{mx+85}" y="{by+260}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">SCANNER</text>')
a(f'<ellipse cx="{mx+85}" cy="{by+300}" rx="30" ry="24" fill="#17963f" stroke="#0f6e2d" stroke-width="3"/>')
a(f'<ellipse cx="{mx+82}" cy="{by+294}" rx="18" ry="11" fill="#4fd27a"/>')

a('</g>')
# léger voile chaud global
a(f'<rect width="{W}" height="{H}" fill="#ffb760" fill-opacity=".06"/>')
a('</svg>')

open("fond/fond-cantine.svg", "w").write("\n".join(o))
print("ok")
