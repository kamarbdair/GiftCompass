/** Loads the taxonomy and the product catalog from disk.
 *  Server-side only (uses fs), which is where the pipeline runs. */
import fs from 'node:fs';
import path from 'node:path';
import type { Product } from './types.ts';

export interface TaxonomyEntry {
  key: string;
  label_en: string;
  label_ar: string;
  domain: string;
  default_giftability: number;
  match_terms: string[];
}

export interface Taxonomy {
  version: string;
  interests: TaxonomyEntry[];
  style_tags: string[];
  blocked_attributes: string[];
}

let taxonomyCache: Taxonomy | null = null;

export function loadTaxonomy(): Taxonomy {
  if (!taxonomyCache) {
    taxonomyCache = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'docs/schemas', 'interest-taxonomy.json'), 'utf8'),
    ) as Taxonomy;
  }
  return taxonomyCache;
}

export function taxonomyIndex(): Map<string, TaxonomyEntry> {
  return new Map(loadTaxonomy().interests.map((i) => [i.key, i]));
}

/** Minimal RFC4180-ish CSV reader. The catalog has no embedded newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').trim().split('\n');
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let quoted = false;
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
  return lines.slice(1).map((line) => {
    const cells = split(line);
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ''])) as Record<string, string>;
  });
}

const list = (v: string): string[] => (v ? v.split('|').filter(Boolean) : []);
const bool = (v: string): boolean => v === 'true';

let catalogCache: Product[] | null = null;

/** `file` is a basename inside data/ so the path stays statically scoped —
 *  an open-ended path makes the bundler trace the whole project. */
export function loadCatalog(file = 'products_demo.csv'): Product[] {
  if (catalogCache) return catalogCache;
  const rows = parseCsv(fs.readFileSync(path.join(process.cwd(), 'data', file), 'utf8'));
  catalogCache = rows.map((r) => ({
    product_id: r.product_id,
    name_en: r.name_en,
    name_ar: r.name_ar,
    category: r.category,
    tags: list(r.tags),
    interest_keys: list(r.interest_keys),
    style_tags: list(r.style_tags),
    price_sar: Number(r.price_sar),
    currency: r.currency,
    budget_band: r.budget_band as Product['budget_band'],
    age_min: Number(r.age_min),
    age_max: Number(r.age_max),
    occasions: list(r.occasions),
    relationship_fit: list(r.relationship_fit),
    giftability: Number(r.giftability),
    embarrassment_risk: Number(r.embarrassment_risk),
    novelty: Number(r.novelty),
    is_experience: bool(r.is_experience),
    personalizable: bool(r.personalizable),
    requires_size: bool(r.requires_size),
    available_in_jeddah: bool(r.available_in_jeddah),
    delivery_days: Number(r.delivery_days),
    retailer_hint: r.retailer_hint,
    product_url: r.product_url || null,
    image_url: r.image_url || null,
    data_status: (r.data_status as Product['data_status']) || 'demo',
    verified_at: r.verified_at || null,
    notes: r.notes || null,
  }));
  return catalogCache;
}
