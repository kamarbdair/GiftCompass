/** Day 5 — turn the filled rating sheet into the evaluation table.
 *
 *  node scripts/score-evaluation.ts [--sheet data/evaluation/rating-sheet.csv]
 *
 *  Reads the blind sheet plus the key, joins each rated item back to the
 *  system that produced it, and reports relevance / delight / embarrassment
 *  for the full pipeline against the quiz-only baseline.
 *
 *  It computes nothing until the three raters have filled the sheet in. There
 *  is no default, no simulated rater and no placeholder score: an unrated item
 *  is reported as unrated.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const argOf = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').trim().split('\n');
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = ''; let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { cur += '"'; i += 1; } else quoted = !quoted;
      } else if (ch === ',' && !quoted) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const head = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

// path.resolve so an absolute --sheet works as well as a repo-relative one.
const sheetPath = path.resolve(ROOT, argOf('sheet', 'data/evaluation/rating-sheet.csv'));
const keyPath = path.resolve(ROOT, argOf('key', 'data/evaluation/rating-key.csv'));
for (const f of [sheetPath, keyPath]) {
  if (!fs.existsSync(f)) { console.error(`missing ${f}. Run: node scripts/run-evaluation.ts`); process.exit(1); }
}

const sheet = parseCsv(fs.readFileSync(sheetPath, 'utf8'));
const key = parseCsv(fs.readFileSync(keyPath, 'utf8'));

/** item_code -> the systems it appeared in (an item can be produced by both). */
const systemsOf = new Map<string, Set<string>>();
for (const k of key) {
  const set = systemsOf.get(k.item_code) ?? new Set<string>();
  set.add(k.system);
  systemsOf.set(k.item_code, set);
}

const RATERS = ['r1', 'r2', 'r3'] as const;
const yes = (v: string): boolean | null => {
  const s = v.toLowerCase();
  if (['y', 'yes', '1', 'true'].includes(s)) return true;
  if (['n', 'no', '0', 'false'].includes(s)) return false;
  return null;
};

interface Rating { relevance: number; delightful: boolean; embarrassing: boolean; }

const problems: string[] = [];
const ratingsByItem = new Map<string, Rating[]>();
let rated = 0;

for (const row of sheet) {
  const list: Rating[] = [];
  for (const r of RATERS) {
    const rel = row[`${r}_relevance_0_2`];
    const del = row[`${r}_delightful_y_n`];
    const emb = row[`${r}_embarrassing_y_n`];
    if (!rel && !del && !emb) continue;                 // this rater has not filled it in
    const relevance = Number(rel);
    if (!Number.isInteger(relevance) || relevance < 0 || relevance > 2) {
      problems.push(`${row.item_code} ${r}: relevance "${rel}" is not 0, 1 or 2`); continue;
    }
    const d = yes(del); const e = yes(emb);
    if (d === null || e === null) {
      problems.push(`${row.item_code} ${r}: delightful/embarrassing must be y or n`); continue;
    }
    list.push({ relevance, delightful: d, embarrassing: e });
  }
  if (list.length) { ratingsByItem.set(row.item_code, list); rated += 1; }
}

const total = sheet.length;
console.log(`rating sheet: ${sheet.length} items, ${rated} with at least one rating\n`);

if (problems.length) {
  console.log('problems found:');
  for (const p of problems) console.log(`  ${p}`);
  console.log('');
}

if (rated === 0) {
  console.log('No ratings yet, so there is nothing to score.');
  console.log('');
  console.log('To run the evaluation:');
  console.log('  1. Open data/evaluation/rating-sheet.csv.');
  console.log('  2. Three teammates each fill their own columns, independently, without');
  console.log('     discussing: r1_*, r2_*, r3_*.');
  console.log('        relevance    0 = wrong for this person, 1 = plausible, 2 = clearly right');
  console.log('        delightful   y if it would be a pleasant surprise');
  console.log('        embarrassing y if it would be awkward for this relationship');
  console.log('  3. Re-run this script.');
  console.log('');
  console.log('The sheet is blind: it does not say which system produced an item, so a');
  console.log('rater cannot favour the full pipeline. rating-key.csv holds the mapping.');
  process.exit(0);
}

// ------------------------------------------------------------ aggregate
interface Agg { relevance: number[]; delight: number; embarrass: number; n: number; }
const bySystem = new Map<string, Agg>();
const byPersonaSystem = new Map<string, Agg>();

const add = (map: Map<string, Agg>, k: string, r: Rating) => {
  const a = map.get(k) ?? { relevance: [], delight: 0, embarrass: 0, n: 0 };
  a.relevance.push(r.relevance);
  if (r.delightful) a.delight += 1;
  if (r.embarrassing) a.embarrass += 1;
  a.n += 1;
  map.set(k, a);
};

for (const row of sheet) {
  const ratings = ratingsByItem.get(row.item_code);
  if (!ratings) continue;
  for (const system of systemsOf.get(row.item_code) ?? []) {
    for (const r of ratings) {
      add(bySystem, system, r);
      add(byPersonaSystem, `${row.persona_id}|${system}`, r);
    }
  }
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (n: number, d: number): string => `${Math.round((n / d) * 100)}%`;
const f2 = (n: number): string => n.toFixed(2);

console.log('Per persona');
console.log('persona        system     ratings  relevance  delightful  embarrassing');
const rows: string[][] = [];
for (const [k, a] of [...byPersonaSystem.entries()].sort()) {
  const [persona, system] = k.split('|');
  console.log(
    `${persona.padEnd(14)} ${system.padEnd(10)} ${String(a.n).padStart(7)}  `
    + `${f2(mean(a.relevance)).padStart(9)}  ${pct(a.delight, a.n).padStart(10)}  ${pct(a.embarrass, a.n).padStart(12)}`,
  );
  rows.push([persona, system, String(a.n), f2(mean(a.relevance)), pct(a.delight, a.n), pct(a.embarrass, a.n)]);
}

console.log('\nOverall');
console.log('system     ratings  relevance  delightful  embarrassing');
for (const system of ['full', 'baseline']) {
  const a = bySystem.get(system);
  if (!a) { console.log(`${system.padEnd(10)} no ratings`); continue; }
  console.log(
    `${system.padEnd(10)} ${String(a.n).padStart(7)}  ${f2(mean(a.relevance)).padStart(9)}  `
    + `${pct(a.delight, a.n).padStart(10)}  ${pct(a.embarrass, a.n).padStart(12)}`,
  );
}

const full = bySystem.get('full');
const base = bySystem.get('baseline');
if (full && base) {
  const delta = mean(full.relevance) - mean(base.relevance);
  console.log(`\nfull - baseline relevance: ${delta >= 0 ? '+' : ''}${f2(delta)}`);
  console.log(delta > 0.1
    ? 'The donated signals improved relevance in this sample.'
    : delta < -0.1
      ? 'The donated signals made relevance worse in this sample.'
      : 'No meaningful difference in this sample: the quiz baseline is doing most of the work.');
  console.log('Five personas and three raters is a small sample. Report it as an indication, not a result.');
}

const outRows = [['persona_id', 'system', 'ratings', 'mean_relevance', 'delightful_rate', 'embarrassing_rate'], ...rows];
// Results land beside the sheet that produced them, so scoring a scratch
// sheet never overwrites the real results file.
const out = path.join(path.dirname(sheetPath), 'results.csv');
fs.writeFileSync(out, `${outRows.map((r) => r.join(',')).join('\n')}\n`);
console.log(`\nwrote ${path.relative(ROOT, out)}  (${rated}/${total} items rated)`);
