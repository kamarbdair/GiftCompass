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

function bandIndexForPrice(price: number) {
  const index = BUDGETS.findIndex((b) => price >= b.min && price <= b.max);
  return index === -1 ? BUDGETS.length - 1 : index;
}

/**
 * How many budget bands away a product sits from the chosen band.
 * 0 means it is squarely inside the budget the giver picked.
 */
function bandDistance(price: number, budgetId: BudgetId) {
  const selected = BUDGETS.findIndex((b) => b.id === budgetId);
  return Math.abs(bandIndexForPrice(price) - (selected === -1 ? 1 : selected));
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
 * Relevant gifts near the chosen budget. Widens the price neighbourhood only if
 * nothing relevant sits close by; it never relaxes the relevance rule.
 */
function candidatePool(archetype: ArchetypeId, budgetId: BudgetId): Product[] {
  const relevant = PRODUCTS.filter((p) => isRelevant(p, archetype));

  // Look one budget band either side first. If that leaves too little to choose
  // from, reach further out — but only ever across gifts that already suit this
  // recipient, so widening never means showing something irrelevant. Scoring
  // still ranks in-budget gifts above the ones reached for.
  const target = Math.min(3, relevant.length);
  for (let spread = 1; spread < BUDGETS.length; spread++) {
    const pool = relevant.filter((p) => bandDistance(p.price, budgetId) <= spread);
    if (pool.length >= target) return pool;
  }
  return relevant;
}

function scoreProduct(
  product: Product,
  archetype: ArchetypeId,
  prefs: PrefKey[],
  budgetId: BudgetId,
) {
  const vibe = ARCHETYPES[archetype];
  let score = 0;

  // Vibe match dominates, so results always read as personal to the recipient.
  if (product.archetype === archetype) score += 40;

  // Then how many of their vibe tags this product actually shares.
  score += product.tags.filter((t) => vibe.tags.includes(t)).length * 6;

  // Gift preferences picked up from the questionnaire.
  score += product.prefs.filter((p) => prefs.includes(p)).length * 5;

  // Budget: inside the chosen band wins, one band out is still plausible.
  const distance = bandDistance(product.price, budgetId);
  score += distance === 0 ? 18 : distance === 1 ? 8 : 2;

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
      score: scoreProduct(product, archetype, prefs, budget),
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
