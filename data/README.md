# Data

## products_demo.csv

The GiftCompass demo gift catalog: 187 items, prices in SAR, built for the
Jeddah market. It is a flat serialisation of `docs/schemas/product.schema.json`
— column names match field names, and array fields are pipe-separated.

**This is demo data.** Every row carries `data_status = demo`, which means:

- the item type, category and price band are realistic for Jeddah,
- **no price has been quoted and no listing has been checked**,
- `product_url` is empty on every row — we never fabricate a link,
- `retailer_hint` is a sourcing suggestion, not a claim that the shop stocks
  that item at that price.

It exists so the recommendation pipeline can be built and evaluated. Before any
real user sees a recommendation, rows must be re-sourced against live listings
and switched to `data_status = verified` with a `verified_at` date.
`scripts/validate_catalog.py` already rejects a `verified` row with no
`product_url`.

## Regenerating and checking

```bash
python3 scripts/build_demo_catalog.py   # rewrites data/products_demo.csv
python3 scripts/validate_catalog.py     # validates every row against the schemas
```

The validator also checks the example persona and product instances in
`docs/schemas/examples/`, and rejects any interest key that is not in
`docs/schemas/interest-taxonomy.json`.

## evaluation/

Written by `npm run evaluate`, which runs both systems over every persona.

| File | What it is |
| --- | --- |
| `recommendations.json` | Every result from both systems, with score breakdowns and filter traces |
| `objective-metrics.csv` | Metrics needing no human judgement (budget adherence, diversity, interest coverage, overlap) |
| `rating-sheet.csv` | **Blind** sheet for three raters. Does not say which system produced an item |
| `rating-key.csv` | Maps each item code back to its system — keep it away from the raters |

Human columns start empty and stay empty until real raters fill them in.
`npm run score` reports "no ratings yet" rather than inventing numbers, and
flags any invalid cell instead of guessing.

## signals/ and personas/

`signals/` holds five synthetic recipients as raw signal bundles. They are
invented: no real person, no real account. `npm run personas` turns each one
into two personas — the full profile and a quiz-only baseline — in
`personas/`. Those files are generated; edit the signal bundles, not them.
