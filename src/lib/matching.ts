import { ARCHETYPES, BUDGETS, PRODUCTS, QUESTIONS } from "./data";
import type {
  ArchetypeId,
  BudgetId,
  PrefKey,
  Product,
  RefineMode,
} from "./types";

export function formatSar(price: number) {
  return `SAR ${price.toLocaleString("en-US")}`;
}

export function getBudget(id: BudgetId) {
  return BUDGETS.find((b) => b.id === id) ?? BUDGETS[1];
}

/**
 * Turns questionnaire answers into an archetype plus a set of gift preferences.
 * Answers genuinely drive the result: each option carries archetype weights.
 */
export function resolveFromAnswers(answers: Record<string, string>): {
  archetype: ArchetypeId;
  prefs: PrefKey[];
} {
  const scores: Record<string, number> = {};
  const prefs = new Set<PrefKey>();

  for (const question of QUESTIONS) {
    const chosen = question.options.find((o) => o.id === answers[question.id]);
    if (!chosen) continue;

    for (const [archetype, weight] of Object.entries(chosen.scores ?? {})) {
      scores[archetype] = (scores[archetype] ?? 0) + (weight ?? 0);
    }
    for (const pref of chosen.prefs ?? []) {
      prefs.add(pref);
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const archetype = (ranked[0]?.[0] ?? "cozy-creative") as ArchetypeId;

  return { archetype, prefs: Array.from(prefs) };
}

/**
 * The budget the giver picked is a hard limit, not a preference. A gift is
 * either inside the range they chose or it is not shown at all — we never
 * reach into a neighbouring band to fill out a page of results.
 */
export function isWithinBudget(price: number, budgetId: BudgetId): boolean {
  switch (budgetId) {
    case "under-100":
      return price < 100;
    case "100-250":
      return price >= 100 && price <= 250;
    case "250-500":
      return price >= 250 && price <= 500;
    case "500-1000":
      return price >= 500 && price <= 1000;
    case "1000-plus":
      return price >= 1000;
  }
}

/**
 * Whether a product is genuinely worth showing this recipient: either it was
 * made for their vibe, or it shares at least two of their interest tags.
 * Anything weaker is filler, and we would rather show three gifts than four.
 */
function isRelevant(product: Product, archetype: ArchetypeId) {
  if (product.archetype === archetype) return true;
  const vibe = ARCHETYPES[archetype];
  return product.tags.filter((t) => vibe.tags.includes(t)).length >= 2;
}

/**
 * Gifts that satisfy BOTH conditions: they suit this recipient, and they sit
 * inside the budget that was chosen. Nothing else is a candidate — if that
 * leaves one gift, or none, the results page says so rather than padding.
 */
function candidatePool(archetype: ArchetypeId, budgetId: BudgetId): Product[] {
  return PRODUCTS.filter(
    (p) => isRelevant(p, archetype) && isWithinBudget(p.price, budgetId),
  );
}

/**
 * Ranks gifts that are already inside the budget, so price plays no part here.
 */
function scoreProduct(
  product: Product,
  archetype: ArchetypeId,
  prefs: PrefKey[],
) {
  const vibe = ARCHETYPES[archetype];
  let score = 0;

  // Vibe match dominates, so results always read as personal to the recipient.
  if (product.archetype === archetype) score += 40;

  // Then how many of their vibe tags this product actually shares.
  score += product.tags.filter((t) => vibe.tags.includes(t)).length * 6;

  // Gift preferences picked up from the questionnaire.
  score += product.prefs.filter((p) => prefs.includes(p)).length * 5;

  return score;
}

/**
 * How many gifts genuinely match this recipient and budget. Used to hide
 * "Show more" when there is nothing further worth showing.
 */
export function relevantCount(archetype: ArchetypeId, budget: BudgetId) {
  return candidatePool(archetype, budget).length;
}

export function recommend(options: {
  archetype: ArchetypeId;
  budget: BudgetId;
  prefs: PrefKey[];
  mode: RefineMode;
  page: number;
  count?: number;
}): Product[] {
  const { archetype, budget, prefs, mode, page, count = 4 } = options;

  const pool = candidatePool(archetype, budget);

  const ranked = pool
    .map((product) => ({
      product,
      score: scoreProduct(product, archetype, prefs),
    }))
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  let ordered = ranked.map((r) => r.product);

  if (mode !== "default") {
    // Refine within the vibe-relevant shortlist, so "cheaper" never drifts into
    // gifts that have nothing to do with the recipient. The rest of the pool
    // stays behind it, which keeps "Show more" working.
    const shortlist = ordered.slice(0, count * 3);
    const rest = ordered.slice(count * 3);

    const sorted =
      mode === "cheaper"
        ? [...shortlist].sort((a, b) => a.price - b.price)
        : [...shortlist].sort(
            (a, b) =>
              Number(b.prefs.includes(mode)) - Number(a.prefs.includes(mode)),
          );

    ordered = [...sorted, ...rest];
  }

  if (ordered.length === 0) return [];

  // "Show more" cycles a short, best-matching slice rather than paging deep into
  // the catalogue. Any vibe only has a handful of gifts inside a given budget,
  // so going deeper would start showing things the recipient has no interest in.
  const carousel = ordered.slice(0, count * 2);
  const start = (page * count) % carousel.length;
  const rotated = [...carousel.slice(start), ...carousel.slice(0, start)];

  return rotated.slice(0, count);
}
