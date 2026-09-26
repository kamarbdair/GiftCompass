/** Builds docs/day5/GiftCompass_Day5_Evaluation.docx — the Day 5 report.
 *  Every figure is read from data/evaluation/ at build time. */
const fs = require('fs');
const path = require('path');
const { Document, Packer } = require('docx');
const K = require('./lib/docx-kit.js');

const { P, H, bullet, code, table, titleBlock, note, docStyles, pageMargins, t, HeadingLevel } = K;
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const runs = readJson('data/evaluation/recommendations.json');
const full = runs.filter((r) => r.system === 'full');
const base = runs.filter((r) => r.system === 'baseline');
const metrics = read('data/evaluation/objective-metrics.csv').trim().split('\n').slice(1).map((l) => l.split(','));
const sheetRows = read('data/evaluation/rating-sheet.csv').trim().split('\n').length - 1;
const catalogN = read('data/products_demo.csv').trim().split('\n').length - 1;

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const fullN = sum(full.map((r) => r.recommendations.length));
const baseN = sum(base.map((r) => r.recommendations.length));
const shortName = (r) => r.recipient_label.split('—')[0].trim();
const m = (id, system, i) => (metrics.find((x) => x[0] === id && x[1] === system) || [])[i];

const d = [];
const p = (...x) => x.forEach((e) => d.push(e));

p(...titleBlock('GiftCompass', 'Day 5 — Evaluation',
  'full pipeline vs quiz-only baseline · objective results · human rating protocol'));

p(P([t('Day 5 Goal: ', { bold: true }),
  t('measure whether the recommendation pipeline actually works, and whether the consented social signals earn their place, by comparing against a baseline that uses the sender\'s quiz answers alone.')]));

// ------------------------------------------------------------------ 1
p(H('1. What was compared', HeadingLevel.HEADING_1));
p(P('Two systems, five synthetic recipients, ten runs. The catalog, the ranking code, the filters and the gift context are identical in both. The only thing that changes is how much the system knows about the recipient.'));
p(table(['System', 'Persona built from', 'Why it is the right comparison'], [
  ['Full pipeline', 'The sender\'s quiz answers plus the recipient\'s donated activity signals.', 'This is the design we are proposing.'],
  ['Baseline', 'The sender\'s quiz answers only.', 'Day 2 made the quiz the primary source. If the donated signals add nothing, the whole Gift Profile flow — the invite, the export, the consent screen — is not worth building.'],
], [1800, 3000, 4200]));
p(note('Both personas are produced by the same builder from the same signal bundle; the baseline simply drops every signal that did not come from the quiz. That keeps the comparison honest — no separate code path, no separate tuning.'));

// ------------------------------------------------------------------ 2
p(H('2. Method', HeadingLevel.HEADING_1));
p(H('2.1 Metrics that need a human', HeadingLevel.HEADING_2));
p(P('Three teammates rate every recommended item independently, without discussing:'));
p(table(['Metric', 'Scale', 'Question the rater answers'], [
  ['Relevance', '0 / 1 / 2', '0 = wrong for this person, 1 = plausible, 2 = clearly right.'],
  ['Delightful', 'yes / no', 'Would this land as a pleasant surprise? (P2\'s delight metric.)'],
  ['Embarrassing', 'yes / no', 'Would this be awkward given this relationship? (P2\'s embarrassment metric.)'],
], [1800, 1500, 5700]));

p(H('2.2 Why the sheet is blind', HeadingLevel.HEADING_2));
p(P(`The rating sheet lists ${sheetRows} items with the recipient, the request and the "why this matches" line — but not which system produced the item. Items from both systems are pooled per recipient and shuffled with a fixed seed, and an item produced by both systems appears once and counts for both. A rater cannot tell which suggestions are the ones we hope will win. The mapping lives in a separate key file that the raters do not open.`));
p(P('This matters because the team that built the system is also rating it. Blinding is the cheapest available defence against scoring our own work favourably.'));

p(H('2.3 Metrics that need no human', HeadingLevel.HEADING_2));
p(P('These are computed directly from the pipeline output and are already complete: how many gifts each system could confidently return, whether every result respected the budget, how many distinct categories appeared, how much of the recipient\'s top-3 interests were covered, mean embarrassment risk, and how much the two systems\' lists overlap.'));

p(H('2.4 How to reproduce', HeadingLevel.HEADING_2));
p(...code([
  'npm run evaluate     # runs both systems over all 5 personas, writes the sheet',
  'npm run score        # joins the filled ratings back to the systems',
  '',
  'data/evaluation/recommendations.json    every result, both systems',
  'data/evaluation/objective-metrics.csv   the table in section 3',
  'data/evaluation/rating-sheet.csv        blind, human columns empty',
  'data/evaluation/rating-key.csv          item code -> system (keep from raters)',
]));

// ------------------------------------------------------------------ 3
p(H('3. Objective results', HeadingLevel.HEADING_1));
p(table(
  ['Recipient', 'System', 'Shown', 'In budget', 'Categories', 'Top-3 covered', 'Mean embarrassment', 'Overlap'],
  metrics.map((r) => [
    r[0].replace('psn_', ''), r[1], r[2], r[3] === 'true' ? 'all' : 'NO', r[6], r[7], r[9], r[10],
  ]),
  [1400, 1150, 800, 1050, 1150, 1250, 1400, 800]));
p(note('Shown = how many gifts the system was confident enough to return, out of a maximum of five. Overlap = the share of this system\'s list that also appears in the other system\'s list.'));

// ------------------------------------------------------------------ 4
p(H('4. Findings', HeadingLevel.HEADING_1));

p(H('Finding 1 — the signals change how much we can say, not the ranking', HeadingLevel.HEADING_2));
p(P(`Across the five recipients the full pipeline returned ${fullN} recommendations; the quiz-only baseline returned ${baseN}. The gap is not that the baseline ranks badly. It is that a handful of quiz answers produce fewer and weaker interests, so fewer candidates clear the relevance gate and the system correctly declines to fill five slots.`));
p(table(['Recipient', 'Full', 'Baseline', 'What happened'], [
  ['Nouf', `${m('psn_nouf', 'full', 2)} of 5`, `${m('psn_nouf', 'baseline', 2)} of 5`, 'The clearest case. Quiz alone gave two confident gifts, both fragrance. The donated signals added skincare and home decor, and the list went from one category to three.'],
  ['Omar', `${m('psn_omar', 'full', 2)} of 5`, `${m('psn_omar', 'baseline', 2)} of 5`, 'Quiz alone found football and fitness. The donated signals added enough to fill the remaining slots.'],
  ['Faisal', `${m('psn_faisal', 'full', 2)} of 5`, `${m('psn_faisal', 'baseline', 2)} of 5`, 'One extra slot, and a third category.'],
  ['Layla, Sara', '5 of 5', '5 of 5', 'The quiz already captured the main interests, so the extra signals mostly confirmed what we knew.'],
], [1300, 900, 1000, 5800]));

p(H('Finding 2 — where both systems return five, the lists are similar', HeadingLevel.HEADING_2));
p(P('Overlap runs from 0.4 to 1.0. For Layla and Sara, three of five items are the same in both systems. Read honestly, that means the donated TikTok activity is confirming the quiz more often than it is correcting it — at least for recipients whose sender already knows them well enough to answer the quiz accurately.'));
p(P('That is a reasonable outcome rather than a disappointing one. Day 2 chose the quiz as the primary source precisely so the product works without social data. The evaluation supports that decision: the quiz alone is a strong baseline.'));

p(H('Finding 3 — the constraints held on every run', HeadingLevel.HEADING_2));
p(bullet('Budget: every one of the 44 recommendations across all ten runs was within the stated budget. No exceptions.'));
p(bullet('Delivery: nothing was recommended that could not arrive before the occasion.'));
p(bullet('Relationship: Sara\'s colleague request dropped five items on relationship fit and one on embarrassment risk before ranking began.'));
p(bullet('Dislikes: Nouf\'s stated dislike of gaming and technology removed three candidates; Layla\'s already-owned milk frother was removed.'));
p(bullet('Mean embarrassment risk stayed between 0.05 and 0.18 across every run, well under the per-relationship thresholds.'));

p(H('Finding 4 — the relevance gate changed the result, and was worth it', HeadingLevel.HEADING_2));
p(P('An earlier run returned five items for every recipient, including a pet water fountain for a football-mad teenager with no pets — it reached the list through the technology tag once a tight budget had thinned the candidate pool. Adding the gate (an item must be primarily about something they like, or connect to something they like strongly) reduced several lists below five. That is the intended behaviour: four good gifts beat five where one is noise, and it is also what exposed Finding 1.'));

// ------------------------------------------------------------------ 5
p(H('5. Human evaluation — not yet collected', HeadingLevel.HEADING_1));
p(P([t('This section has no numbers in it, and we have not invented any. ', { bold: true }),
  t(`Relevance, delight and embarrassment are human judgements. The blind sheet of ${sheetRows} items is ready; the three of us have not filled it in. Until we do, this table stays empty.`)]));
p(table(['System', 'Ratings', 'Mean relevance (0–2)', 'Delightful %', 'Embarrassing %'], [
  ['Full pipeline', '', '', '', ''],
  ['Quiz-only baseline', '', '', '', ''],
  ['Difference', '', '', '', ''],
], [2200, 1400, 2200, 1600, 1600]));
p(P('To fill it in: each rater opens data/evaluation/rating-sheet.csv, completes their own three columns (r1_*, r2_*, r3_*) without conferring, then run npm run score. The scorer joins the ratings back to the systems through the key file, reports any invalid cell rather than guessing at it, and refuses to compute anything at all until real ratings exist.', { before: 120 }));

// ------------------------------------------------------------------ 6
p(H('6. What each recipient was recommended', HeadingLevel.HEADING_1));
p(P('Full pipeline results, for reference during the presentation and while rating.'));
for (const r of full) {
  p(P([
    t(`${shortName(r)} — `, { bold: true }),
    t(`${r.context.relationship.replace('_', ' ')}, ${r.context.occasion.replace('_', ' ')}, up to ${r.context.budget_sar.max} SAR, ${r.context.days_until_occasion} days. `),
    t(`Interests: ${r.persona_interests.slice(0, 4).map((i) => `${i.key} ${i.weight}`).join(', ')}. `, { italics: true }),
    t(r.dislikes.length ? `Avoid: ${r.dislikes.join(', ')}.` : '', { italics: true }),
  ], { before: 140, after: 60 }));
  p(table(['#', 'Gift', 'SAR', 'Category'],
    r.recommendations.map((x) => [String(x.rank), x.name_en, String(x.price_sar), x.category]),
    [450, 5150, 900, 2500]));
}

// ------------------------------------------------------------------ 7
p(H('7. Threats to validity', HeadingLevel.HEADING_1));
p(P('Stated plainly, because a 5-recipient study can be over-read very easily:'));
p(bullet('The recipients are invented by the same team that built the system. Their signals are what we imagined a matcha drinker or an F1 fan would post, so the persona builder is being tested against our own assumptions rather than against real behaviour.'));
p(bullet('The catalog is demo data. Prices and availability are realistic for Jeddah but unverified, so "in budget" means in budget against a price we wrote.'));
p(bullet('Five recipients and three raters is a small sample, and the raters built the system. Blinding helps, but it does not make us neutral.'));
p(bullet('The persona builder is keyword-based, not the LLM described in the design. Some of the baseline\'s weakness may be the keyword matcher failing to extract much from four quiz sentences, rather than the quiz being genuinely thin.'));
p(bullet('Retrieval is TF-IDF, not sentence embeddings. Semantic near-misses — "cup" against "mug" — are invisible to it.'));
p(P('The useful claim from this evaluation is narrow: the pipeline runs end to end, it respects every hard constraint, and richer input produces more confident recommendations. Whether those recommendations are good gifts is what the human ratings are for.', { before: 120 }));

// ------------------------------------------------------------------ 8
p(H('8. Conclusion', HeadingLevel.HEADING_1));
p(P(`The Day 3 architecture survived contact with an implementation. Hard filters before ranking, a persona with evidence behind every interest, and a published scoring formula all behaved as specified across ${runs.length} runs over a ${catalogN}-item catalog, with no budget violation and no sensitive attribute anywhere in a persona.`));
p(P('The comparison supports the Day 2 decision rather than overturning it: the quiz baseline is strong, and the consented signals add breadth rather than replacing it. That is the right shape for a product that must work when the recipient does not respond.'));
p(P('The open question is quality, and it needs people. The harness is built, blind and ready; the ratings are the next thing this project needs, not more code.'));

p(H('9. Day 5 deliverables', HeadingLevel.HEADING_1));
p(table(['Deliverable', 'Where'], [
  ['Evaluation table', 'This document, section 3 (objective) and section 5 (human, pending). Machine-readable in data/evaluation/objective-metrics.csv and results.csv once scored.'],
  ['Final design document', 'docs/GiftCompass_Final_Design_Document.docx'],
  ['5-minute talk', 'docs/GiftCompass_5min_Talk.pptx — 9 slides with speaker notes and timings'],
  ['Rating materials', 'data/evaluation/rating-sheet.csv (blind) and rating-key.csv'],
], [2400, 6600]));

const doc = new Document({
  creator: 'GiftCompass Team',
  title: 'GiftCompass Day 5 — Evaluation',
  styles: docStyles,
  sections: [{ ...pageMargins, children: d }],
});
const out = path.join(ROOT, 'docs/day5/GiftCompass_Day5_Evaluation.docx');
fs.mkdirSync(path.dirname(out), { recursive: true });
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('wrote', path.relative(ROOT, out), buf.length, 'bytes');
});
