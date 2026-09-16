# GiftCompass

Find a gift that actually feels like them.

GiftCompass helps someone choose a gift by understanding the **recipient** —
their interests, their relationship to the giver, the occasion, and the giver's
budget — then recommending gifts that fit. Built for Jeddah, Saudi Arabia, with
prices in SAR.

This repository is a **hackathon prototype**. It demonstrates the experience end
to end; it is not the production system.

## The flow

```
Landing → Gift Details → Personalisation Choice → TikTok / Questions
        → AI Analysis → Vibe Reveal → Gift Recommendations
```

1. **Gift details** — who it is for, the occasion, and the budget band.
2. **Personalisation** — either a TikTok username, or nine quick questions.
3. **Analysis** — an animated pass that reads the recipient's interests.
4. **Vibe reveal** — the detected interest tags, e.g. *Matcha · Books · Cozy · Minimal*.
5. **Recommendations** — four gift cards with image, price, store and why it matches,
   plus *More Unique*, *More Personal*, *Cheaper* and *Show More* refinements.

## What is real and what is demo data

Being precise about this matters, because the prototype is shown to judges.

| Part | Status |
| --- | --- |
| Questionnaire → recipient profile | **Real.** Answers carry weights; they genuinely pick the vibe. |
| Budget → which gifts appear | **Real.** Budget bands genuinely filter and rank the catalogue. |
| Gift matching | **Real**, deliberately simple: tag overlap + vibe match + budget distance. |
| TikTok analysis | **Simulated.** A fixed, worked example of how repost analysis would read someone. |
| Products, prices, stores | **Demo data.** Store names are fictional; nothing is a real listing. |

The prototype **does not connect to TikTok** and does not read any real account.
The TikTok route shows a predetermined example profile so the concept is legible,
and every screen on that route is labelled as simulated.

There is no backend, database, authentication, payment, or retailer integration.

## Running it

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The experience is
mobile-first; it also lays out as a two-column grid on desktop.

## Project structure

```
src/app/page.tsx           flow orchestrator (the state machine for all screens)
src/components/screens/    one component per screen
src/components/Shell.tsx   shared layout, header, buttons, chips
src/lib/data.ts            vibes, questions, and the 50-item demo catalogue
src/lib/matching.ts        scoring, budget bands, refinements
public/products/           50 local SVG product illustrations
```

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
