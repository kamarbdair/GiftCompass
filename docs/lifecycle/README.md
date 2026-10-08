# GiftCompass Customer Lifecycle — Version 02

Two diagrams, one source file.

| File | What it is |
|---|---|
| `GiftCompass_Lifecycle_v02.pdf` | Both diagrams, 2 pages, 16:9 (1200 × 675 pt — same page size as version 01) |
| `GiftCompass_Customer_Lifecycle_v02.png` | Page 1 at 200 dpi, for slides |
| `GiftCompass_Recipient_Lifecycle_v02.png` | Page 2 at 200 dpi, for slides |
| `giftcompass-lifecycle.html` | The source. Edit this, then re-render. |
| `fonts/Manrope-var.woff2` | The typeface used by version 01, kept so the files render identically offline |

## Re-rendering after an edit

```sh
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --disable-gpu --no-sandbox \
  --no-pdf-header-footer --virtual-time-budget=4000 \
  --print-to-pdf=GiftCompass_Lifecycle_v02.pdf giftcompass-lifecycle.html
pdftoppm -r 200 -png -f 1 -l 1 GiftCompass_Lifecycle_v02.pdf page
```

## Role colour system

| Role | Colour | Used for |
|---|---|---|
| Sender | lavender `#8E74B8` | steps 1, 2, 3, 10, 12, 13 |
| Recipient | peach `#DD8459` | the consent decision (4), sharing interests (5), receiving the gift (11), feedback |
| GiftCompass app & AI | teal `#3B8F88` | sending the invitation (4), profile building (6), catalog search (7), filtering (8), ranking (9) |
| Retailer / delivery partner | neutral `#8A7F76` | delivery (11) |

Peach is used **only** for decisions and actions the recipient actually takes. Everything
GiftCompass does automatically is teal, including building the interest profile.

## Notes on accuracy

- TikTok connection is shown as requiring official, authorised platform access. A footnote on
  both pages records that this authorisation has not been obtained and that the questionnaire
  is the route available today. This matches SRS v1.0 (FR-55, FR-56 and Table 3.11).
- The invitation is described as a secure link GiftCompass creates and the sender passes on,
  which is what CIR-03 specifies — the system does not need the sender's contacts.
- Delivery is attributed to the retailer or courier, never to GiftCompass, matching the SRS
  scope statement and the Business Model Canvas.
- "Top 5" matches FR-45 (at most five recommendations).
