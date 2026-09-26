// Builds docs/day3/GiftCompass_Day3_Architecture_Schemas_Catalog.docx
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ImageRun,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');

// --- read the catalog so every number in this document comes from the CSV ---
function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  const lines = text.split('\n');
  const head = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = []; let cur = ''; let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}
const CATALOG = readCsv(path.join(ROOT, 'data/products_demo.csv'));
const count = (key) => CATALOG.reduce((m, r) => (m[r[key]] = (m[r[key]] || 0) + 1, m), {});
const BY_CAT = count('category');
const BY_BAND = count('budget_band');
const CAT_ROWS = (() => {
  const sorted = Object.entries(BY_CAT).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const half = Math.ceil(sorted.length / 2);
  return sorted.slice(0, half).map((left, i) => {
    const right = sorted[half + i];
    return [left[0], String(left[1]), right ? right[0] : '', right ? String(right[1]) : ''];
  });
})();
const N_PRODUCTS = CATALOG.length;
const N_COLS = Object.keys(CATALOG[0]).length;
const N_KEYS = new Set(CATALOG.flatMap((r) => r.interest_keys.split('|'))).size;
const TOTAL = 9000;

const t = (text, o = {}) => new TextRun({ text, ...o });

const P = (text, o = {}) => new Paragraph({
  children: Array.isArray(text) ? text : [t(text, o.run || {})],
  spacing: { after: o.after === undefined ? 120 : o.after, before: o.before || 0 },
  alignment: o.align,
  indent: o.indent,
  border: o.border,
});

const H = (text, level) => new Paragraph({
  text, heading: level, spacing: { before: 280, after: 140 },
});

const bullet = (text) => new Paragraph({
  children: [t(text)], bullet: { level: 0 }, spacing: { after: 80 },
});

const code = (lines) => lines.map((ln, i) => new Paragraph({
  children: [t(ln === '' ? ' ' : ln, { font: 'Consolas', size: 16 })],
  spacing: { after: 0, before: i === 0 ? 60 : 0 },
  shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
}));

function table(headers, rows, widths) {
  const w = widths || headers.map(() => Math.floor(TOTAL / headers.length));
  const cell = (text, width, opts = {}) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts.head ? { type: ShadingType.CLEAR, fill: 'E2E8F0' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: String(text).split('\n').map((line) => new Paragraph({
      children: [t(line, { bold: !!opts.head, size: 19 })],
      spacing: { after: 0 },
    })),
  });
  return new Table({
    columnWidths: w,
    width: { size: TOTAL, type: WidthType.DXA },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, w[i], { head: true })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, w[i])) })),
    ],
  });
}

const children = [];
const push = (...x) => x.forEach((e) => children.push(e));

// ---------------------------------------------------------------- title
push(new Paragraph({
  children: [t('GiftCompass', { bold: true, size: 56, color: '1E3A8A' })],
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
}));
push(new Paragraph({
  children: [t('Day 3 — Architecture v2, Schemas and Product Catalog', { size: 30, color: '334155' })],
  alignment: AlignmentType.CENTER, spacing: { after: 40 },
}));
push(new Paragraph({
  children: [t('Diagram v2  ·  Persona JSON schema  ·  Product schema  ·  catalog CSV  ·  layer ownership', { size: 20, color: '64748B', italics: true })],
  alignment: AlignmentType.CENTER, spacing: { after: 240 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 8 } },
}));

push(P([
  t('Day 3 Goal: ', { bold: true }),
  t('turn the Day 1 gap list and the Day 2 consent decision into a buildable design — an architecture diagram with one owner per layer, two machine-readable schemas that the whole pipeline agrees on, and a product catalog large enough to test recommendations against.'),
]));

// ---------------------------------------------------------------- 1. P7
push(H('1. P7 Skim — What GiftCompass Takes From LLMs for Recommendation', HeadingLevel.HEADING_1));
push(P('P7 (Wu et al., A Survey on Large Language Models for Recommendation) was read for two questions only, as the task brief instructs: how LLMs are used as rankers, and how they are used as profile / feature generators.'));

push(table(
  ['Idea in P7', 'Decision for GiftCompass'],
  [
    ['The field splits into discriminative (DLLM4Rec) and generative (GLLM4Rec) use of LLMs.', 'We are generative: the LLM writes a structured persona and short explanations. We do not train a discriminative recommender.'],
    ['Two paradigms: non-tuning (prompting, in-context learning) and tuning (fine-tuning, instruction tuning).', 'Non-tuning only. We have no training data, no labelled interactions and no GPU budget. Prompt + JSON output mode is enough and is reproducible for a student team.'],
    ['LLM as profile / feature generator: summarise a user\'s history into a usable profile.', 'This is exactly our Persona Builder (layer 3). It is the single place the LLM is allowed to create new content.'],
    ['LLM as ranker in three shapes: point-wise (one item at a time), pair-wise (compare two), list-wise (order the whole list in one call).', 'List-wise, and only over the top 10. Point-wise and pair-wise call the LLM once per item or per pair, so cost and latency grow with the candidate set.'],
    ['Text embeddings are used as a feature encoder for retrieval.', 'Multilingual sentence embeddings over persona interests and product text, cosine similarity, top 50 candidates. Arabic and English must both work.'],
    ['Known weaknesses: hallucination, inconsistent evaluation, cost at scale.', 'The LLM may only re-order product_ids we supply; any id it invents is dropped. The deterministic score stays the backbone, and Day 5 compares against a quiz-only baseline.'],
  ],
  [3400, 5600],
));

push(P('Four rules that follow from the skim:', { before: 160 }));
push(bullet('No fine-tuning anywhere in the MVP. Prompting with structured JSON output only.'));
push(bullet('The LLM writes the persona; it does not decide the ranking. Scoring is deterministic and inspectable.'));
push(bullet('The LLM re-ranks at most 10 candidates and must return only product_ids that were given to it.'));
push(bullet('Every LLM output is validated against its JSON Schema before use. Invalid output is retried once, then the deterministic path is used without the LLM.'));

push(new Paragraph({
  children: [t('Access note: arxiv.org, Springer, ACM and Semantic Scholar are blocked from our working environment, so P7 was skimmed through indexed summaries and secondary sources rather than the full PDF. The taxonomy above (DLLM4Rec / GLLM4Rec, non-tuning vs tuning, point-/pair-/list-wise ranking) is reported consistently across those sources, but page-level citations should be added once a team member opens the paper directly.', { italics: true, size: 18, color: '64748B' })],
  spacing: { before: 120, after: 120 },
}));

// ---------------------------------------------------------------- 2. architecture
push(H('2. Architecture v2', HeadingLevel.HEADING_1));
push(P('The diagram applies all four fixes the task brief asked for: a Consent + Signal Collector and a Persona Builder in front of the engine, the product database connected to retrieval, hard filters applied before ranking, and a feedback loop.'));

const png = fs.readFileSync(path.join(ROOT, 'docs/day3/architecture-v2.png'));
push(new Paragraph({
  children: [new ImageRun({ data: png, type: 'png', transformation: { width: 560, height: 723 } })],
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 },
}));
push(new Paragraph({
  children: [t('Figure 1 — GiftCompass Architecture v2. Green = consent and privacy, purple = persona, amber = recommendation engine, grey = data stores.', { italics: true, size: 18, color: '64748B' })],
  alignment: AlignmentType.CENTER, spacing: { after: 200 },
}));

push(H('2.1 What changed since the Day 1 diagram', HeadingLevel.HEADING_2));
push(table(
  ['Day 1 gap', 'Fixed in v2 by'],
  [
    ['TikTok module assumed data could be collected without a consent route', 'Layer 2 is a Consent + Signal Collector. The quiz is the primary source; a receiver-consented export is optional and is parsed in the receiver\'s browser.'],
    ['No structured persona between signals and matching', 'Layer 3 Persona Builder emits Persona JSON against a published schema.'],
    ['All interests treated equally', 'Every interest carries a weight computed from signal strength and recency.'],
    ['No sentiment handling', 'Negative sentiment never becomes an interest; it becomes a dislike and is used as an exclusion filter.'],
    ['Not every interest makes a good gift', 'giftability scored on both the interest and the product, and it is a term in the ranking.'],
    ['Ranking criteria undefined', 'One published formula (section 5) with fixed weights.'],
    ['Budget filter applied after matching', 'Hard filters (layer 5) run before ranking, so ranking only ever sees affordable, deliverable, relationship-appropriate items.'],
    ['No feedback loop', 'Layer 8 records thumbs up/down with reason codes, feeding the Day 5 evaluation.'],
  ],
  [3400, 5600],
));

push(H('2.2 Technology per layer and owner', HeadingLevel.HEADING_2));
push(table(
  ['#', 'Layer', 'Technology', 'Owner'],
  [
    ['1', 'Frontend — Gift Context', 'Next.js (App Router) + TypeScript + Tailwind', '(assign)'],
    ['2', 'Consent + Signal Collector', 'Next.js route handlers; ZIP parsed in the browser; consent record stored server-side', '(assign)'],
    ['3', 'Persona Builder', 'Hosted LLM API in JSON mode; schema validation on every output', '(assign)'],
    ['4', 'Product Catalog + embeddings', 'CSV now; PostgreSQL + pgvector (Supabase free tier) when it grows', '(assign)'],
    ['5', 'Candidate Retrieval', 'Multilingual sentence embeddings (AR + EN), cosine top 50', '(assign)'],
    ['6', 'Hard Filters', 'Plain deterministic code — no model involved', '(assign)'],
    ['7', 'Ranking + explanations', 'Deterministic score, optional LLM list-wise re-rank of top 10', '(assign)'],
    ['8', 'Results + Feedback UI', 'Next.js; feedback rows kept for the Day 5 evaluation', '(assign)'],
    ['—', 'Privacy / PDPL compliance', 'Cross-cutting: consent records, retention, deletion, blocked attributes', '(assign)'],
  ],
  [500, 2500, 4200, 1800],
));

push(new Paragraph({
  children: [
    t('Stack note. ', { bold: true }),
    t('The task brief suggests React or Flutter with a Python FastAPI backend. We have already scaffolded the project as Next.js + TypeScript + Tailwind, which keeps one language and one deployment for a small team and still gives us server-side routes for the persona and ranking work. The only reason to add Python would be running sentence-transformers locally; a hosted embedding API removes that need. If the course requires the brief\'s stack, layers 3–7 are plain functions and can be moved behind a FastAPI service without touching layers 1, 2 and 8.'),
  ],
  spacing: { before: 140, after: 120 },
}));

// ---------------------------------------------------------------- 3. persona schema
push(H('3. Persona JSON Schema', HeadingLevel.HEADING_1));
push(P('Full schema: docs/schemas/persona.schema.json. It describes the receiver only. Relationship, occasion and budget belong to the sender and live in a separate Gift Context object, so one persona can be reused for a different occasion or budget without being rebuilt.'));

push(H('3.1 Top-level fields', HeadingLevel.HEADING_2));
push(table(
  ['Field', 'Purpose'],
  [
    ['persona_id, schema_version, created_at, expires_at', 'Identity and retention. expires_at enforces PDPL storage limitation; the persona is deleted at that point.'],
    ['consent', 'Who consented, to what purpose, through which sources, whether the receiver reviewed the result, and whether the raw upload has been deleted. A persona with consent_given = false must not be used.'],
    ['recipient_basics', 'Coarse context only: age range, city, optional self-declared life stage. No name, no handle, no exact date of birth.'],
    ['interests[]', 'The core. Each entry has key, weight, strength band, sentiment, giftability, confidence and at least one piece of evidence.'],
    ['dislikes[]', 'Hard negatives used as an exclusion filter, not a small penalty.'],
    ['style', 'Aesthetic tags plus two axes: practical ↔ sentimental and product ↔ experience.'],
    ['already_owns[]', 'Filtered out so we do not recommend a duplicate.'],
    ['blocked_attributes', 'The deny-list written into every persona as a self-check.'],
    ['provenance', 'Which builder produced it, how many signals, completeness, and whether it is a sender-quiz fallback.'],
  ],
  [3000, 6000],
));

push(H('3.2 How a weight is computed', HeadingLevel.HEADING_2));
push(P('Signal strength follows the ladder in the task brief — what someone posts is stronger evidence than what they merely watched.'));
push(table(
  ['Signal', 'Strength', 'Signal', 'Strength'],
  [
    ['posted', '1.00', 'manual_caption', '0.70'],
    ['reposted', '0.90', 'liked', '0.60'],
    ['quiz_answer', '0.85', 'followed', '0.55'],
    ['saved / favourite', '0.80', 'watched', '0.30'],
  ],
  [2600, 1900, 2600, 1900],
));
push(...code([
  'raw(i)    = SUM over evidence of  count x strength(signal) x 0.5^(age_days / 180)',
  'weight(i) = raw(i) / (raw(i) + 2)          ->  always in [0, 1)',
  'strength  = strong  if weight >= 0.66',
  '            medium  if 0.33 <= weight < 0.66',
  '            weak    if weight < 0.33',
]));
push(P('Two properties matter. The 180-day half-life means an interest from last year fades instead of competing with a current one. The saturating form means a single loud signal cannot reach 1.0 — only repeated evidence gets there, which is the "one repost is not an interest" rule from Step 5 expressed as arithmetic.', { before: 120 }));
push(P('Worked example — matcha in the sample persona below:'));
push(...code([
  '7 x saved     43 days old ->  7 x 0.80 x 0.847 = 4.745',
  '3 x reposted  58 days old ->  3 x 0.90 x 0.800 = 2.160',
  '1 x quiz      same day    ->  1 x 0.85 x 1.000 = 0.850',
  'raw = 7.755     weight = 7.755 / 9.755 = 0.79   -> strong',
]));

push(H('3.3 Rules the Persona Builder must follow', HeadingLevel.HEADING_2));
push(bullet('No evidence, no interest. Every interest carries at least one evidence item, which is what lets the receiver see and remove it on the approve screen.'));
push(bullet('Negative sentiment never becomes an interest. "I hate Twilight" mentions Twilight and is a NO (P2). It becomes a dislike.'));
push(bullet('Never emit religion, health, politics, sexuality, ethnicity or financial status, even when the signals would allow it (P3).'));
push(bullet('Interest keys must come from docs/schemas/interest-taxonomy.json, because that is the join to the product catalog.'));
push(bullet('Evidence excerpts are capped at 140 characters and never include private messages or location.'));

push(H('3.4 Example persona', HeadingLevel.HEADING_2));
const persona = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/schemas/examples/persona.example.json'), 'utf8'));
const compact = {
  persona_id: persona.persona_id,
  schema_version: persona.schema_version,
  consent: persona.consent,
  recipient_basics: persona.recipient_basics,
  interests: persona.interests.map((i) => ({
    key: i.key, weight: i.weight, strength: i.strength, sentiment: i.sentiment,
    giftability: i.giftability,
    evidence: i.evidence.map((e) => ({ source: e.source, signal_type: e.signal_type, count: e.count, observed_at: e.observed_at })),
  })),
  dislikes: persona.dislikes,
  style: persona.style,
  already_owns: persona.already_owns,
  provenance: persona.provenance,
};
push(...code(JSON.stringify(compact, null, 2).split('\n')));
push(new Paragraph({
  children: [t('Evidence excerpts and label translations are omitted above for space; the complete instance is docs/schemas/examples/persona.example.json.', { italics: true, size: 18, color: '64748B' })],
  spacing: { before: 100, after: 120 },
}));

// ---------------------------------------------------------------- 4. product schema
push(H('4. Product Schema', HeadingLevel.HEADING_1));
push(P('Full schema: docs/schemas/product.schema.json. Field names are identical to the CSV column names, so data/products_demo.csv is a flat serialisation of this schema; array fields are pipe-separated in the CSV.'));
push(table(
  ['Field group', 'Fields', 'Why it exists'],
  [
    ['Identity', 'product_id, name_en, name_ar, category, tags', 'Bilingual because the market is Jeddah and half the signals will be Arabic.'],
    ['Matching', 'interest_keys, style_tags', 'interest_keys is the join to Persona.interests[].key. This is the whole reason both schemas share one taxonomy.'],
    ['Money', 'price_sar, currency, budget_band', 'SAR throughout. budget_band mirrors the sender\'s budget selector so filtering is a direct comparison.'],
    ['Fit', 'age_min, age_max, occasions, relationship_fit', 'relationship_fit is a hard filter, not a score: a gift that suits a partner can be wrong for a colleague.'],
    ['Scores', 'giftability, embarrassment_risk, novelty', 'The P2 ideas made numeric so ranking can use them.'],
    ['Practical', 'is_experience, personalizable, requires_size, available_in_jeddah, delivery_days', 'requires_size is filtered out unless the sender says they know the size — a classic way to ruin a gift.'],
    ['Sourcing', 'retailer_hint, product_url, image_url', 'product_url is null in demo data. We never fabricate a link.'],
    ['Honesty', 'data_status, verified_at, notes', 'demo vs verified. Only verified rows may ever reach a real user.'],
  ],
  [1500, 3500, 4000],
));

push(H('4.1 Example product', HeadingLevel.HEADING_2));
push(...code(fs.readFileSync(path.join(ROOT, 'docs/schemas/examples/product.example.json'), 'utf8').trim().split('\n')));

// ---------------------------------------------------------------- 5. ranking
push(H('5. Filters and Ranking Specification', HeadingLevel.HEADING_1));
push(P('Hard filters run first and remove candidates entirely. Ranking then scores only what survived, so an unaffordable or undeliverable gift can never appear no matter how well it matches.'));
push(H('5.1 Hard filters', HeadingLevel.HEADING_2));
push(bullet('price_sar <= budget.max (and >= budget.min when the sender set one)'));
push(bullet('delivery_days <= days_until_occasion'));
push(bullet('age range of the product overlaps recipient_basics.age_range'));
push(bullet('relationship_fit contains the sender\'s relationship'));
push(bullet('no interest_key appears in persona.dislikes; no match against already_owns'));
push(bullet('requires_size is false, unless sender_constraints.knows_size is true'));
push(bullet('available_in_jeddah is true'));
push(bullet('embarrassment_risk <= the threshold for this relationship'));
push(table(
  ['Relationship', 'Max embarrassment risk', 'Relationship', 'Max embarrassment risk'],
  [
    ['colleague', '0.20', 'mother / father / sibling', '0.40'],
    ['classmate', '0.25', 'friend', '0.45'],
    ['relative', '0.30', 'best friend', '0.55'],
    ['', '', 'partner', '0.70'],
  ],
  [2300, 2200, 2300, 2200],
));
push(H('5.2 Ranking score', HeadingLevel.HEADING_2));
push(...code([
  'score = 0.40 * interest_match',
  '      + 0.20 * giftability',
  '      + 0.15 * budget_fit',
  '      + 0.10 * novelty',
  '      - 0.15 * embarrassment_risk',
  '',
  'interest_match = 0.6 * max(persona.weight for shared interest_keys)',
  '               + 0.4 * cosine(persona_text_embedding, product_embedding)',
  'giftability    = 0.5 * product.giftability + 0.5 * interest.giftability(top matched key)',
  'budget_fit     = clip(1 - |price - 0.75 * budget_max| / (0.75 * budget_max), 0, 1)',
  'novelty        = product.novelty',
]));
push(P('budget_fit peaks at roughly three quarters of the stated budget. A 40 SAR item against a 500 SAR budget reads as an afterthought, and an item at the exact ceiling leaves nothing for delivery.', { before: 120 }));
push(P('Diversity: at most 2 items from one category in the final list, so five results explore different directions instead of five versions of the same object.'));
push(P('Output: up to 5 recommendations — fewer if fewer survive the filters. We do not pad the list with weak matches.'));

// ---------------------------------------------------------------- 6. catalog
push(H('6. Product Catalog CSV', HeadingLevel.HEADING_1));
push(P(`File: data/products_demo.csv — ${N_PRODUCTS} items, ${N_COLS} columns, all prices in SAR. Built by scripts/build_demo_catalog.py and checked by scripts/validate_catalog.py, which validates every row against the product schema and rejects any interest key outside the taxonomy.`));

push(table(['Category', 'Items', 'Category', 'Items'], CAT_ROWS, [2600, 1900, 2600, 1900]));
push(P('Budget band coverage — every band has candidates, so the filter never empties for a plausible budget:', { before: 140 }));
push(table(
  ['Under 100', '100–250', '250–500', '500–1,000', '1,000+'],
  [['under_100', '100_250', '250_500', '500_1000', '1000_plus'].map((b) => `${BY_BAND[b] || 0} items`)],
  [1800, 1800, 1800, 1800, 1800],
));
push(P(`All ${N_KEYS} interest keys in the taxonomy have at least one matching product, so no persona can be built that the catalog cannot answer at all.`, { before: 120 }));

push(new Paragraph({
  children: [
    t('Data status — read this before using the catalog. ', { bold: true, color: '92400E' }),
    t('Every row is marked data_status = "demo". The item types, categories and SAR price bands are realistic for the Jeddah market, but no price has been quoted and no listing has been checked, so product_url is empty on every row and retailer_hint is a sourcing suggestion rather than a claim that the shop stocks that item at that price. This is enough to build and evaluate the pipeline on Days 4 and 5. Before any real user sees a recommendation, rows must be re-sourced against live listings and flipped to data_status = "verified" with a verified_at date; the validator already rejects a verified row that has no product_url.'),
  ],
  shading: { type: ShadingType.CLEAR, fill: 'FFFBEB' },
  spacing: { before: 160, after: 160 },
}));

// ---------------------------------------------------------------- 7. conclusion
push(H('7. Day 3 Conclusion', HeadingLevel.HEADING_1));
push(P('Architecture v2 keeps the Day 2 decision intact: the quiz is the primary source, consented signals are an enhancement, and nothing depends on access to another person\'s account. The two schemas now pin down the contract between layers — the Persona Builder must produce a persona that validates, and retrieval joins to products through one shared interest taxonomy — which is what lets Day 4 build the pipeline without renegotiating data shapes. The catalog is large enough and spread widely enough across budgets and interests to test whether the ranking is actually doing work, and honest enough about its demo status not to be mistaken for live retail data.'));
push(P('Ready for Day 4: signals → persona → retrieval → filters → ranking → explanations, run over five synthetic personas.'));
push(P('Open item: the Owner column in section 2.2 is unassigned. The team needs one name per layer before Day 4 starts.'));

// ---------------------------------------------------------------- 8. sources
push(H('8. Sources', HeadingLevel.HEADING_1));
push(bullet('P7. Wu, Zheng, Qiu, Wang, Gu, Shen, Qin, Zhu, Zhu, Liu, Xiong & Chen. A Survey on Large Language Models for Recommendation. arXiv:2305.19860; published in World Wide Web 27(5), 60 (2024). doi: 10.1007/s11280-024-01291-2'));
push(bullet('P1. Gift recommendation systems: a review. Electronic Commerce Research (2023). doi: 10.1007/s10660-023-09790-6 — gift context: giver, receiver, relationship, occasion.'));
push(bullet('P2. Pavlidis et al. Anatomy of a gift recommendation engine powered by social media. ACM SIGMOD \'12. doi: 10.1145/2213836.2213950 — giftability, sentiment, delight and embarrassment.'));
push(bullet('P3. Kosinski, Stillwell & Graepel. Private traits and attributes are predictable from digital records of human behavior. PNAS 110(15), 2013 — the basis for the blocked-attributes list.'));
push(bullet('P5. Boeschoten et al. A framework for privacy preserving digital trace data collection through data donation. Computational Communication Research 4(2), 2022 — the donation route used in layer 2.'));
push(bullet('GiftCompass Day 1 — Research Findings and Gap Analysis (gap list closed in section 2.1).'));
push(bullet('GiftCompass Day 2 — Data Sources, Consent and Privacy (primary/fallback decision and the five privacy rules enforced in layer 2 and the persona schema).'));
push(bullet('Saudi Personal Data Protection Law (PDPL, Royal Decree M/19) and SDAIA implementing regulations — consent, purpose limitation, storage limitation.'));

const doc = new Document({
  creator: 'GiftCompass Team',
  title: 'GiftCompass Day 3 — Architecture v2, Schemas and Product Catalog',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, color: '1E3A8A' } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, color: '334155' } },
    ],
  },
  sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children }],
});

const out = path.join(ROOT, 'docs/day3/GiftCompass_Day3_Architecture_Schemas_Catalog.docx');
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('wrote', out, buf.length, 'bytes'); });
