# GiftCompass

Personalized gift recommendation platform.

**Core idea:** understand the recipient first, then find gifts that fit them —
within the giver's budget.

Initial market: **Jeddah, Saudi Arabia**. Prices are shown in **SAR**.

## Status

Working prototype of the recommendation pipeline (Day 4). The web UI is still
the placeholder page; the pipeline runs through a CLI and an API route.

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
