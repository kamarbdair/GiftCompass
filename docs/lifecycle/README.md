# GiftCompass Customer Lifecycle

**Current version: V03** — the circular elegance of V01 with the corrected journey logic of V02.

| File | What it is |
|---|---|
| `GiftCompass_Customer_Lifecycle_v03.pdf` | **Current deliverable.** Page 1 on its own, 1 page landscape 16:9 |
| `GiftCompass_Lifecycle_v03.pdf` | Both diagrams together, 2 pages, 16:9 (1200 × 675 pt — same page size as V01) |
| `GiftCompass_Customer_Lifecycle_v03.png` | Page 1 at 200 dpi, for slides |
| `GiftCompass_Recipient_Lifecycle_v03.png` | Page 2 at 200 dpi, for slides |
| `giftcompass-lifecycle-v03.html` | The V03 source. Edit this, then re-render. |
| `GiftCompass_Lifecycle_v02.pdf`, `giftcompass-lifecycle.html` | V02, kept for reference |
| `fonts/Manrope-var.woff2` | The typeface used since V01 |

## Re-rendering after an edit

```sh
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --disable-gpu --no-sandbox \
  --no-pdf-header-footer --virtual-time-budget=5000 \
  --print-to-pdf=GiftCompass_Lifecycle_v03.pdf giftcompass-lifecycle-v03.html
pdftoppm -r 200 -png GiftCompass_Lifecycle_v03.pdf page
```

Stage text, roles and geometry live in the `stages` / `st` arrays near the bottom of the HTML.
Changing a stage's `roles` array automatically redraws its node ring — one colour segment per role.

## The seven stages (page 1)

| # | Stage | Role |
|---|---|---|
| 1 | Get Started | Sender |
| 2 | Request a Gift | Sender |
| 3 | Recipient Preferences *(optional)* | Recipient |
| 4 | AI Gift Discovery | GiftCompass |
| 5 | Choose & Purchase | Sender |
| 6 | Gift Delivery | Retailer / delivery partner + Recipient |
| 7 | Feedback & Learning | Sender + Recipient + GiftCompass |

A dashed loop runs from stage 7 back to **stage 2**, not stage 1 — the returning customer never
creates another account. The next occasion is shown only by that loop, never repeated inside
stage 7.

The single-page PDF is produced by extracting page 1 from the two-page build:
`pdfseparate -f 1 -l 1 GiftCompass_Lifecycle_v03.pdf GiftCompass_Customer_Lifecycle_v03.pdf`

## Role colours

| Role | Colour |
|---|---|
| Sender | deep violet `#4A3690` |
| Recipient | soft lavender `#B983DD` |
| GiftCompass app & AI | soft teal `#2F8A83` |
| Retailer / delivery partner | neutral grey `#8B8077` |

Stages with more than one role carry one ring segment per role rather than extra text labels.

## What V03 removed from V02

The "Steps 4–6 up close" panel, the "Privacy & Trust" box, the worked example paragraph, the
per-step descriptions and the role chips. The consent route survives as a three-pill branch
beside stage 3, and privacy as a single line at the foot of the page.
