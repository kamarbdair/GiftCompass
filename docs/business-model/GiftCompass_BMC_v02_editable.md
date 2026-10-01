# GiftCompass — Business Model Canvas, Version 02 (editable text)

**Project:** GiftCompass — AI-assisted, privacy-first gift recommendation for the Jeddah market
**Version:** 02  **Date:** 1 October 2026  **Course:** CS4176, Effat University

**Labelling convention used throughout**

| Label | Meaning |
|---|---|
| **Confirmed** | Already decided in the GiftCompass project (SRS, architecture, feasibility study). |
| **Assumption** | A working figure that has not been validated. |
| **Potential partner** | A company we intend to contact. No agreement exists. |
| **To be validated** | To be tested through customer interviews, partner quotations and pilot data. |

> **Open conflict to resolve with the team.** Phase 1B (GiftCompass checkout, wrapping,
> delivery) requires capabilities that SRS v1.0 lists explicitly as *out of scope*:
> "GiftCompass does not process payments, hold stock, arrange delivery, or handle returns —
> the purchase is completed on the seller's own site." Phase 1A (affiliate) matches the
> current SRS. Either the SRS scope is widened for Phase 1B, or Phase 1B stays a documented
> future phase. Nothing in the SRS has been changed.

---

## 1. Key Partners

**All names below are POTENTIAL partners. No agreement is in place with any of them.**

**Potential retail partners (to contact)**
- Amazon.sa
- Noon
- Jarir
- Local flower shops in Jeddah
- Local chocolate shops in Jeddah
- Local gift and lifestyle shops in Jeddah

**Potential delivery partners (to contact)**
- Aramex
- SMSA
- Local Jeddah courier companies

**Potential payment providers (to contact)**
- Moyasar
- Tap
- HyperPay

**Potential Buy Now Pay Later providers (to contact)**
- Tabby
- Tamara

**Technology**
- Cloud, hosting and AI providers
- Hosting and data infrastructure selected with Saudi PDPL requirements in mind

**Academic (confirmed)**
- Effat University — course supervision and project review

---

## 2. Key Activities

- Develop and maintain the GiftCompass platform
- AI-assisted matching, filtering and ranking
- Consent-based profiling: buyer quiz plus recipient opt-in link
- Product catalogue management: keeping prices and availability accurate and verified
- Partner onboarding and retail partner management
- Order and delivery coordination *(Phase 1B)*
- Recommendation evaluation and improvement
- Customer support
- PDPL and privacy compliance
- Marketing and customer acquisition

*Wording note: this is "consent-based profiling", never "user data collection".*

---

## 3. Key Resources

- GiftCompass platform (mobile-friendly website)
- AI recommendation engine and matching/ranking logic
- Curated product catalogue: 187 demonstration items in 12 categories, priced in SAR
- Shared interest vocabulary linking recipient profiles to products
- Consented recipient profiles (opt-in, evidence-backed)
- Retail, delivery and payment partners
- Development and technical team
- GiftCompass brand
- Feedback and recommendation-evaluation data
- Secure cloud and database hosting

*Wording note: personal information is referred to as "consented recipient profiles", never as "user data".*

---

## 4. Value Propositions

**For gift buyers (paying side)**
- Recommendations matched to the *recipient*, not only to the occasion
- Matching on interests, relationship, occasion, budget and preferences
- Less gift-selection stress
- Saves time: a decision in minutes rather than an evening of browsing
- A short, focused set of options instead of endless choice
- A clear explanation of why each gift fits that person
- Jeddah availability and SAR pricing throughout
- Privacy-first personalization: the 10-question quiz plus an optional opt-in recipient profile. No scraping
- Optional reusable recipient profiles for future occasions
- End-to-end gifting in one flow: Recommend → Buy → Wrap → Add card → Deliver *(Phase 1B)*
- Built for Saudi occasions: Eid, graduation, weddings, newborns, birthdays

**For gift recipients (non-paying side)**
- Optional opt-in Gift Profile; the recipient reviews every inferred interest and can remove
  any of them before anything is stored
- Nothing is collected without their own action

**For retail partners (partner side)**
- Access to buyers already showing purchase intent
- Intent-matched referrals rather than broad advertising

**Removed in Version 02:** any value proposition that depended on entering, scraping or
analysing a recipient's TikTok handle. TikTok appears only as a marketing channel (section 6).

---

## 5. Customer Relationships

- Self-service, personalized experience
- **Main route:** the buyer's 10-question quiz (SRS FR-07 caps the questionnaire at 12 questions)
- Saved recipient profiles for reuse
- Optional recipient-created Gift Profiles
- Refinement on demand: cheaper, more practical, more sentimental, more unusual, different category
- Occasion and birthday reminders *(planned — not in the current requirements)*
- Feedback after purchase and delivery
- Feedback improves future recommendations
- Order and delivery support *(Phase 1B)*

---

## 6. Channels

- GiftCompass mobile-friendly website — the initial platform
- Instagram content
- TikTok content — **marketing only. No recipient data is taken from TikTok.**
- Snapchat content
- University ambassadors
- Partner stores and in-store referral
- WhatsApp sharing of recipient Gift Profile links
- Search and digital marketing
- Native mobile application — *later phase, not at launch*

---

## 7. Customer Segments

**GiftCompass is a multi-sided market: three distinct sides, only one of which pays at launch.**

**A. Gift buyers — primary paying customers**
- University students
- Young professionals
- Busy professionals with little time to shop
- People buying for Saudi occasions: Eid, graduations, birthdays, weddings, newborns
- Corporate gifting and HR teams — *possible future B2B segment*

**B. Gift recipients — do not pay**
- May optionally complete their own opt-in Gift Profile to improve the match
- Benefit without ever paying or registering

**C. Retail and delivery partners — may pay**
- Retailers supply products and fulfil orders
- Delivery partners carry out delivery
- Retail partners may pay GiftCompass through commission or a commercial partnership

**To be validated.** These segments are assumptions. Customer interviews are intended to test
them; none has been conducted to date.

**Removed in Version 02:** "unemployed individuals" and other vague segments.

---

## 8. Cost Structure

**Fixed / operating costs (monthly)** — all paid by GiftCompass

| Cost | Status |
|---|---|
| Website and platform development | Team labour to date |
| Cloud hosting | Free tier now, paid tier at launch |
| Database | Free tier now, paid tier at launch |
| AI / LLM / API infrastructure | Measured per journey in the feasibility study |
| Domain and software fees | Confirmed, small |
| Legal, privacy and PDPL review | **TBD** — no quotation yet |
| Marketing | **TBD** — budget not set |
| Staff / development cost | Currently unpaid student labour |
| Partner onboarding and management | Mostly team time |

**Variable / per-order costs**

| Cost | Paid by | Status |
|---|---|---|
| Payment gateway fee ≈2.5% *(Phase 1B)* | GiftCompass | **Assumption** |
| Wrapping materials ≈SAR 10 | GiftCompass | **Assumption** |
| AI / API cost per order ≈SAR 1 | GiftCompass | **Assumption** |
| Customer and order support | GiftCompass | Team time; not yet costed |
| Delivery | Customer, normally | **TBD** — any share GiftCompass absorbs is undecided |

---

## 9. Revenue Streams

**Phase 1A — validate demand**
- Affiliate / referral commission at partner retailers
- Fast to test, but little control over checkout, wrapping and delivery
- Matches the current SRS v1.0 scope

**Phase 1B — GiftCompass checkout**
1. Commission on each partner sale
2. Fixed GiftCompass service fee per order
3. Gift-wrapping margin
4. Greeting-card and gift-card upsells
5. Express-delivery / convenience upsells

*Requires a GiftCompass-operated checkout. **Scope change:** payments, wrapping and delivery
are out of scope in SRS v1.0 and would have to be added first.*

**Phase 2 — after demand is proven**
- Premium subscription — price **TBD** after customer interviews
- GiftCompass-owned products in proven high-demand categories
- Corporate gifting
- Sponsored placements, clearly labelled

**Trust rule.** Sponsored placements must be clearly labelled and must never silently
determine which gifts are recommended. Ranking stays driven by the recipient profile.

---

## 10. Pricing Assumptions

**All figures are initial assumptions to be validated. None is a confirmed price.**

| Item | Assumption | Basis and status |
|---|---|---|
| Average example gift price | SAR 200 | Near the catalogue median of SAR 190 (mean SAR 303) |
| Partner commission | 8% | **Not negotiated with any retailer.** Published marketplace rates run roughly 1–10% by category; 8% most likely needs a direct local partnership |
| GiftCompass service fee | SAR 10 / order | Willingness to pay is untested |
| Gift wrapping — sale price | SAR 25 | Untested |
| Gift wrapping — cost | SAR 10 | Needs a supplier quotation |
| Payment gateway fee | ≈2.5% | Needs a quotation from Moyasar, Tap or HyperPay |
| AI + hosting allocation | ≈SAR 1 / order | See the reconciliation note in section 13 |
| Premium subscription | **TBD** | Set after customer interviews. Provisional modelling range only: SAR 49–99 per year. Gifting is low-frequency, so a monthly plan may not fit |
| Delivery | **TBD** | Depends on the partner and the distance; normally passed to the customer |

---

## 11. Monetization Process

**The flow (Phase 1B, the full version)**

1. Buyer completes the quiz, **or** the recipient completes an optional opt-in Gift Profile
2. ↓ GiftCompass generates personalized recommendations
3. ↓ Buyer selects a gift
4. ↓ Buyer checks out and may pay for: gift, GiftCompass service fee, wrapping, card, delivery
5. ↓ Retail partner fulfils the gift order
6. ↓ Delivery partner delivers the order
7. ↓ **GiftCompass retains** the applicable commission, service fee and upsell margin
8. ↓ Buyer provides post-delivery feedback
9. ↓ Feedback improves future recommendations

**Phase 1A — affiliate**

GiftCompass → affiliate link → **the retailer's** checkout → retailer fulfils and delivers →
retailer reports the sale → **GiftCompass receives commission only.**

Steps 4, 5 and 6 happen outside GiftCompass, so the service fee, wrapping margin and delivery
upsells do not exist in this phase.

**Phase 1B — GiftCompass checkout**

GiftCompass → **GiftCompass** checkout, where the buyer pays the whole basket → GiftCompass
pays the retailer the gift price less commission → retailer fulfils → delivery partner
delivers → **GiftCompass retains commission + service fee + wrapping and card margin.**

---

## 12. Unit Economics

### Initial Unit Economics Assumption — For Validation

| Line | Calculation | Amount (SAR) |
|---|---|---|
| Example gift price | Assumption | 200 |
| Commission revenue | 8% × 200 | +16 |
| GiftCompass service fee | Fixed, per order | +10 |
| Wrapping paid by the buyer | Sale price | +25 |
| Wrapping materials | Estimated cost | −10 |
| Payment gateway fee | ≈2.5% × 235 collected | −6 |
| AI + hosting allocation | Per order | −1 |
| **Contribution before marketing** | **16 + 10 + 25 − 10 − 6 − 1** | **≈ 34** |
| *Phase 1A, for comparison* | *commission 16 − AI/hosting 1* | *≈ 15* |

**These figures are illustrative assumptions, not results.** SAR 34 is not a guaranteed
profit. It is a contribution *before* marketing, support, fixed cost and any delivery
GiftCompass absorbs, and every input above is unvalidated.

**Money movement in this example:** the buyer pays a basket of SAR 235 (200 gift + 10 service
fee + 25 wrapping) plus delivery. GiftCompass remits SAR 184 to the retailer (200 less the 8%
commission), pays SAR 10 for wrapping materials, ≈SAR 6 to the payment gateway and ≈SAR 1 for
AI and hosting, leaving ≈SAR 34.

These figures must be replaced or validated using partner quotations, payment gateway pricing,
delivery quotations, customer interviews and real transaction data.

---

## 13. Items To Validate

**Replace these figures using**
- Partner and supplier quotations (commission, wrapping)
- Payment gateway pricing from Moyasar, Tap or HyperPay
- Delivery quotations from Aramex, SMSA or local couriers
- Customer interviews on willingness to pay
- Real transaction data from a Jeddah pilot

**Known tensions in these numbers**
- The SAR 1 per order AI and hosting allocation implies about one order per ten sessions. The
  feasibility study measures SAR 0.09 per complete user journey and plans on 1.5% conversion,
  which would put the allocation nearer SAR 6 per order. Either the conversion assumption or
  the allocation has to move.
- The 8% commission exceeds the 5% blended commission used in the feasibility study, and
  exceeds typical marketplace affiliate rates for most categories.

**Customer and market questions still open**
- Are the buyer segments real, and which one converts best?
- Will a buyer pay a SAR 10 service fee on top of the gift price?
- Is SAR 25 an acceptable wrapping price in this market?
- Is there demand for a premium subscription at all, and at what price?
- Which occasions drive the most purchases?
- Will recipients actually complete an opt-in Gift Profile, and at what rate?

**Not yet done**
- No customer interview, survey or focus group has been conducted.
- No partnership, pilot or sale has taken place.
- No price in this document has been tested with a buyer.
- Phase 1B needs an SRS scope change before it can be built.
