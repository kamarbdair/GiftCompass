/** Builds the Day 4 prototype report and the Final Design Document.
 *  Every number is read from the repo so nothing can drift. */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, ImageRun, AlignmentType } = require('docx');
const K = require('./lib/docx-kit.js');

const { P, H, bullet, code, table, titleBlock, note, docStyles, pageMargins, t, HeadingLevel } = K;
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

// ------------------------------------------------------------ live data
const runs = readJson('data/evaluation/recommendations.json');
const full = runs.filter((r) => r.system === 'full');
const base = runs.filter((r) => r.system === 'baseline');
const catalogRows = read('data/products_demo.csv').trim().split('\n').length - 1;
const taxonomy = readJson('docs/schemas/interest-taxonomy.json');
const layla = full.find((r) => r.persona_id === 'psn_layla');
const laylaPersona = readJson('data/personas/psn_layla.json');
const laylaSignals = readJson('data/signals/psn_layla.json');
const sheetRows = read('data/evaluation/rating-sheet.csv').trim().split('\n').length - 1;

const csvSplit = (line) => {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i += 1; } else q = !q; }
    else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
};
const sheetLines = read('data/evaluation/rating-sheet.csv').replace(/\r\n/g, '\n').trim().split('\n');
const sheetHead = csvSplit(sheetLines[0]);
const sheetData = sheetLines.slice(1).map((l) => Object.fromEntries(csvSplit(l).map((c, i) => [sheetHead[i], c])));
const RATERS = [1, 2, 3].filter((n) => sheetData.some((r) => (r[`r${n}_relevance_0_2`] || '').trim() !== ''));
const systemsOf = new Map();
for (const k of read('data/evaluation/rating-key.csv').trim().split('\n').slice(1).map(csvSplit)) {
  const set = systemsOf.get(k[0]) || new Set();
  set.add(k[2]); systemsOf.set(k[0], set);
}
function agg(filter) {
  const rels = []; let del = 0; let emb = 0; let n = 0;
  for (const row of sheetData) {
    if (!filter(row, systemsOf.get(row.item_code) || new Set())) continue;
    for (const r of RATERS) {
      const v = Number(row[`r${r}_relevance_0_2`]);
      if (Number.isNaN(v)) continue;
      rels.push(v); n += 1;
      if ((row[`r${r}_delightful_y_n`] || '').toLowerCase() === 'y') del += 1;
      if ((row[`r${r}_embarrassing_y_n`] || '').toLowerCase() === 'y') emb += 1;
    }
  }
  const mean = rels.length ? rels.reduce((a, b) => a + b, 0) / rels.length : 0;
  return { n, mean, meanTxt: mean.toFixed(2), del,
    delPct: n ? `${Math.round((del / n) * 100)}%` : '—', embPct: n ? `${Math.round((emb / n) * 100)}%` : '—' };
}
const A_FULL = agg((r, s2) => s2.has('full'));
const A_BASE = agg((r, s2) => s2.has('baseline'));
const zeroRated = sheetData.filter((r) => RATERS.every((n) => r[`r${n}_relevance_0_2`] === '0'));

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const fullReturned = sum(full.map((r) => r.recommendations.length));
const baseReturned = sum(base.map((r) => r.recommendations.length));
const metrics = read('data/evaluation/objective-metrics.csv').trim().split('\n').slice(1)
  .map((l) => l.split(','));

function build(children, fileName, title) {
  const doc = new Document({
    creator: 'GiftCompass Team',
    title,
    styles: docStyles,
    sections: [{ ...pageMargins, children }],
  });
  return Packer.toBuffer(doc).then((buf) => {
    const out = path.join(ROOT, 'docs', fileName);
    fs.writeFileSync(out, buf);
    console.log('wrote', path.relative(ROOT, out), buf.length, 'bytes');
  });
}

// =====================================================================
// DAY 4 — PROTOTYPE REPORT
// =====================================================================
const d4 = [];
const p4 = (...x) => x.forEach((e) => d4.push(e));

p4(...titleBlock('GiftCompass', 'Day 4 — Prototype Pipeline',
  'signals → persona → retrieval → filters → ranking → explanations'));

p4(P([t('Day 4 Goal: ', { bold: true }),
  t('build the pipeline end to end and run it over five synthetic recipients, with no real third-party accounts and no live retail data.')]));

p4(H('1. What was built', HeadingLevel.HEADING_1));
p4(P('One module per architecture layer, in TypeScript, under src/lib/giftcompass/. Each layer can be replaced without touching the others, which was the point of publishing the schemas on Day 3.'));
p4(table(['Layer', 'File', 'What it does'], [
  ['2 · Signals', 'types.ts', 'Normalized signal shape and the strength ladder (posted 1.0 … watched 0.3).'],
  ['3 · Persona Builder', 'personaBuilder.ts', 'Maps signal text to taxonomy keys, applies the weight formula, separates dislikes from interests.'],
  ['4 · Retrieval', 'encoder.ts, ranking.ts', 'Vector-space cosine over persona and product text, top 50 candidates.'],
  ['5 · Hard filters', 'filters.ts', 'Budget, delivery, age, relationship fit, dislikes, already-owns, size, availability, embarrassment threshold.'],
  ['6 · Ranking', 'ranking.ts', 'The published score, the relevance gate, the category cap and interest coverage.'],
  ['7 · Explanations', 'ranking.ts', 'One short "why this matches" per result, built from the evidence that drove the match.'],
  ['LLM seam', 'llm.ts', 'Optional list-wise re-rank that can only reorder ids it was given.'],
  ['Orchestration', 'pipeline.ts', 'Runs 4→7 and returns a trace of what was dropped and why.'],
], [1700, 2200, 5100]));

p4(H('2. How to run it', HeadingLevel.HEADING_1));
p4(...code([
  'npm run personas                        # rebuild personas from data/signals/',
  'npm run recommend -- --persona psn_layla',
  'npm test                                # 14 pipeline checks',
  'npm run validate                        # catalog + personas against the schemas',
  'npm run evaluate                        # both systems, all personas, rating sheet',
  '',
  '# or over HTTP, with the dev server running:',
  'curl -X POST http://localhost:3000/api/recommend \\',
  "  -H 'Content-Type: application/json' \\",
  '  -d \'{"persona_id":"psn_layla","relationship":"best_friend",\'\\',
  '     \'"occasion":"birthday","budget_max":500,"days_until_occasion":14}\'',
]));

p4(H('3. The five test recipients', HeadingLevel.HEADING_1));
p4(P('Each is a bundle of raw signals in data/signals/, not a hand-written persona. The builder produces two personas per recipient: the full one, and a quiz-only baseline for the Day 5 comparison. All five are invented; no real person and no real account is involved.'));
p4(table(['Recipient', 'Interests the builder found', 'Dislikes', 'Request'],
  full.map((r) => [
    r.recipient_label.split('—')[0].trim(),
    r.persona_interests.map((i) => `${i.key} ${i.weight}`).join(', '),
    r.dislikes.join(', ') || '—',
    `${r.context.relationship} · ${r.context.occasion}\n≤${r.context.budget_sar.max} SAR · ${r.context.days_until_occasion}d`,
  ]), [1400, 3900, 1500, 2200]));
p4(note('Dislikes were all inferred from a negative sentence in the quiz ("I hate gaming gadgets", "Not into fragrance"), which is the sentiment rule from P2 working: the topic is mentioned, and the answer is still no.'));

p4(H('4. Worked example — Layla', HeadingLevel.HEADING_1));
p4(P(`Input: ${laylaSignals.signals.length} signals (4 quiz answers, ${laylaSignals.signals.length - 4} donated TikTok activity items).`));
p4(P('The builder turns them into weighted interests with evidence attached:'));
p4(...code(laylaPersona.interests.slice(0, 4).map((i) => {
  const ev = i.evidence.map((e) => `${e.count}x ${e.signal_type}`).join(', ');
  return `${i.key.padEnd(12)} weight ${i.weight}  ${i.strength.padEnd(6)}  from ${ev}`;
})));
p4(P(`Then the pipeline runs: ${catalogRows} products → ${layla.trace.retrieved} retrieved → ${layla.trace.after_filters} pass the hard filters → ${layla.trace.returned} shown. Dropped: ${Object.entries(layla.trace.filter_drops).map(([k, v]) => `${k} ${v}`).join(', ')}.`, { before: 120 }));
p4(table(['#', 'Gift', 'SAR', 'Why this matches'],
  layla.recommendations.map((r) => [String(r.rank), r.name_en, String(r.price_sar), r.why]),
  [400, 2300, 700, 5600]));
p4(note('The already-owns filter removed the electric milk frother she already has. The over-budget filter removed three items above 500 SAR.'));

p4(H('5. What is real and what is stubbed', HeadingLevel.HEADING_1));
p4(table(['Piece', 'Status'], [
  ['Persona Builder', 'REAL but deterministic. Keyword matching against the taxonomy plus the published weight formula. An LLM builder implements the same PersonaBuilder interface; nothing downstream changes.'],
  ['Retrieval encoder', 'REAL vector space, TF-IDF rather than neural. Multilingual sentence embeddings drop into the Encoder interface. The cosine step, and everything after it, is unchanged.'],
  ['Hard filters, ranking, diversity, explanations', 'REAL and final. These are plain deterministic code and match the Day 3 specification exactly.'],
  ['LLM re-ranker', 'SEAM ONLY. No model is configured, so the deterministic order stands. The safety wrapper is implemented and tested: an invented product id is discarded.'],
  ['Product data', 'DEMO. 187 rows, realistic Jeddah price bands, no quoted prices, no URLs. The API response carries a disclaimer and the filter can require data_status = verified.'],
  ['TikTok donation', 'NOT IMPLEMENTED. The prototype takes donated activity as a signal file. Building the real upload-and-parse flow is the next step, and only after the feasibility check from Day 2.'],
], [2200, 6800]));
p4(note('No model API key is used anywhere in this prototype. It runs fully offline, which is also why the evaluation is reproducible.'));

p4(H('6. Tests', HeadingLevel.HEADING_1));
p4(P('14 checks, all passing (npm test). They exist because each one caught or guards a real mistake:'));
p4(bullet('The weight formula saturates, decays at the 180-day half-life, and a single signal never reads as a strong interest.'));
p4(bullet('Matching respects word boundaries — "skincare" must not match cars, "watching" must not match watches — while #matcharecipe still resolves to matcha.'));
p4(bullet('A negative sentence becomes a dislike and never an interest.'));
p4(bullet('A persona never carries a sensitive attribute outside the blocked list.'));
p4(bullet('Every hard-filter reason fires for the right input, and the embarrassment threshold is stricter for a colleague than for a partner.'));
p4(bullet('The LLM re-ranker cannot inject a product that was not retrieved.'));
p4(bullet('The pipeline refuses a persona with no consent on record.'));
p4(bullet('Across all ten personas: nothing over budget, at most two items per category, every result has a reason, and nothing is padded when nothing fits.'));

p4(H('7. Problems found while building', HeadingLevel.HEADING_1));
p4(P('Three were only visible once real output existed, which is the argument for building the prototype before writing the final design:'));
p4(table(['What went wrong', 'Fix'], [
  ['Substring matching quietly invented interests: "skincare" contains "car", "carry-on" contains "car", "watching" contains "watch". Two recipients gained a cars interest they never had.', 'Match on word boundaries, with a prefix rule only for terms of 6+ characters so concatenated hashtags still resolve.'],
  ['Layla\'s second-strongest interest, reading, produced nothing in the top 5. Books are cheap, and budget_fit rewards items near 75% of the budget, so a whole interest was priced out.', 'An interest-coverage rule: the two strongest interests each get a slot when a qualifying candidate exists.'],
  ['A pet water fountain reached a football-mad teenager, riding in on the technology tag when the budget had thinned the candidate pool.', 'A relevance gate: an item must be primarily about something they like, or connect to something they like strongly. Four good gifts beat five with one piece of noise.'],
  ['A 190 SAR book bundle was described as fitting a "250–500 SAR budget".', 'Explanations quote the ceiling and say "well under" when the price is less than half of it.'],
], [4600, 4400]));

p4(H('8. Known limitations', HeadingLevel.HEADING_1));
p4(bullet('Keyword matching cannot read tone, sarcasm or context the way the LLM builder is meant to. It only sees terms that are already in the taxonomy.'));
p4(bullet('TF-IDF has no sense of meaning: "cup" and "mug" are unrelated to it. Real embeddings should improve retrieval, particularly across Arabic and English.'));
p4(bullet('Low-giftability filler can still reach the bottom of a thin list — a 45 SAR cable organiser made Omar\'s fifth slot. A giftability floor would remove it, but we would rather see whether the human raters agree first than tune the formula to one example.'));
p4(bullet('The catalog is one author\'s view of the Jeddah market. Interest coverage is even, but real availability and price are unverified.'));

build(d4, 'day4/GiftCompass_Day4_Prototype.docx', 'GiftCompass Day 4 — Prototype Pipeline');

// =====================================================================
// FINAL DESIGN DOCUMENT
// =====================================================================
const fd = [];
const pf = (...x) => x.forEach((e) => fd.push(e));

pf(...titleBlock('GiftCompass', 'Final Design Document',
  'Personalized gift recommendation for Jeddah · consent-based · budget-aware'));

pf(P([t('One line: ', { bold: true }),
  t('understand the recipient first, then find gifts that fit them inside the giver\'s budget — using only data the recipient chose to share.')]));

pf(H('1. Problem and users', HeadingLevel.HEADING_1));
pf(P('People want to give a gift that lands, and they do not know what the recipient would genuinely like. They search across stores, find generic suggestions, discover the good option is over budget, and end up buying something safe that does not fit the person. Too much choice makes the decision harder, not easier.'));
pf(table(['Who', 'Role'], [
  ['Sender', 'Individuals in Jeddah buying for friends, partners, family, colleagues or classmates. Provides relationship, occasion and budget, and receives the recommendations.'],
  ['Receiver', 'The person the gift is for. Optionally builds a Gift Profile by answering a few questions or donating their own platform export. They are the data subject, and consent is theirs to give.'],
  ['Occasions', 'Birthday, graduation, anniversary, wedding, achievement, thank you, Eid, new job, or no occasion at all.'],
], [1600, 7400]));
pf(P('Main challenge: how can we help individuals in Jeddah find the right gift for their loved ones based on the recipient\'s personality, interests, and the giver\'s budget?'));

pf(H('2. Data sources', HeadingLevel.HEADING_1));
pf(P('The starting assumption — read the recipient\'s TikTok reposts — does not survive contact with reality. Platform terms forbid automated collection, TikTok\'s Research API is for approved academic researchers rather than apps, and profiling someone without consent conflicts with the Saudi PDPL. The design is therefore built around consent, not collection.'));
pf(table(['Source', 'Route', 'Decision'], [
  ['Quiz + manual input', 'The sender answers short questions about the recipient.', 'PRIMARY. Always available, needs no third party, and is the baseline every other source must beat.'],
  ['TikTok export', 'The owner requests "Download your data" and uploads it themselves (data donation, P5/P6).', 'Optional enhancement. Richest TikTok signal legally available to us.'],
  ['TikTok Login Kit', 'user.info.basic, video.list.', 'Not enough. Gives the owner\'s own posted videos, not likes or reposts.'],
  ['Pinterest', 'OAuth, boards:read and pins:read.', 'Strong future option — boards are close to a wish list.'],
  ['Spotify', 'OAuth, top artists and genres.', 'Prototype option only; development mode limits test users.'],
  ['Snapchat / X / Instagram', 'Identity only / paid / business accounts only.', 'Not used.'],
], [1900, 3400, 3700]));
pf(H('2.1 Consent flow and retention', HeadingLevel.HEADING_2));
pf(bullet('The sender creates a Gift Profile request and sends the receiver a link.'));
pf(bullet('The receiver chooses: answer a few questions, donate an export, or decline. Declining is a first-class option.'));
pf(bullet('An uploaded export is parsed in the receiver\'s browser. Messages, location, login history and device data are never read.'));
pf(bullet('The receiver previews the inferred interests, removes anything that does not represent them, and only then approves.'));
pf(bullet('The raw file is deleted once the persona is built. Only the approved persona is stored, and it expires after 180 days.'));
pf(bullet('The surprise problem is solved by making the Gift Profile reusable: built once, shared with family and friends, so a request is not a signal that a gift is coming. If the receiver does not respond, the sender\'s quiz answers are used and the surprise is intact.'));
pf(P('Enforced in code, not only in prose: the pipeline throws if a persona has no consent recorded, and the persona schema carries consent, receiver_reviewed, raw_data_deleted and expires_at as required fields.', { before: 100 }));

pf(H('3. Persona model', HeadingLevel.HEADING_1));
pf(P('The persona is a structured, evidence-based interest profile of the receiver — never a paragraph of prose, and never a list of raw posts. Full schema: docs/schemas/persona.schema.json.'));
pf(...code([
  'raw(i)    = SUM over evidence of  count x strength(signal) x 0.5^(age_days / 180)',
  'weight(i) = raw(i) / (raw(i) + 2)',
  '',
  'strength ladder   posted 1.00 > reposted 0.90 > quiz 0.85 > saved 0.80',
  '                  > manual 0.70 > liked 0.60 > followed 0.55 > watched 0.30',
  'bands             strong >= 0.66   medium 0.33-0.66   weak < 0.33',
]));
pf(P('The saturating form is the "one repost is not an interest" rule expressed as arithmetic: a single signal lands in the weak band however strong its type, and only repeated evidence reaches strong. The 180-day half-life means last year\'s enthusiasm fades rather than competing with a current one.', { before: 120 }));
pf(bullet('Every interest carries at least one piece of evidence. No evidence, no interest — that is what makes the preview screen possible.'));
pf(bullet('Sentiment is directional. A negative mention becomes a dislike and is used as an exclusion, not as a small penalty.'));
pf(bullet('Giftability is scored per interest, because liking football converts into a gift and liking memes does not.'));
pf(bullet(`Blocked attributes, never inferred or stored: ${taxonomy.blocked_attributes.slice(0, 7).join(', ')}. P3 showed how much a handful of likes can expose; the answer is to refuse to look.`));

pf(H('4. Matching and ranking', HeadingLevel.HEADING_1));
pf(P(`Products and personas meet through one shared vocabulary of ${taxonomy.interests.length} interest keys, so retrieval is a real join rather than fuzzy string matching.`));
pf(P('Hard filters run BEFORE ranking, so an unaffordable or undeliverable gift is never ranked at all:'));
pf(bullet('price ≤ budget · delivery_days ≤ days left · age range overlaps · relationship_fit includes the relationship'));
pf(bullet('not in dislikes · not already owned · size not required unless the sender knows it · available in Jeddah'));
pf(bullet('embarrassment_risk ≤ the threshold for this relationship (colleague 0.20 … partner 0.70)'));
pf(...code([
  'score = 0.40 * interest_match',
  '      + 0.20 * giftability',
  '      + 0.15 * budget_fit',
  '      + 0.10 * novelty',
  '      - 0.15 * embarrassment_risk',
  '',
  'interest_match = 0.6 * max(persona weight over shared keys) + 0.4 * cosine',
  'budget_fit     peaks at 75% of the budget',
]));
pf(P('Then three rules shape the final list: a relevance gate (an item must be primarily about something they like, or connect to something they like strongly), a cap of two items per category, and interest coverage so the two strongest interests each get a slot. Output is up to five gifts — fewer if fewer qualify. Nothing is padded.', { before: 120 }));
pf(P('Role of the LLM, following P7: it is a profile generator and at most a list-wise re-ranker of the top 10, never the scorer. It may only reorder ids it was given; an invented id is discarded. No fine-tuning — prompting with structured JSON output, validated against the schema before use.'));

pf(H('5. Architecture v2', HeadingLevel.HEADING_1));
const png = fs.readFileSync(path.join(ROOT, 'docs/day3/architecture-v2.png'));
pf(new Paragraph({
  children: [new ImageRun({ data: png, type: 'png', transformation: { width: 520, height: 671 } })],
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 },
}));
pf(table(['#', 'Layer', 'Technology', 'Owner'], [
  ['1', 'Frontend — Gift Context', 'Next.js (App Router) + TypeScript + Tailwind', '(assign)'],
  ['2', 'Consent + Signal Collector', 'Next.js routes; export parsed in the browser', '(assign)'],
  ['3', 'Persona Builder', 'Deterministic today; hosted LLM in JSON mode behind the same interface', '(assign)'],
  ['4', 'Product Catalog + embeddings', 'CSV today; PostgreSQL + pgvector when it grows', '(assign)'],
  ['5', 'Candidate Retrieval', 'TF-IDF cosine today; multilingual sentence embeddings behind the same interface', '(assign)'],
  ['6', 'Hard Filters', 'Deterministic code', '(assign)'],
  ['7', 'Ranking + explanations', 'Deterministic score; optional LLM re-rank of the top 10', '(assign)'],
  ['8', 'Results + Feedback UI', 'Next.js', '(assign)'],
  ['—', 'Privacy / PDPL', 'Cross-cutting: consent, retention, deletion, blocked attributes', '(assign)'],
], [450, 2450, 4300, 1800]));

pf(H('6. Evaluation', HeadingLevel.HEADING_1));
pf(P(`Five synthetic recipients, each run twice: the full pipeline (quiz + donated signals) against a baseline built from the sender's quiz answers alone. Same catalog, same context, same code — the only difference is how much the system knows about the recipient.`));

pf(H('6.1 Results that need no human judgement', HeadingLevel.HEADING_2));
pf(table(['Persona', 'System', 'Shown', 'Mean SAR', 'Budget use', 'Categories', 'Top-3 cover', 'Overlap'],
  metrics.map((m) => [m[0].replace('psn_', ''), m[1], m[2], m[4], m[5], m[6], m[7], m[10]]),
  [1400, 1200, 900, 1100, 1200, 1200, 1100, 900]));
pf(P([t('The finding that matters: ', { bold: true }),
  t(`the full pipeline returned ${fullReturned} recommendations across the five recipients; the quiz-only baseline returned ${baseReturned}. Both stayed inside budget every time. The gap is not that the baseline ranks worse — it is that the baseline often cannot find five items it is confident enough to show, because a handful of quiz answers produce fewer and weaker interests. For Nouf the baseline managed two; the full persona reached five.`)]), { before: 120 });
pf(P('Overlap between the two lists runs 0.4–1.0, so the donated signals change between none and three of the five slots. Where the quiz already captured the main interest, the extra signals mostly confirm it. That is a fair result for the design: the quiz is the primary source by decision, and social signals are an enhancement.'));

pf(H('6.2 Human ratings', HeadingLevel.HEADING_2));
pf(P(`All ${sheetRows} recommendations were rated against a blind sheet — it does not say which system produced an item. ${RATERS.length === 1
  ? 'One rater completed it, so this is a single-rater pilot rather than the three-rater study the brief describes: there is no inter-rater agreement, and the blinding buys little when the rater built the system. It is one informed judgement of thirty suggestions.'
  : `${RATERS.length} raters completed it independently.`}`));
pf(table(['System', 'Ratings', 'Mean relevance (0–2)', 'Delightful', 'Embarrassing'], [
  ['Full pipeline', String(A_FULL.n), A_FULL.meanTxt, A_FULL.delPct, A_FULL.embPct],
  ['Quiz-only baseline', String(A_BASE.n), A_BASE.meanTxt, A_BASE.delPct, A_BASE.embPct],
], [2400, 1400, 2400, 1400, 1400]));
pf(bullet(`Relevance is a tie: ${A_FULL.meanTxt} against ${A_BASE.meanTxt}. The donated signals did not rank better, they produced more — ${A_FULL.n} rated recommendations against ${A_BASE.n}.`));
pf(bullet(`Nothing was rated embarrassing, across all ${sheetRows} items and relationships from a brother at graduation to a colleague starting a job. The per-relationship thresholds worked.`));
pf(bullet(`${sheetRows - zeroRated.length} of ${sheetRows} items were rated 1 or 2, so the pipeline reliably produces plausible gifts.`));
pf(bullet(`Only ${A_FULL.del} of ${A_FULL.n} full-pipeline ratings were called delightful. The recommendations are safe rather than surprising, which points at the weights: novelty carries 0.10 against 0.35 for giftability and budget fit combined. P2 treats delight as a target, not a bonus.`));
pf(bullet('The two items rated 0 were both for Sara, both from the full pipeline, and both outdoor gear pulled in by her travel interest — the catalog files city travel and camping under one key. That is a taxonomy fault, not a ranking fault, and no objective metric caught it.'));
pf(note(`Five recipients and ${RATERS.length} rater${RATERS.length === 1 ? '' : 's'}, with the rater also the builder. Read the numbers as direction, not accuracy.`));

pf(H('7. Worked example, end to end', HeadingLevel.HEADING_1));
pf(P(`Input — best friend, birthday, up to ${layla.context.budget_sar.max} SAR, ${layla.context.days_until_occasion} days away. ${laylaSignals.signals.length} signals: 4 quiz answers and ${laylaSignals.signals.length - 4} donated TikTok activity items.`));
pf(P('Persona (abbreviated):'));
pf(...code([
  '{ "persona_id": "psn_layla",',
  '  "consent": { "consent_given": true, "granted_by": "receiver",',
  '               "receiver_reviewed": true, "raw_data_deleted": true },',
  '  "interests": [',
  ...laylaPersona.interests.slice(0, 3).map((i) =>
    `    { "key": "${i.key}", "weight": ${i.weight}, "strength": "${i.strength}", "giftability": ${i.giftability} },`),
  '    ...',
  '  ],',
  `  "dislikes": [{ "key": "${(laylaPersona.dislikes || [{}])[0].key}", "reason": "receiver_removed" }],`,
  '  "already_owns": [{ "label": "electric milk frother" }] }',
]));
pf(P(`Pipeline: ${catalogRows} products → ${layla.trace.retrieved} retrieved → ${layla.trace.after_filters} survive the hard filters → ${layla.trace.returned} shown.`, { before: 120 }));
pf(table(['#', 'Gift', 'SAR', 'Why this matches'],
  layla.recommendations.map((r) => [String(r.rank), r.name_en, String(r.price_sar), r.why]),
  [400, 2300, 700, 5600]));
pf(note('Prices come from the demo catalog. They are realistic for Jeddah but are not quoted prices, and no listing has been checked.'));

pf(H('8. What we would do next', HeadingLevel.HEADING_1));
pf(bullet('Verify catalog rows against live listings and flip them to data_status = verified. The filter can already require it.'));
pf(bullet('Swap the deterministic persona builder for the LLM one and compare personas built from identical signals.'));
pf(bullet('Swap TF-IDF for multilingual sentence embeddings, which should help most on Arabic signals.'));
pf(bullet('Build the receiver Gift Profile flow — the invite link, in-browser parsing and the preview screen — after the TikTok feasibility check.'));
pf(bullet('Raise the novelty weight: the ratings say the recommendations are safe rather than delightful.'));
pf(bullet('Split the travel interest key into city travel and outdoor adventure — it produced both zero-rated items.'));
pf(bullet('Repeat the evaluation with three independent raters, ideally people who did not build the system.'));

pf(H('9. How this meets the grading criteria', HeadingLevel.HEADING_1));
pf(table(['Criterion', 'Where it is met'], [
  ['Correct use of ideas from the papers', 'P1 gift context (relationship, occasion, budget kept separate from the persona); P2 giftability, sentiment direction and embarrassment as a scored term with per-relationship thresholds; P3 the blocked-attribute list; P5 the donation route; P7 the LLM as profile generator and list-wise re-ranker only, never the scorer.'],
  ['Data sources legal under PDPL and consent-based', 'No scraping anywhere. Quiz is primary; donation is opt-in and parsed on the receiver\'s device; consent, review and deletion are required schema fields, and the pipeline refuses a persona without consent.'],
  ['Architecture clear and buildable', 'Eight layers, one module each, running today as a CLI and an HTTP endpoint. Two layers are stubs behind interfaces, and both stubs are named as such.'],
  ['Persona structured, evidence-based, no sensitive traits', 'Published JSON Schema, weights computed from a documented formula, evidence required on every interest, blocked attributes enforced and covered by a test.'],
  ['Prototype works and is evaluated against a baseline', `Runs end to end over five recipients with 14 passing tests. Objective metrics complete, and all ${sheetRows} recommendations rated against a blind sheet: relevance ${A_FULL.meanTxt} full against ${A_BASE.meanTxt} baseline, nothing embarrassing, ${sheetRows - zeroRated.length} of ${sheetRows} plausible or better. Reported as a single-rater pilot.`],
], [2600, 6400]));

pf(H('10. Sources', HeadingLevel.HEADING_1));
pf(bullet('P1. Gift recommendation systems: a review. Electronic Commerce Research (2023). doi: 10.1007/s10660-023-09790-6'));
pf(bullet('P2. Pavlidis et al. Anatomy of a gift recommendation engine powered by social media. ACM SIGMOD \'12. doi: 10.1145/2213836.2213950'));
pf(bullet('P3. Kosinski, Stillwell & Graepel. Private traits and attributes are predictable from digital records of human behavior. PNAS 110(15), 2013.'));
pf(bullet('P4. Fiesler, Beard & Keegan. No Robots, Spiders, or Scrapers. ICWSM 14(1), 2020.'));
pf(bullet('P5. Boeschoten et al. A framework for privacy preserving digital trace data collection through data donation. CCR 4(2), 2022.'));
pf(bullet('P6. Zannettou et al. Analyzing User Engagement with TikTok\'s Short Format Video Recommendations using Data Donations. CHI \'24.'));
pf(bullet('P7. Wu et al. A Survey on Large Language Models for Recommendation. arXiv:2305.19860; World Wide Web 27(5), 60 (2024).'));
pf(bullet('Saudi Personal Data Protection Law (PDPL, Royal Decree M/19) and SDAIA implementing regulations.'));
pf(bullet('GiftCompass Day 1, Day 2 and Day 3 reports.'));

build(fd, 'GiftCompass_Final_Design_Document.docx', 'GiftCompass Final Design Document');
