/** Day 5 — run every test persona through both systems and produce the
 *  evaluation materials.
 *
 *  node scripts/run-evaluation.ts
 *
 *  Writes to data/evaluation/:
 *    recommendations.json    every result, both systems, with score breakdowns
 *    objective-metrics.csv   the metrics that need no human judgement
 *    rating-sheet.csv        BLIND sheet for 3 raters to fill in
 *    rating-key.csv          maps each item code back to its system
 *
 *  The two systems compared are:
 *    full      persona built from quiz + donated signals
 *    baseline  persona built from the sender's quiz answers only
 */
import fs from 'node:fs';
import path from 'node:path';
import { recommend } from '../src/lib/giftcompass/pipeline.ts';
import { createRanker } from '../src/lib/giftcompass/ranking.ts';
import { loadCatalog } from '../src/lib/giftcompass/data.ts';
import type { GiftContext, Persona, PipelineResult } from '../src/lib/giftcompass/types.ts';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data/evaluation');
fs.mkdirSync(OUT, { recursive: true });

const catalog = loadCatalog();
const ranker = createRanker(catalog);

/** Deterministic PRNG so the blind sheet is identical on every run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const csvCell = (v: unknown): string => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (cells: unknown[]): string => cells.map(csvCell).join(',');

interface Run {
  persona_id: string;
  recipient_label: string;
  system: 'full' | 'baseline';
  persona: Persona;
  context: GiftContext;
  result: PipelineResult;
}

const bundles = fs.readdirSync(path.join(ROOT, 'data/signals'))
  .filter((f) => f.endsWith('.json')).sort();

const runs: Run[] = [];

for (const file of bundles) {
  const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/signals', file), 'utf8'));
  const dc = bundle.default_context;
  const ctx: GiftContext = {
    request_id: `eval_${bundle.persona_id}`,
    persona_id: bundle.persona_id,
    relationship: dc.relationship,
    occasion: dc.occasion,
    budget_sar: { band: dc.band, max: dc.max },
    days_until_occasion: dc.days,
    delivery_city: 'Jeddah',
  };

  for (const system of ['full', 'baseline'] as const) {
    const pfile = `${bundle.persona_id}${system === 'baseline' ? '.baseline' : ''}.json`;
    const persona = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/personas', pfile), 'utf8')) as Persona;
    const result = await recommend(persona, ctx, { catalog, ranker, limit: 5 });
    runs.push({
      persona_id: bundle.persona_id,
      recipient_label: bundle.recipient_label,
      system,
      persona,
      context: ctx,
      result,
    });
  }
}

// ---------------------------------------------------------------- raw output
fs.writeFileSync(path.join(OUT, 'recommendations.json'), `${JSON.stringify(
  runs.map((r) => ({
    persona_id: r.persona_id,
    recipient_label: r.recipient_label,
    system: r.system,
    context: r.context,
    persona_interests: r.persona.interests.map((i) => ({ key: i.key, weight: i.weight, strength: i.strength })),
    dislikes: (r.persona.dislikes ?? []).map((d) => d.key),
    trace: r.result.trace,
    recommendations: r.result.recommendations.map((x, n) => ({
      rank: n + 1,
      product_id: x.product.product_id,
      name_en: x.product.name_en,
      price_sar: x.product.price_sar,
      category: x.product.category,
      data_status: x.product.data_status,
      score: x.score,
      why: x.why,
    })),
  })), null, 2)}\n`);

// ------------------------------------------------------- objective metrics
const metricRows: unknown[][] = [[
  'persona_id', 'system', 'returned', 'all_within_budget', 'mean_price_sar',
  'budget_utilisation', 'distinct_categories', 'top3_interest_coverage',
  'mean_novelty', 'mean_embarrassment', 'overlap_with_other_system',
]];

const byPersona = new Map<string, Run[]>();
for (const r of runs) byPersona.set(r.persona_id, [...(byPersona.get(r.persona_id) ?? []), r]);

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r2 = (n: number): number => Math.round(n * 100) / 100;

for (const [personaId, pair] of byPersona) {
  for (const run of pair) {
    const other = pair.find((p) => p.system !== run.system)!;
    const ids = new Set(run.result.recommendations.map((x) => x.product.product_id));
    const otherIds = new Set(other.result.recommendations.map((x) => x.product.product_id));
    const shared = [...ids].filter((id) => otherIds.has(id)).length;

    const prices = run.result.recommendations.map((x) => x.product.price_sar);
    const top3 = run.persona.interests.slice(0, 3).map((i) => i.key);
    const covered = top3.filter((k) => run.result.recommendations
      .some((x) => x.score.matched_keys.includes(k))).length;

    metricRows.push([
      personaId,
      run.system,
      run.result.recommendations.length,
      prices.every((p) => p <= run.context.budget_sar.max),
      r2(mean(prices)),
      r2(mean(prices) / run.context.budget_sar.max),
      new Set(run.result.recommendations.map((x) => x.product.category)).size,
      top3.length ? r2(covered / top3.length) : 0,
      r2(mean(run.result.recommendations.map((x) => x.product.novelty))),
      r2(mean(run.result.recommendations.map((x) => x.product.embarrassment_risk))),
      ids.size ? r2(shared / ids.size) : 0,
    ]);
  }
}
fs.writeFileSync(path.join(OUT, 'objective-metrics.csv'), `${metricRows.map(csvRow).join('\n')}\n`);

// ------------------------------------------------------------- blind sheet
const rand = mulberry32(20260926);
const sheet: unknown[][] = [[
  'persona_id', 'recipient', 'relationship', 'occasion', 'budget_sar', 'item_code',
  'product_name', 'price_sar', 'why_this_matches',
  'r1_relevance_0_2', 'r1_delightful_y_n', 'r1_embarrassing_y_n',
  'r2_relevance_0_2', 'r2_delightful_y_n', 'r2_embarrassing_y_n',
  'r3_relevance_0_2', 'r3_delightful_y_n', 'r3_embarrassing_y_n',
]];
const key: unknown[][] = [['item_code', 'persona_id', 'system', 'rank', 'product_id']];

for (const [personaId, pair] of byPersona) {
  // Pool both systems together and shuffle, so raters cannot tell which
  // system produced an item. Duplicates are rated once and counted for both.
  const pooled = pair.flatMap((run) => run.result.recommendations.map((x, n) => ({
    run, rank: n + 1, rec: x,
  })));
  const seen = new Map<string, string>();
  const shuffled = pooled
    .map((v) => ({ v, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.v);

  let n = 0;
  for (const item of shuffled) {
    const pid = item.rec.product.product_id;
    let code = seen.get(pid);
    if (!code) {
      n += 1;
      code = `${personaId.replace('psn_', '').toUpperCase().slice(0, 3)}-${String(n).padStart(2, '0')}`;
      seen.set(pid, code);
      sheet.push([
        personaId, item.run.recipient_label, item.run.context.relationship,
        item.run.context.occasion, item.run.context.budget_sar.max, code,
        item.rec.product.name_en, item.rec.product.price_sar, item.rec.why,
        '', '', '', '', '', '', '', '', '',
      ]);
    }
    key.push([code, personaId, item.run.system, item.rank, pid]);
  }
}
fs.writeFileSync(path.join(OUT, 'rating-sheet.csv'), `${sheet.map(csvRow).join('\n')}\n`);
fs.writeFileSync(path.join(OUT, 'rating-key.csv'), `${key.map(csvRow).join('\n')}\n`);

// ------------------------------------------------------------------ console
console.log(`runs: ${runs.length}  (${byPersona.size} personas x 2 systems)\n`);
console.log('persona       system    n  mean SAR  budget use  cats  top3 cover  overlap');
for (const row of metricRows.slice(1)) {
  const [p, s, n, , price, use, cats, cover, , , overlap] = row as (string | number)[];
  console.log(
    `${String(p).padEnd(13)} ${String(s).padEnd(9)} ${String(n)}  ${String(price).padStart(7)}`
    + `  ${String(use).padStart(9)}  ${String(cats).padStart(4)}  ${String(cover).padStart(10)}  ${String(overlap).padStart(7)}`,
  );
}
console.log(`\nwrote recommendations.json, objective-metrics.csv, rating-sheet.csv (${sheet.length - 1} items), rating-key.csv`);
console.log('rating-sheet.csv has EMPTY human columns. Ratings must come from the three teammates.');
