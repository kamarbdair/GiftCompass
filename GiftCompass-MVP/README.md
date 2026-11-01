# GiftCompass MVP

A working prototype of GiftCompass, a gift recommendation tool for the Saudi market. The user answers a structured **10-question questionnaire** about the gift recipient. GiftCompass then filters and ranks a demo catalogue and returns personalised gift ideas, each with a match percentage and an explanation.

> **Demo data notice.** All 48 products, prices and images in `data/catalog.json` are illustrative examples created for this prototype. They are not live listings, not real availability, and not affiliate links. No retailers have been verified or partnered with, so the app shows "Retailer: not verified yet" on every card. There are no customer reviews.

---

## 1. Run it locally

**Requirements:** Node.js 18 or newer (https://nodejs.org). Nothing else is needed: no npm packages, no database and no API keys.

```bash
cd giftcompass-mvp
node server.js          # or: npm start
```

Open **http://localhost:3000**.

- **Another port:** `PORT=8080 node server.js` (macOS/Linux) or `set PORT=8080 && node server.js` (Windows cmd).
- **Automated tests:** `npm test` (or `node --test test/run-tests.js`). The run prints the recommendations for six example profiles.
- **On a phone:** put the laptop and phone on the same Wi-Fi, then open `http://<laptop-IP>:3000` on the phone.

---

## 2. What the user sees

1. **Welcome page.** Explains the two ways to describe a recipient:
   - **Option A – Answer 10 questions** (available now, fully working).
   - **Option B – Recipient-authorised social media profile** (labelled **Coming later**, with a disabled button). In a future version, the *recipient themselves* would connect their own account through the platform's official login, with explicit consent they can withdraw. The prototype never asks for anyone's username and collects no social media data.
2. **Questionnaire.** Five short steps with 10 questions:

| Step | # | Question | Answer type | How the engine uses it |
|---|---|---|---|---|
| 1 About the recipient | Q1 | Who is the gift for? | 1 choice (required) | Context score (relationship fit) |
| | Q2 | What's the occasion? | 1 choice (required) | Context score (occasion fit) |
| 2 Who they are | Q3 | Interests and hobbies | 1–5 chips (required) | Interest score and relevance gate |
| | Q4 | Personality | up to 3 chips (optional) | Personality score |
| 3 The kind of gift | Q5 | Gift style (practical, sentimental, fun, luxurious, creative) | up to 3 (optional) | Style score and relevance gate |
| | Q6 | Preferred gift type (experience, personalised, gadget, for the home…) | up to 3 (optional) | Gift-type score |
| 4 Wishes and limits | Q7 | Anything they mentioned wanting? | short text (optional) | Wish score (highest weight) and relevance gate |
| | Q8 | Anything they already have or don't need? | short text (optional) | **Hard exclusion** |
| | Q9 | Anything to avoid? | chips (optional) | **Hard exclusion** |
| 5 Budget | Q10 | Budget in SAR | preset or custom min–max (required) | **Hard filter** |

3. **Results.** The top 5 gift ideas. Each card shows:
   - an illustrative visual (labelled as illustrative)
   - the gift name, category and price in SAR
   - the match percentage and a "⭐ On their wish list" badge when Q7 matched
   - a one-sentence personalised explanation, plus a bullet list of every criterion that matched
   - a "How was this scored?" table
   - the retailer status ("not verified yet · demo item")

   Below the cards, a section lists any in-budget items that were removed because of Q8 or Q9, with the reason for each.
4. **Change answers.** Edit buttons jump to any step with all other answers kept. **Update results** recalculates immediately. **Start over** clears everything.

---

## 3. How recommendations are calculated

The engine uses **transparent, deterministic, rule-based content matching**: the same answers always give the same results. It is **not** a trained AI or machine-learning model, and the app says so in the footer. All logic is in `src/engine.js`.

1. **Budget filter (hard).** A product is kept only if `minBudget ≤ price ≤ maxBudget`.
2. **Exclusions (hard).**
   - **Q9:** a product tagged with anything on the avoid list is removed.
   - **Q8:** a product whose keywords appear in the "already have" text is removed (for example, "dallah" removes the dallah set).
   - Exclusions take priority over wishes.
3. **Relevance gate.** A product must match at least one interest (Q3), a wish (Q7) or a gift style (Q5).
4. **Weighted score.** Each criterion gives a value between 0 and 1:

| Criterion | Value | Weight |
|---|---|---|
| Wish (Q7) | 1 if the product matches something they mentioned wanting | **0.30** |
| Interests (Q3) | min(1, matched ÷ min(selected, 2)) | 0.25 |
| Gift style (Q5) | matched ÷ selected | 0.15 |
| Gift type (Q6) | 1 if the product is a preferred type | 0.10 |
| Personality (Q4) | min(1, matched ÷ min(selected, 2)) | 0.10 |
| Occasion + relationship (Q1, Q2) | (occasion fits + relationship fits) ÷ 2 | 0.10 |

```
match % = Σ(weight × value) ÷ Σ(weights of the questions that were answered)
```

   Optional questions that were skipped are left out of the denominator, so skipping a question never lowers a match. Wishes carry the largest weight because they are the strongest signal of what the recipient wants. In testing, a wished-for item moves to #1 when it also fits the profile.

5. **Ranking.** Results are sorted by score. Ties are broken by wish match, then by number of matched interests, then by price closest to the middle of the budget, then by product ID.
6. **Explanations.** The summary sentence and the bullet points are generated only from criteria that actually matched. The automated tests check that every explanation matches the data, and that every percentage equals the formula above.

**Free-text matching (Q7 and Q8).** Text is lower-cased and punctuation is removed. Simple plurals are ignored ("headphones" = "headphone"). The text is then compared with each product's keyword list, such as `earbuds`, `headphones` and `earphones`. Only the matched *product keyword* is shown back to the user. The text is limited to 100 characters, and users are asked to describe items, not people.

---

## 4. Architecture

```
 Browser (public/)                          Node.js server (server.js, standard library only)
 ┌─────────────────────────────┐ GET /api/options   ┌──────────────────────────────────────┐
 │ Welcome: Option A / B       │ ─────────────────▶ │ labels, limits, weights              │
 │ 10 questions in 5 steps     │                    │                                      │
 │ Results + explanations      │ POST /api/recommend│ src/engine.js                        │
 │ Edit / update / start over  │ ─────────────────▶ │  validate → budget → exclusions →    │
 │ (answers kept in memory)    │ ◀───────────────── │  relevance → score → rank → explain   │
 └─────────────────────────────┘ ranked results     │ data/catalog.json  (DEMO DATA)       │
                                                    └──────────────────────────────────────┘
```

- **Front end:** plain HTML, CSS and JavaScript, with no framework and no build step. All DOM content is built with safe DOM methods (no `innerHTML`). The layout is responsive and has been checked at 1280 px and 390 px widths.
- **Back end:** a real, minimal API. Validation, filtering, scoring and explanations all run on the server.
- **Storage:** none. The server is stateless. Answers are used for one calculation and are never saved, logged or sent anywhere. There are no accounts, cookies, analytics or third-party scripts.
- **Security basics:**
  - Every choice is checked against a whitelist.
  - Text fields are trimmed and capped at 100 characters.
  - Request bodies are limited to 10 KB (returns `413`). Invalid JSON returns `400`; invalid answers return `422`.
  - Static files are protected against path traversal.
  - A strict Content-Security-Policy is set, plus `nosniff` and `no-referrer` headers.

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/options` | Questionnaire options, limits and weights |
| GET | `/api/catalog` | The demo catalogue and its notice |
| POST | `/api/recommend` | Takes the 10-question profile. Returns `results`, `excluded` and `stats`, or `422` with error messages |

```bash
curl -s -X POST localhost:3000/api/recommend -H "Content-Type: application/json" -d '{
  "relationship":"sibling","occasion":"graduation","interests":["reading","tech"],
  "personalities":["calm"],"styles":["practical"],"giftTypes":["gadget"],
  "wishes":"noise cancelling headphones","owned":"","avoid":[],"minBudget":100,"maxBudget":500}'
```

### Project structure

```
giftcompass-mvp/
├── server.js               HTTP server: API and static files
├── src/engine.js           Validation, filters, exclusions, scoring, explanations
├── data/catalog.json       48 illustrative demo products (DEMO DATA)
├── public/                 index.html, app.js, styles.css, logo.png
├── test/run-tests.js       15 automated tests (node:test)
└── docs/                   Demo walkthrough, UAT template, UAT results sheet, screenshots
```

---

## 5. Implemented vs. demo data vs. future

### Implemented and working
- Welcome page explaining Option A (working) and Option B (clearly marked "Coming later").
- A 10-question recipient questionnaire in 5 steps, with step validation and a progress bar.
- Server-side recommendation engine using every answer:
  - budget as a strict filter
  - avoid list and "already have" as hard exclusions
  - wishes prioritised
  - weighted scoring of interests, personality, gift style and gift type
  - occasion and relationship fit
- Results showing a visual, name, category, SAR price, match %, a personalised explanation, matched criteria, a score breakdown and the retailer status.
- A list of removed items with reasons.
- Editing any step, an "Update results" button, and start over.
- Stateless back end with no personal data stored; 15 automated tests; responsive layout.

### Illustrative demo data (not real)
- All 48 products, their prices, categories and tags.
- Product visuals: emoji illustrations on pastel tiles, labelled "Illustrative image". They are not product photos.
- Retailer information: none verified, so every card says so. There are no affiliate links, availability data or reviews.

### Future features (not built)
| Feature | Notes |
|---|---|
| Option B: recipient-authorised social media profile | Only through official platform APIs, with the recipient's own explicit, revocable consent and a PDPL review. No scraping and no third-party handles |
| Real catalogue and retailers | Partner retailer feeds, live prices and stock, verified retailer links once agreements exist |
| Smarter matching | Learn from consented user feedback; possibly ML once enough real interaction data exists |
| Arabic interface | Full RTL Arabic and English |
| Accounts | Saved recipients, wish lists and reminders for occasions; needs a consent flow and privacy policy |
| Checkout and delivery | Payment and gift delivery through partners |

---

## 6. Deploying (optional)

Any Node 18+ host can run the app unchanged with `node server.js`, using the `PORT` it provides. Examples include Render, Railway, Fly.io and a university VM. No secrets are required.
