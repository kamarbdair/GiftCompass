/** The GiftCompass pipeline, layers 4-7.
 *  signals -> persona happens upstream in personaBuilder.ts. */
import type { GiftContext, Persona, PipelineResult, Product, Recommendation } from './types.ts';
import { loadCatalog } from './data.ts';
import { applyFilters } from './filters.ts';
import {
  coverStrongInterests, createRanker, diversify, isRelevant, retrieve,
  scoreProduct, toRecommendation, type Ranker,
} from './ranking.ts';
import { applyRerank, noopReranker, type RerankProvider } from './llm.ts';

export interface RecommendOptions {
  catalog?: Product[];
  ranker?: Ranker;
  limit?: number;
  retrieveTopN?: number;
  perCategory?: number;
  reranker?: RerankProvider;
  requireVerified?: boolean;
}

export async function recommend(
  persona: Persona,
  ctx: GiftContext,
  opts: RecommendOptions = {},
): Promise<PipelineResult> {
  if (!persona.consent.consent_given) {
    throw new Error(`persona ${persona.persona_id} has no consent on record; refusing to use it`);
  }

  const catalog = opts.catalog ?? loadCatalog();
  const ranker = opts.ranker ?? createRanker(catalog);
  const limit = opts.limit ?? 5;

  // 4 - retrieval
  const { products: retrieved, personaVector } = retrieve(
    catalog, persona, ranker, opts.retrieveTopN ?? 50,
  );

  // 5 - hard filters, before any ranking
  const { kept, drops } = applyFilters(retrieved, persona, ctx, {
    requireVerified: opts.requireVerified,
  });

  // 6 - ranking, relevance gate, diversity
  const allScored = kept
    .map((product) => ({ product, score: scoreProduct(product, persona, ctx, ranker, personaVector) }))
    .sort((a, b) => b.score.total - a.score.total);

  const scored = allScored.filter((x) => isRelevant(x.score, x.product, persona));
  const weakDrops = allScored.length - scored.length;

  const perCategory = opts.perCategory ?? 2;
  const top = coverStrongInterests(scored, diversify(scored, limit, perCategory), persona, perCategory);

  // 7 - explanations, then the optional LLM re-rank over what is already chosen
  let recommendations: Recommendation[] = top.map((item) => toRecommendation(item, persona, ctx));

  const reranker = opts.reranker ?? noopReranker;
  if (reranker.name !== 'none' && recommendations.length > 1) {
    const order = await reranker.rerank(recommendations);
    recommendations = applyRerank(recommendations, order);
  }

  return {
    request: ctx,
    persona_id: persona.persona_id,
    recommendations,
    trace: {
      catalog_size: catalog.length,
      retrieved: retrieved.length,
      after_filters: kept.length,
      filter_drops: weakDrops > 0 ? { ...drops, weak_interest_match: weakDrops } : drops,
      returned: recommendations.length,
      llm_rerank: reranker.name !== 'none',
    },
  };
}
