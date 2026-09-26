/** The optional LLM re-ranker (Day 3, section 1: list-wise, top 10 only).
 *
 *  P7's warning about hallucination is enforced structurally rather than by
 *  prompt wording: the re-ranker may only REORDER ids it was given. Any id it
 *  invents is dropped, anything it omits is appended in the original order, so
 *  a bad model response can change the order but can never inject a product
 *  that was not retrieved, filtered and scored first.
 */
import type { Recommendation } from './types.ts';

export interface RerankProvider {
  name: string;
  /** Returns product_ids in the preferred order. */
  rerank(items: Recommendation[]): Promise<string[]>;
}

/** Default: no LLM configured, deterministic order stands. */
export const noopReranker: RerankProvider = {
  name: 'none',
  rerank: async (items) => items.map((i) => i.product.product_id),
};

export function applyRerank(items: Recommendation[], orderedIds: string[]): Recommendation[] {
  const byId = new Map(items.map((i) => [i.product.product_id, i]));
  const out: Recommendation[] = [];
  const seen = new Set<string>();
  for (const id of orderedIds) {
    const item = byId.get(id);           // unknown id -> silently dropped
    if (item && !seen.has(id)) { out.push(item); seen.add(id); }
  }
  for (const item of items) {            // anything omitted keeps its place at the end
    if (!seen.has(item.product.product_id)) out.push(item);
  }
  return out;
}
