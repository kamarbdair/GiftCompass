/** Layer 5 — hard filters. These run BEFORE ranking, so an unaffordable,
 *  undeliverable or relationship-inappropriate gift can never be ranked at
 *  all, however well it matches the persona. */
import type { AgeRange, GiftContext, Persona, Product, Relationship } from './types.ts';

/** Max acceptable embarrassment_risk per relationship (Day 3, section 5.1). */
export const EMBARRASSMENT_THRESHOLD: Record<Relationship, number> = {
  colleague: 0.2,
  classmate: 0.25,
  relative: 0.3,
  mother: 0.4,
  father: 0.4,
  sister: 0.4,
  brother: 0.4,
  friend: 0.45,
  best_friend: 0.55,
  partner: 0.7,
  other: 0.3,
};

const AGE_BOUNDS: Record<AgeRange, [number, number]> = {
  under_12: [0, 11],
  '12_17': [12, 17],
  '18_24': [18, 24],
  '25_34': [25, 34],
  '35_44': [35, 44],
  '45_54': [45, 54],
  '55_plus': [55, 120],
  unknown: [0, 120],
};

export type FilterReason =
  | 'over_budget' | 'under_budget_floor' | 'too_slow_to_deliver' | 'age_mismatch'
  | 'relationship_mismatch' | 'disliked' | 'already_owns' | 'needs_size'
  | 'not_available' | 'too_embarrassing' | 'excluded_category' | 'experience_not_wanted'
  | 'unverified_data';

export interface FilterOutcome {
  kept: Product[];
  drops: Record<string, number>;
}

/** Returns the reason this product is disqualified, or null if it survives. */
export function rejectReason(
  product: Product,
  persona: Persona,
  ctx: GiftContext,
  opts: { requireVerified?: boolean } = {},
): FilterReason | null {
  const budget = ctx.budget_sar;
  if (product.price_sar > budget.max) return 'over_budget';
  if (budget.min != null && product.price_sar < budget.min) return 'under_budget_floor';

  if (ctx.days_until_occasion != null && product.delivery_days > ctx.days_until_occasion) {
    return 'too_slow_to_deliver';
  }

  const [ageLo, ageHi] = AGE_BOUNDS[persona.recipient_basics?.age_range ?? 'unknown'];
  if (product.age_max < ageLo || product.age_min > ageHi) return 'age_mismatch';

  if (ctx.relationship !== 'other' && !product.relationship_fit.includes(ctx.relationship)) {
    return 'relationship_mismatch';
  }

  const disliked = new Set((persona.dislikes ?? []).map((d) => d.key));
  if (product.interest_keys.some((k) => disliked.has(k))) return 'disliked';

  const owned = (persona.already_owns ?? []).map((o) => o.label.toLowerCase());
  const name = product.name_en.toLowerCase();
  if (owned.some((label) => label.length > 3 && name.includes(label))) return 'already_owns';

  if (product.requires_size && !ctx.sender_constraints?.knows_size) return 'needs_size';
  if (!product.available_in_jeddah) return 'not_available';

  if (product.embarrassment_risk > EMBARRASSMENT_THRESHOLD[ctx.relationship]) {
    return 'too_embarrassing';
  }

  if (ctx.sender_constraints?.exclude_categories?.includes(product.category)) {
    return 'excluded_category';
  }
  if (product.is_experience && ctx.sender_constraints?.experiences_ok === false) {
    return 'experience_not_wanted';
  }

  // Production guard: only verified listings may ever reach a real user.
  if (opts.requireVerified && product.data_status !== 'verified') return 'unverified_data';

  return null;
}

export function applyFilters(
  products: Product[],
  persona: Persona,
  ctx: GiftContext,
  opts: { requireVerified?: boolean } = {},
): FilterOutcome {
  const kept: Product[] = [];
  const drops: Record<string, number> = {};
  for (const p of products) {
    const reason = rejectReason(p, persona, ctx, opts);
    if (reason) drops[reason] = (drops[reason] ?? 0) + 1;
    else kept.push(p);
  }
  return { kept, drops };
}
