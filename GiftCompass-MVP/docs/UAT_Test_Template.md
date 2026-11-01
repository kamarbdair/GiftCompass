# GiftCompass MVP: User Acceptance Test (UAT) Template

**Purpose:** check that real users can complete the 10-question flow, and find out whether they find the recommendations relevant, the explanations clear, and the questions acceptable.
**Participants:** 5–8 people who bought a gift in the last 6 months. Use participant codes (P01, P02…) and record no names.
**Session:** about 15–20 minutes per participant. Run the app with `node server.js` and start each session from the welcome page. Record results in `UAT_Results_Sheet.csv`.

> Tell each participant: "This is a prototype. The products are demo examples, not real listings, and no shops are connected. We're testing the app, not you. Please think aloud."
> Ask them to think of a real recipient, but never to name them or enter personal details.

---

## Part A: Participant context (no identifiers)

| # | Question | Answer |
|---|---|---|
| A1 | Participant code | P__ |
| A2 | How often do you buy gifts? (monthly / every few months / rarely) | |
| A3 | Who did you last buy a gift for? (relationship only) | |
| A4 | How do you usually find gift ideas? | |

## Part B: Tasks

Record for each task: done (Y/N), time in seconds, errors or hesitations, and notes.

| Task | Instruction to participant | Success criteria | Done | Time (s) | Errors | Notes |
|---|---|---|---|---|---|---|
| T1 | "Look at the welcome page. What are the two ways to describe the recipient, and which one can you use today?" | Identifies Option A as available and Option B as coming later | | | | |
| T2 | "Find gift ideas for someone you need a gift for soon. Answer all 10 questions." | Reaches the results page without help | | | | |
| T3 | "Tell me why the top suggestion was recommended." | Refers to the explanation or matched criteria on the card | | | | |
| T4 | "Find out how the match percentage was calculated." | Opens "How was this scored?" | | | | |
| T5 | "Say they've told you they want a specific item. Add it and update the results." | Uses Edit → Wishes & avoid, enters the item and updates; a matching item (if one exists in the demo catalogue) shows the wish-list badge | | | | |
| T6 | "Say they already have one of the suggested items. Remove it." | Enters it in Q8 and updates; the item disappears and appears in the "removed" list | | | | |
| T7 | "Exclude a whole type of gift, for example anything with fragrance." | Selects it in Q9; no matching items are shown | | | | |
| T8 | "Lower your budget to under SAR 100." | Edits the budget; all prices are SAR 100 or less | | | | |
| T9 | "Start again for a different person." | Uses Start over and gets a blank questionnaire | | | | |

**Pass target:** at least 80% of participants complete T2, T5, T6 and T8 without help.

## Part C: Ratings (1 = strongly disagree, 5 = strongly agree)

| # | Statement | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| C1 | The 10 questions were easy to understand. | | | | | |
| C2 | The number of questions felt reasonable. | | | | | |
| C3 | Grouping the questions into 5 steps made the questionnaire feel manageable. | | | | | |
| C4 | The recommendations matched the person I described. | | | | | |
| C5 | At least one suggestion is something I would consider buying. | | | | | |
| C6 | The explanations helped me understand why each gift was suggested. | | | | | |
| C7 | Adding a known wish improved the results. | | | | | |
| C8 | The "already have" and "avoid" questions removed unsuitable gifts. | | | | | |
| C9 | I trust that all suggestions were within my budget. | | | | | |
| C10 | Changing my answers was easy. | | | | | |
| C11 | I was comfortable with the information the app asked for. | | | | | |
| C12 | I understood that the social media option (B) is not available yet and would need the recipient's permission. | | | | | |
| C13 | I would use GiftCompass for my next gift. | | | | | |

**Targets:** average ≥ 4.0 for C1, C6, C9, C10 and C11; average ≥ 3.5 for C4 and C5.

## Part D: Open feedback

1. What did you like most?
2. Which question was confusing, unnecessary or uncomfortable?
3. Which recommendation was the least suitable, and why?
4. Is there a question about the recipient we should add?
5. Would you, as a recipient, connect your own social media to help friends choose gifts for you (Option B)? Why or why not?
6. Would you prefer the app in Arabic, English or both?

## Part E: Facilitator observations

- Where did the participant hesitate or go back?
- Did they read the explanation sentence without being prompted?
- Did they use the free-text questions (Q7, Q8)? Did they try to enter personal details? If so, note it, since the wording may need changing.
- Did they notice the "demo data" and "retailer not verified" labels?
- Bugs or errors: record the screen, the steps taken and what happened.

---

## Summary (after all sessions)

| Metric | Result | Target | Met? |
|---|---|---|---|
| Completion rate for T2, T5, T6 and T8 | | ≥ 80% | |
| Average time for T2 (full questionnaire) | | ≤ 150 s | |
| Average C4 (relevance) | | ≥ 3.5 | |
| Average C6 (explanation clarity) | | ≥ 4.0 | |
| Average C11 (comfort with data asked) | | ≥ 4.0 | |
| Critical bugs found | | 0 | |

**Top 3 changes to make based on the feedback:**
1.
2.
3.
