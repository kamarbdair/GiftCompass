# GiftCompass Customer Lifecycle

**Current version: V03** — the circular elegance of V01 with the corrected journey logic of V02.

| File | What it is |
|---|---|
| `GiftCompass_Customer_Lifecycle_v03.pdf` | **Current deliverable.** Page 1 on its own, 1 page landscape 16:9 |
| `GiftCompass_Recipient_Lifecycle_v03.pdf` | **Current deliverable.** The recipient's own journey, 1 page landscape 16:9 |
| `GiftCompass_Lifecycle_v03.pdf` | Both diagrams together, 2 pages, 16:9 (1200 × 675 pt — same page size as V01) |
| `GiftCompass_Customer_Lifecycle_v03.png` | Page 1 at 200 dpi, for slides |
| `GiftCompass_Recipient_Lifecycle_v03.png` | Page 2 at 200 dpi, for slides |
| `giftcompass-lifecycle-v03.html` | Source of the **customer** lifecycle (its page 2 is superseded — see below) |
| `giftcompass-recipient-lifecycle.html` | Source of the **recipient** lifecycle |
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

## The eight stages (page 1)

| # | Stage | Role |
|---|---|---|
| 1 | Get Started | Sender |
| 2 | Request a Gift | Sender |
| 3 | Recipient Preferences & Consent *(optional)* | Recipient |
| 4 | Recipient Interest Profile | GiftCompass + Recipient |
| 5 | AI Gift Discovery | GiftCompass |
| 6 | Choose & Purchase | Sender |
| 7 | Gift Delivery | Retailer / delivery partner + Recipient |
| 8 | Feedback & Learning | Sender + Recipient + GiftCompass |

Stage 3 is where the recipient *participates* — invitation, consent, optional sharing. Stage 4 is
where GiftCompass *builds* the profile, from recipient-approved information or, where the
recipient did not take part, from what the sender supplied. The two are deliberately separate.

A dashed loop runs from stage 8 back to **stage 2**, not stage 1 — the returning customer never
creates another account. The next occasion is shown only by that loop, never repeated inside
stage 8.

The single-page PDF is produced by extracting page 1 from the two-page build:
`pdfseparate -f 1 -l 1 GiftCompass_Lifecycle_v03.pdf GiftCompass_Customer_Lifecycle_v03.pdf`

## The six stages (recipient lifecycle)

| # | Stage | Role |
|---|---|---|
| 1 | Receive Invitation | GiftCompass → Recipient |
| 2 | Review & Give Consent | Recipient |
| 3 | Share Interests *(optional)* | Recipient |
| 4 | Review & Approve Profile | GiftCompass + Recipient |
| 5 | Receive Gift | Retailer / delivery partner + Recipient |
| 6 | Feedback & Future Gifts | Recipient + GiftCompass |

A dashed grey bypass runs from stage 2 straight to stage 5: declining or ignoring the invitation
never stops the gift. A dashed lavender loop from stage 6 back to stage 5 carries the profile
reuse, conditional on consent still being valid.

The recipient lifecycle has its **own source file** (`giftcompass-recipient-lifecycle.html`). Page 2
of `giftcompass-lifecycle-v03.html` is the older recipient diagram and is no longer rendered into
any deliverable; the two-page `GiftCompass_Lifecycle_v03.pdf` is now assembled with
`pdfunite` from the two one-pagers.

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
