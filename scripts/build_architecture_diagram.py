#!/usr/bin/env python3
"""Emit docs/day3/architecture-v2.svg - the GiftCompass Architecture v2 diagram."""
import pathlib

W, H = 1100, 1420
P = {  # palette: (stroke, fill, title colour)
    "input":   ("#2563eb", "#eff6ff", "#1e3a8a"),
    "consent": ("#059669", "#ecfdf5", "#065f46"),
    "persona": ("#7c3aed", "#f5f3ff", "#5b21b6"),
    "engine":  ("#d97706", "#fffbeb", "#92400e"),
    "store":   ("#64748b", "#f1f5f9", "#334155"),
    "out":     ("#0891b2", "#ecfeff", "#155e75"),
}
out = []


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def box(x, y, w, h, kind, title, lines=(), dashed=False, title_size=17, line_size=14):
    stroke, fill, tcol = P[kind]
    dash = ' stroke-dasharray="7 5"' if dashed else ""
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" '
               f'fill="{fill}" stroke="{stroke}" stroke-width="2.2"{dash}/>')
    cx = x + w / 2
    out.append(f'<text x="{cx}" y="{y + 27}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" '
               f'font-size="{title_size}" font-weight="bold" fill="{tcol}">{esc(title)}</text>')
    ty = y + 27 + 24
    for ln in lines:
        out.append(f'<text x="{cx}" y="{ty}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" '
                   f'font-size="{line_size}" fill="#334155">{esc(ln)}</text>')
        ty += 21


def arrow(x1, y1, x2, y2, label=None, colour="#475569", dashed=False):
    dash = ' stroke-dasharray="6 4"' if dashed else ""
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{colour}" '
               f'stroke-width="2.2" marker-end="url(#ah)"{dash}/>')
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        out.append(f'<text x="{mx + 8}" y="{my - 5}" font-family="Arial, Helvetica, sans-serif" '
                   f'font-size="13" fill="#475569">{esc(label)}</text>')


def path_arrow(d, colour="#0891b2"):
    out.append(f'<path d="{d}" fill="none" stroke="{colour}" stroke-width="2.2" '
               f'stroke-dasharray="6 4" marker-end="url(#ahc)"/>')


MX, MW = 300, 500          # main column
LX, LW = 20, 232           # left column
RX, RW = 820, 250          # right column
cx = MX + MW / 2

# ---- main pipeline -------------------------------------------------------
box(MX, 30, MW, 90, "input", "1 · Frontend — Gift Context (sender)",
    ["relationship · occasion · budget in SAR",
     "days until occasion · delivery city"])

box(LX, 150, LW, 170, "consent", "Receiver — Gift Profile link",
    ["quick questions, or", "TikTok export read in the", "browser (never uploaded raw)",
     "preview → remove → approve"], title_size=15, line_size=13)

box(MX, 170, MW, 110, "consent", "2 · Consent + Signal Collector",
    ["primary: sender quiz + manual input",
     "optional, receiver-consented: TikTok export,",
     "Pinterest, Spotify"])

box(MX, 320, MW, 74, "store", "Normalized Signal  {text, source, date, type}",
    ["strength: posted 1.0 > reposted .9 > saved .8 > liked .6 > watched .3"],
    title_size=15, line_size=13)

box(MX, 434, MW, 116, "persona", "3 · Persona Builder — LLM, JSON output",
    ["interests + weight + evidence · dislikes · style",
     "sentiment check · giftability score",
     "blocked: religion, health, politics, sexuality"])

box(LX, 590, LW, 148, "consent", "PDPL guardrail",
    ["raw export deleted once the", "persona is built · only the", "persona is stored · receiver",
     "can revoke at any time"], title_size=15, line_size=13, dashed=True)

box(MX, 590, MW, 74, "persona", "Persona JSON  (persona.schema.json)",
    ["auditable: every interest carries its evidence"], title_size=15, line_size=13)

box(RX, 700, RW, 118, "store", "Product Catalog",
    ["product.schema.json", "products_demo.csv", "187 demo items, SAR",
     "+ text embeddings"], title_size=15, line_size=13)

box(MX, 704, MW, 90, "engine", "4 · Candidate Retrieval",
    ["multilingual embeddings (AR + EN) · cosine top 50"])

box(MX, 834, MW, 116, "engine", "5 · Hard Filters — before ranking",
    ["price ≤ budget · delivery ≤ days left · age range",
     "relationship fit · not in dislikes · not already owned",
     "embarrassment risk ≤ threshold for this relationship"])

box(MX, 990, MW, 116, "engine", "6 · Ranking",
    ["0.40 interest match + 0.20 giftability + 0.15 budget fit",
     "+ 0.10 novelty − 0.15 embarrassment risk",
     "optional LLM list-wise re-rank of the top 10"])

box(MX, 1146, MW, 86, "out", "7 · Results — up to 5 gifts",
    ["image · name · price in SAR · seller · why this matches"])

box(MX, 1272, MW, 76, "out", "8 · Feedback — thumbs up / thumbs down",
    ["reason codes → evaluation set (Day 5)"])

# ---- arrows --------------------------------------------------------------
arrow(cx, 120, cx, 165)
arrow(LX + LW + 4, 235, MX - 4, 235)                   # receiver -> collector
arrow(cx, 280, cx, 315)
arrow(cx, 394, cx, 429)
arrow(cx, 550, cx, 585)
arrow(cx, 664, cx, 699)
arrow(RX - 4, 759, MX + MW + 4, 759)                   # catalog -> retrieval
arrow(cx, 794, cx, 829)
arrow(cx, 950, cx, 985)
arrow(cx, 1106, cx, 1141)
arrow(cx, 1232, cx, 1267)

# feedback loop back into ranking
path_arrow("M 300 1310 L 250 1310 L 250 1048 L 296 1048")
out.append('<text x="150" y="1180" font-family="Arial, Helvetica, sans-serif" font-size="13" '
           'fill="#0891b2">feedback loop</text>')

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<defs>',
       '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
       '<path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/></marker>',
       '<marker id="ahc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
       '<path d="M 0 0 L 10 5 L 0 10 z" fill="#0891b2"/></marker>',
       '</defs>',
       f'<rect width="{W}" height="{H}" fill="#ffffff"/>'] + out + ['</svg>']

dest = pathlib.Path(__file__).resolve().parents[1] / "docs/day3/architecture-v2.svg"
dest.write_text("\n".join(svg), encoding="utf-8")
print("wrote", dest)
