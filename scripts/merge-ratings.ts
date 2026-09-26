/** Merge the three raters' exports into data/evaluation/rating-sheet.csv.
 *
 *  Each rater rates in the rating station, presses Copy, and pastes the result
 *  into data/evaluation/ratings/r1.csv (or r2.csv / r3.csv). Then:
 *
 *      node scripts/merge-ratings.ts
 *      npm run score
 *
 *  It only ever writes cells that a rater actually filled in. Missing items are
 *  reported and left empty — nothing is inferred, averaged or filled for you.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SHEET = path.join(ROOT, 'data/evaluation/rating-sheet.csv');
const RATINGS = path.join(ROOT, 'data/evaluation/ratings');

const splitLine = (line: string): string[] => {
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
const csvCell = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

if (!fs.existsSync(SHEET)) {
  console.error(`missing ${path.relative(ROOT, SHEET)} — run: npm run evaluate`);
  process.exit(1);
}

const lines = fs.readFileSync(SHEET, 'utf8').replace(/\r\n/g, '\n').trim().split('\n');
const header = splitLine(lines[0]);
const rows = lines.slice(1).map(splitLine);
const codeCol = header.indexOf('item_code');
const rowByCode = new Map(rows.map((r) => [r[codeCol], r]));

const problems: string[] = [];
let merged = 0;
let found = 0;

for (const n of [1, 2, 3]) {
  const file = path.join(RATINGS, `r${n}.csv`);
  if (!fs.existsSync(file)) {
    console.log(`r${n}.csv  not present yet`);
    continue;
  }
  found += 1;

  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
  if (!text) { console.log(`r${n}.csv  empty`); continue; }

  const rl = text.split('\n').map(splitLine);
  const head = rl[0].map((h) => h.trim());
  const iCode = head.indexOf('item_code');
  const iRel = head.indexOf(`r${n}_relevance_0_2`);
  const iDel = head.indexOf(`r${n}_delightful_y_n`);
  const iEmb = head.indexOf(`r${n}_embarrassing_y_n`);

  if (iCode < 0 || iRel < 0 || iDel < 0 || iEmb < 0) {
    problems.push(`r${n}.csv: header does not look like rater ${n}'s export — expected item_code plus r${n}_* columns, got: ${head.join(', ')}`);
    continue;
  }

  let count = 0;
  for (const rec of rl.slice(1)) {
    const code = (rec[iCode] || '').trim();
    if (!code) continue;
    const target = rowByCode.get(code);
    if (!target) { problems.push(`r${n}.csv: unknown item_code "${code}"`); continue; }

    const rel = (rec[iRel] || '').trim();
    const del = (rec[iDel] || '').trim().toLowerCase();
    const emb = (rec[iEmb] || '').trim().toLowerCase();
    if (!['0', '1', '2'].includes(rel)) { problems.push(`r${n}.csv ${code}: relevance "${rel}" is not 0, 1 or 2`); continue; }
    if (!['y', 'n'].includes(del) || !['y', 'n'].includes(emb)) {
      problems.push(`r${n}.csv ${code}: delightful/embarrassing must be y or n`); continue;
    }

    target[header.indexOf(`r${n}_relevance_0_2`)] = rel;
    target[header.indexOf(`r${n}_delightful_y_n`)] = del;
    target[header.indexOf(`r${n}_embarrassing_y_n`)] = emb;
    count += 1;
    merged += 1;
  }
  const missing = rows.length - count;
  console.log(`r${n}.csv  ${count} of ${rows.length} items${missing ? `  (${missing} left blank)` : ''}`);
}

if (found === 0) {
  console.log(`\nNothing to merge. Each rater pastes their export into ${path.relative(ROOT, RATINGS)}/r1.csv, r2.csv or r3.csv.`);
  process.exit(0);
}

if (problems.length) {
  console.log('\nproblems (these cells were not written):');
  for (const p of problems) console.log(`  ${p}`);
}

fs.writeFileSync(SHEET, `${[header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')}\n`);
console.log(`\nwrote ${merged} ratings into ${path.relative(ROOT, SHEET)} from ${found} rater file(s).`);
console.log('Next: npm run score');
