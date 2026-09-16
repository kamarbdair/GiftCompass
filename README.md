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

## What is real and what is simulated

Being precise about this matters, because the prototype is shown to judges.

| Part | Status |
| --- | --- |
| Products, prices, images, links | **Real.** Every product is a real listing from a Saudi-serving retailer, read from that retailer's own product page. |
| Questionnaire → recipient profile | **Real.** Answers carry weights; they genuinely pick the vibe. |
| Budget → which gifts appear | **Real.** Budget bands genuinely filter and rank the catalogue. |
| Gift matching | **Real**, deliberately simple: vibe match + tag overlap + budget distance. |
| TikTok analysis | **Simulated.** A fixed, worked example of how repost analysis would read someone. |

The prototype **does not connect to TikTok** and does not read any real account.
The TikTok route shows a predetermined example profile so the concept is legible,
and every screen on that route is labelled as simulated.

There is no backend, database, authentication, payment, or retailer integration.
Prices were last checked on **16 September 2026** and will drift — each product
carries a `priceCheckedOn` date and the UI tells people to confirm with the
retailer.

## Retailers

Products come from specialist retailers and brands that serve Saudi Arabia,
which is the model GiftCompass is built around — one personalised discovery
layer over many merchants, rather than a single marketplace.

| Retailer | Vibe |
| --- | --- |
| [Jarir Bookstore](https://www.jarir.com/sa-en/) | Cozy Creative — books, reading, stationery |
| [Rituals KSA](https://en-sa.rituals.com) | Cozy Creative · Style & Glow — candles, self-care |
| [ZGames](https://zgames.sa) | Tech & Play — gaming |
| [Newtech Store](https://sa.newtechstore.com) | Tech & Play — peripherals |
| [FACES KSA](https://www.faces.sa/en) | Style & Glow — beauty, fragrance |
| [Decathlon Saudi](https://decathlon.sa) | Active & Outdoors — fitness |
| [Sun & Sand Sports](https://en-sa.sssports.com) | Active & Outdoors — running |
| [Qavashop](https://qavashop.com/en/coffee) | Café & Culture — Saudi specialty roasters |

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
src/lib/data.ts            vibes, questions, budget bands
src/lib/products.ts        the real-product catalogue (name, SAR price, image, URL)
src/lib/matching.ts        scoring, budget bands, refinements
```

Product images are served from each retailer's own CDN; the allowed hosts are
listed in `next.config.ts`.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
