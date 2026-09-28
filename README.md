# GiftCompass

Personalized gift recommendation platform.

**Core idea:** understand the recipient first, then find gifts that fit them —
within the giver's budget.

Initial market: **Jeddah, Saudi Arabia**. Prices are shown in **SAR**.

## Status

Working prototype of the recommendation pipeline (Day 4). The web UI is still
the placeholder page; the pipeline runs through a CLI and an API route.

## Documents

| Day | Deliverable |
| --- | --- |
| 3 | `docs/day3/GiftCompass_Day3_Architecture_Schemas_Catalog.docx` + `architecture-v2.png` |
| 4 | `docs/day4/GiftCompass_Day4_Prototype.docx` |
| 5 | `docs/day5/GiftCompass_Day5_Evaluation.docx` |
| 5 | `docs/GiftCompass_Final_Design_Document.docx` |
| 5 | `docs/GiftCompass_5min_Talk.pptx` |
| — | `docs/GiftCompass_Feasibility_Study.docx` |

Rebuild any of them from live repo data:

```bash
node scripts/build_day3_doc.js     # needs the `docx` npm package on NODE_PATH
node scripts/build_day45_docs.js
node scripts/build_day5_doc.js
node scripts/build_talk_deck.js    # needs `pptxgenjs`
node scripts/build_feasibility_study.js
```

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Pipeline test suite |
| `npm run validate` | Validate catalog and personas against the JSON schemas |
| `npm run personas` | Rebuild personas from `data/signals/` |
| `npm run recommend -- --persona psn_layla` | Run the pipeline for one persona |
| `npm run evaluate` | Run both systems over all personas, write the rating sheet |
| `npm run score` | Score the filled rating sheet |

## Pipeline

```
signals -> persona -> retrieval -> hard filters -> ranking -> explanations
```

Code lives in `src/lib/giftcompass/`, one module per layer. Also exposed as
`POST /api/recommend`:

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H 'Content-Type: application/json' \
  -d '{"persona_id":"psn_layla","relationship":"best_friend","occasion":"birthday","budget_max":500}'
```

Two pieces are deliberately stubbed behind interfaces, because they need
services we cannot run offline:

- **Persona Builder** is deterministic (taxonomy keyword matching + the
  documented weight formula). An LLM builder drops into `PersonaBuilder`.
- **Retrieval** uses TF-IDF cosine. Multilingual sentence embeddings drop into
  `Encoder`.

The optional LLM re-ranker may only reorder product ids it was given; an
invented id is discarded.
