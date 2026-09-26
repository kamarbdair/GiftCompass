/** Layers 4, 6 and 7 — retrieval, scoring, diversity and explanations. */
import type {
  GiftContext, Persona, Product, Recommendation, ScoreBreakdown,
} from './types.ts';
import { cosine, createTfidfEncoder, type Encoder } from './encoder.ts';

export const WEIGHTS = {
  interest_match: 0.4,
  giftability: 0.2,
  budget_fit: 0.15,
  novelty: 0.1,
  embarrassment: 0.15,
} as const;

/** Budget sweet spot: a gift at ~75% of the stated budget reads as considered.
 *  Far below looks like an afterthought; at the ceiling leaves nothing for delivery. */
export function budgetFit(price: number, budgetMax: number): number {
  if (budgetMax <= 0) return 0;
  const target = 0.75 * budgetMax;
  return Math.max(0, Math.min(1, 1 - Math.abs(price - target) / target));
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export function productDocument(p: Product): string {
  return [p.name_en, p.name_ar, p.category, ...p.tags, ...p.interest_keys, ...p.style_tags].join(' ');
}

/** The persona rendered as a query document: interest labels repeated in
 *  proportion to their weight, so a strong interest dominates the vector. */
export function personaDocument(persona: Persona): string {
  const parts: string[] = [];
  for (const i of persona.interests) {
    const repeats = Math.max(1, Math.round(i.weight * 10));
    for (let n = 0; n < repeats; n += 1) parts.push(i.key, i.label_en, i.label_ar);
  }
  parts.push(...(persona.style?.aesthetics ?? []));
  return parts.join(' ');
}

export interface Ranker {
  encoder: Encoder;
  catalogVectors: Map<string, Map<string, number>>;
}

export function createRanker(catalog: Product[]): Ranker {
  const encoder = createTfidfEncoder();
  encoder.fit(catalog.map(productDocument));
  const catalogVectors = new Map(catalog.map((p) => [p.product_id, encoder.encode(productDocument(p))]));
  return { encoder, catalogVectors };
}

export function scoreProduct(
  product: Product,
  persona: Persona,
  ctx: GiftContext,
  ranker: Ranker,
  personaVector: Map<string, number>,
): ScoreBreakdown {
  const byKey = new Map(persona.interests.map((i) => [i.key, i]));
  const matched = product.interest_keys.filter((k) => byKey.has(k));

  let topKey: string | null = null;
  let maxWeight = 0;
  for (const k of matched) {
    const w = byKey.get(k)!.weight;
    if (w > maxWeight) { maxWeight = w; topKey = k; }
  }
  // Prefer the product's own primary key when it is nearly as strong, so a
  // coffee dallah is explained as coffee rather than as home decor.
  const primary = product.interest_keys[0];
  if (topKey && primary !== topKey && matched.includes(primary)) {
    if (maxWeight - byKey.get(primary)!.weight <= 0.15) topKey = primary;
  }

  const cos = cosine(personaVector, ranker.catalogVectors.get(product.product_id) ?? new Map());
  const interestMatch = clamp01(0.6 * maxWeight + 0.4 * cos);

  const interestGiftability = topKey ? byKey.get(topKey)!.giftability : 0.5;
  const giftability = 0.5 * product.giftability + 0.5 * interestGiftability;

  const fit = budgetFit(product.price_sar, ctx.budget_sar.max);

  const total =
    WEIGHTS.interest_match * interestMatch +
    WEIGHTS.giftability * giftability +
    WEIGHTS.budget_fit * fit +
    WEIGHTS.novelty * product.novelty -
    WEIGHTS.embarrassment * product.embarrassment_risk;

  return {
    interest_match: round(interestMatch),
    giftability: round(giftability),
    budget_fit: round(fit),
    novelty: product.novelty,
    embarrassment_risk: product.embarrassment_risk,
    total: round(total),
    matched_keys: matched,
    top_key: topKey,
    cosine: round(cos),
  };
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

/** Retrieval: cosine top-N over the whole catalog before any filtering. */
export function retrieve(
  catalog: Product[],
  persona: Persona,
  ranker: Ranker,
  topN = 50,
): { products: Product[]; personaVector: Map<string, number> } {
  const personaVector = ranker.encoder.encode(personaDocument(persona));
  const keys = new Set(persona.interests.map((i) => i.key));
  const scored = catalog.map((p) => {
    const cos = cosine(personaVector, ranker.catalogVectors.get(p.product_id) ?? new Map());
    // A shared taxonomy key is a stronger signal than lexical overlap alone.
    const keyBonus = p.interest_keys.some((k) => keys.has(k)) ? 0.5 : 0;
    return { p, s: cos + keyBonus };
  });
  scored.sort((a, b) => b.s - a.s);
  return { products: scored.slice(0, topN).filter((x) => x.s > 0).map((x) => x.p), personaVector };
}

/** Relevance gate. A product earns a slot only if it is primarily about
 *  something the recipient likes, or it connects to something they like a lot.
 *
 *  Without this, a thin candidate pool lets an item ride in on giftability and
 *  budget fit alone: a pet water fountain reached a football-mad teenager's
 *  list because it happens to carry the `technology` tag. Returning four good
 *  gifts beats returning five where one is noise.
 */
export function isRelevant(score: ScoreBreakdown, product: Product, persona: Persona): boolean {
  if (score.matched_keys.length === 0) return false;
  if (score.matched_keys.includes(product.interest_keys[0])) return true;
  const byKey = new Map(persona.interests.map((i) => [i.key, i]));
  return score.matched_keys.some((k) => (byKey.get(k)?.weight ?? 0) >= 0.66);
}

/** Interest coverage: the two strongest interests each deserve a slot when a
 *  qualifying candidate exists. Without this the budget_fit term can crowd out
 *  a whole interest — a recipient who loves books gets no book, because books
 *  are cheap and cheap items score lower against a large budget. */
export function coverStrongInterests(
  ranked: { product: Product; score: ScoreBreakdown }[],
  chosen: { product: Product; score: ScoreBreakdown }[],
  persona: Persona,
  perCategory: number,
): { product: Product; score: ScoreBreakdown }[] {
  const out = [...chosen];
  const mustCover = persona.interests.slice(0, 2).map((i) => i.key);

  for (const key of mustCover) {
    if (out.some((c) => c.score.matched_keys.includes(key))) continue;

    const candidate = ranked.find(
      (r) => !out.includes(r) && r.score.matched_keys.includes(key),
    );
    if (!candidate) continue;

    const catCount = out.filter((c) => c.product.category === candidate.product.category).length;
    if (catCount >= perCategory) continue;

    // Drop the weakest item that is not the sole cover for the other key,
    // preferring one whose category is already represented twice.
    const others = mustCover.filter((k) => k !== key);
    const soleCover = (i: number): boolean => others.some((k) => {
      const covers = out.filter((c) => c.score.matched_keys.includes(k));
      return covers.length === 1 && covers[0] === out[i];
    });

    let victim = -1;
    for (let i = out.length - 1; i >= 0; i -= 1) {
      if (soleCover(i)) continue;
      const dup = out.filter((c) => c.product.category === out[i].product.category).length > 1;
      if (dup) { victim = i; break; }
      if (victim === -1) victim = i;
    }
    if (victim === -1) continue;

    out.splice(victim, 1, candidate);
    out.sort((a, b) => b.score.total - a.score.total);
  }
  return out;
}

/** At most `perCategory` items from one category, so the list explores
 *  different directions instead of five versions of the same object. */
export function diversify(
  ranked: { product: Product; score: ScoreBreakdown }[],
  limit: number,
  perCategory = 2,
): { product: Product; score: ScoreBreakdown }[] {
  const out: { product: Product; score: ScoreBreakdown }[] = [];
  const used = new Map<string, number>();
  for (const item of ranked) {
    if (out.length >= limit) break;
    const n = used.get(item.product.category) ?? 0;
    if (n >= perCategory) continue;
    used.set(item.product.category, n + 1);
    out.push(item);
  }
  return out;
}

const OCCASION_LABEL: Record<string, string> = {
  birthday: 'birthday', graduation: 'graduation', anniversary: 'anniversary',
  wedding: 'wedding', achievement: 'achievement', thank_you: 'thank-you',
  just_because: 'just-because', eid: 'Eid', new_job: 'new job', get_well: 'get-well',
  other: 'occasion',
};

/** Layer 7 — a short, friendly reason, built from the evidence that actually
 *  drove the match. No scores or confidence percentages are shown to the user. */
export function explain(
  product: Product,
  score: ScoreBreakdown,
  persona: Persona,
  ctx: GiftContext,
): string {
  const interest = persona.interests.find((i) => i.key === score.top_key);
  const parts: string[] = [];

  if (interest) {
    const evidenceCount = interest.evidence.reduce((n, e) => n + e.count, 0);
    const how = interest.strength === 'strong'
      ? `a strong interest in ${interest.label_en.toLowerCase()}`
      : `an interest in ${interest.label_en.toLowerCase()}`;
    parts.push(`They show ${how} (${evidenceCount} signal${evidenceCount === 1 ? '' : 's'}).`);
  } else {
    parts.push('This fits the general style in their profile.');
  }

  const second = score.matched_keys.find((k) => k !== score.top_key);
  if (second) {
    const i2 = persona.interests.find((i) => i.key === second);
    if (i2) parts.push(`It also touches ${i2.label_en.toLowerCase()}.`);
  }

  if (product.personalizable) parts.push('It can be personalised, which suits a keepsake gift.');
  if (product.is_experience) parts.push('It is an experience rather than an object.');

  const occasion = OCCASION_LABEL[ctx.occasion] ?? ctx.occasion;
  const max = ctx.budget_sar.max;
  parts.push(product.price_sar <= 0.5 * max
    ? `At ${product.price_sar} SAR it comes in well under your ${occasion} budget of up to ${max} SAR.`
    : `At ${product.price_sar} SAR it fits your ${occasion} budget of up to ${max} SAR.`);

  return parts.join(' ');
}

export function toRecommendation(
  item: { product: Product; score: ScoreBreakdown },
  persona: Persona,
  ctx: GiftContext,
): Recommendation {
  return { ...item, why: explain(item.product, item.score, persona, ctx) };
}
