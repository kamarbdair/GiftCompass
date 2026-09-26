/** Day 4 CLI — run the full pipeline for one persona and print the result.
 *
 *  node scripts/recommend.ts --persona psn_layla
 *  node scripts/recommend.ts --persona psn_omar --relationship classmate \
 *       --occasion birthday --budget 250 --days 5 --json
 */
import fs from 'node:fs';
import path from 'node:path';
import { recommend } from '../src/lib/giftcompass/pipeline.ts';
import type { GiftContext, Persona } from '../src/lib/giftcompass/types.ts';

const argv = process.argv.slice(2);
const arg = (name: string, fallback?: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const flag = (name: string): boolean => argv.includes(`--${name}`);

const ROOT = process.cwd();
const id = arg('persona', 'psn_layla')!;
const baseline = flag('baseline');
const file = path.join(ROOT, 'data/personas', `${id}${baseline ? '.baseline' : ''}.json`);
if (!fs.existsSync(file)) {
  console.error(`no persona at ${file}. Run: node scripts/build-personas.ts`);
  process.exit(1);
}

const persona = JSON.parse(fs.readFileSync(file, 'utf8')) as Persona;
const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/signals', `${id}.json`), 'utf8'));
const dc = bundle.default_context ?? {};

const ctx: GiftContext = {
  request_id: `req_${id}${baseline ? '_baseline' : ''}`,
  persona_id: persona.persona_id,
  relationship: (arg('relationship', dc.relationship) ?? 'friend') as GiftContext['relationship'],
  occasion: (arg('occasion', dc.occasion) ?? 'birthday') as GiftContext['occasion'],
  budget_sar: { band: dc.band, max: Number(arg('budget', String(dc.max ?? 500))) },
  days_until_occasion: Number(arg('days', String(dc.days ?? 14))),
  delivery_city: 'Jeddah',
};

const result = await recommend(persona, ctx, { limit: Number(arg('limit', '5')) });

if (flag('json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const t = result.trace;
  console.log(`\n${bundle.recipient_label}${baseline ? '   [BASELINE: quiz only]' : ''}`);
  console.log(`${ctx.relationship} · ${ctx.occasion} · up to ${ctx.budget_sar.max} SAR · ${ctx.days_until_occasion} days`);
  console.log(`persona: ${persona.interests.map((i) => `${i.key}(${i.weight})`).join(' ')}`);
  const dis = (persona.dislikes ?? []).map((d) => d.key).join(', ');
  if (dis) console.log(`avoid:   ${dis}`);
  console.log(`\ncatalog ${t.catalog_size} -> retrieved ${t.retrieved} -> passed filters ${t.after_filters} -> shown ${t.returned}`);
  console.log(`dropped: ${Object.entries(t.filter_drops).map(([k, v]) => `${k} ${v}`).join(', ') || 'nothing'}\n`);

  if (result.recommendations.length === 0) {
    console.log('No suitable gift found within these constraints. Showing nothing beats showing a bad match.');
  }
  result.recommendations.forEach((r, n) => {
    console.log(`${n + 1}. ${r.product.name_en}  —  ${r.product.price_sar} SAR`);
    console.log(`   ${r.product.category} · ${r.product.retailer_hint} · score ${r.score.total}`);
    console.log(`   ${r.why}`);
    console.log('');
  });
}
