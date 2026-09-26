/** Day 4 checks for the pipeline. Run: node --test scripts/test-pipeline.ts */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  deterministicPersonaBuilder, isNegative, matchKeys, toWeight, band, decay,
} from '../src/lib/giftcompass/personaBuilder.ts';
import { budgetFit } from '../src/lib/giftcompass/ranking.ts';
import { EMBARRASSMENT_THRESHOLD, rejectReason } from '../src/lib/giftcompass/filters.ts';
import { applyRerank } from '../src/lib/giftcompass/llm.ts';
import { loadCatalog } from '../src/lib/giftcompass/data.ts';
import { recommend } from '../src/lib/giftcompass/pipeline.ts';
import type { GiftContext, Persona, Product, RawSignal, Recommendation } from '../src/lib/giftcompass/types.ts';

const consent: Persona['consent'] = {
  consent_given: true,
  granted_by: 'receiver',
  purpose: 'gift_recommendation',
  consent_version: 'test',
  granted_at: '2026-09-20T00:00:00Z',
  sources: ['quiz'],
};

const buildFrom = (signals: RawSignal[], over: Partial<Parameters<typeof deterministicPersonaBuilder.build>[0]> = {}) =>
  deterministicPersonaBuilder.build({
    persona_id: 'psn_test', signals, consent, built_at: '2026-09-26T00:00:00Z', ...over,
  });

test('weight formula saturates and bands correctly', () => {
  assert.equal(toWeight(0), 0);
  assert.equal(toWeight(2), 0.5);
  assert.ok(toWeight(1000) <= 1, 'weight never exceeds 1');
  assert.ok(toWeight(1) < 0.66, 'a single maximum-strength signal stays out of the strong band');
  assert.ok(toWeight(4) > toWeight(3), 'more evidence always means more weight');
  assert.equal(band(0.7), 'strong');
  assert.equal(band(0.5), 'medium');
  assert.equal(band(0.1), 'weak');
});

test('recency decay halves at the 180-day half-life', () => {
  assert.equal(decay(0), 1);
  assert.ok(Math.abs(decay(180) - 0.5) < 1e-9);
});

test('one loud signal cannot outrank repeated evidence', () => {
  const single = buildFrom([
    { text: 'matcha', source: 'tiktok_export', signal_type: 'posted', observed_at: '2026-09-26', count: 1 },
  ]);
  const repeated = buildFrom([
    { text: 'matcha', source: 'tiktok_export', signal_type: 'liked', observed_at: '2026-09-26', count: 8 },
  ]);
  assert.ok(repeated.interests[0].weight > single.interests[0].weight);
  assert.ok(single.interests[0].weight < 0.66, 'a single post should not read as a strong interest');
});

test('matching respects word boundaries', () => {
  // These all contain "car" or "watch" as substrings but mean something else.
  assert.deepEqual(matchKeys('my skincare routine'), ['skincare']);
  assert.ok(!matchKeys('carry-on packing for a trip').includes('cars'));
  assert.ok(!matchKeys('always watching matches').includes('watches'));
  // Concatenated hashtags still resolve.
  assert.ok(matchKeys('#matcharecipe at home').includes('matcha'));
});

test('negative sentiment becomes a dislike, never an interest', () => {
  const p = buildFrom([
    { text: 'I hate gaming gadgets', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' },
    { text: 'Not into fragrance', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' },
    { text: 'loves football', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' },
  ]);
  const interestKeys = p.interests.map((i) => i.key);
  const dislikeKeys = (p.dislikes ?? []).map((d) => d.key);
  assert.ok(!interestKeys.includes('gaming'));
  assert.ok(dislikeKeys.includes('gaming'));
  assert.ok(dislikeKeys.includes('fragrance'));
  assert.ok(interestKeys.includes('football'));
  assert.ok(isNegative("I don't like books"));
  assert.ok(!isNegative('I love books'));
});

test('persona never carries a sensitive attribute field', () => {
  const p = buildFrom([{ text: 'coffee', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' }]);
  const serialised = JSON.stringify(p);
  for (const key of ['religion', 'health', 'politics', 'sexuality']) {
    // present only inside the blocked_attributes deny-list, nowhere else
    const occurrences = serialised.split(`"${key}"`).length - 1;
    assert.equal(occurrences, 1, `${key} should appear once, in blocked_attributes`);
  }
});

test('budget fit peaks at 75% of the budget', () => {
  assert.equal(budgetFit(375, 500), 1);
  assert.ok(budgetFit(375, 500) > budgetFit(500, 500));
  assert.ok(budgetFit(375, 500) > budgetFit(50, 500));
  assert.equal(budgetFit(100, 0), 0);
});

const catalog = loadCatalog();
const product = (over: Partial<Product> = {}): Product => ({
  ...catalog[0], ...over,
});

const persona: Persona = buildFrom([
  { text: 'matcha', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' },
], { recipient_basics: { age_range: '25_34', city: 'Jeddah' } });

const ctx: GiftContext = {
  request_id: 'r1', relationship: 'colleague', occasion: 'birthday',
  budget_sar: { max: 300 }, days_until_occasion: 5,
};

test('hard filters reject for the documented reasons', () => {
  assert.equal(rejectReason(product({ price_sar: 400 }), persona, ctx), 'over_budget');
  assert.equal(rejectReason(product({ delivery_days: 9 }), persona, ctx), 'too_slow_to_deliver');
  assert.equal(rejectReason(product({ age_min: 60, age_max: 80 }), persona, ctx), 'age_mismatch');
  assert.equal(rejectReason(product({ relationship_fit: ['partner'] }), persona, ctx), 'relationship_mismatch');
  assert.equal(rejectReason(product({ requires_size: true }), persona, ctx), 'needs_size');
  assert.equal(rejectReason(product({ available_in_jeddah: false }), persona, ctx), 'not_available');
  assert.equal(rejectReason(product({ data_status: 'demo' }), persona, ctx, { requireVerified: true }), 'unverified_data');
  assert.equal(rejectReason(product(), persona, ctx), null);
});

test('embarrassment threshold is stricter for a colleague than a partner', () => {
  assert.ok(EMBARRASSMENT_THRESHOLD.colleague < EMBARRASSMENT_THRESHOLD.partner);
  const risky = product({ embarrassment_risk: 0.5 });
  assert.equal(rejectReason(risky, persona, ctx), 'too_embarrassing');
  assert.equal(rejectReason(risky, persona, { ...ctx, relationship: 'partner' }), null);
});

test('dislikes are an exclusion, not a penalty', () => {
  const p = buildFrom([
    { text: 'I hate matcha', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' },
    { text: 'loves reading', source: 'quiz', signal_type: 'quiz_answer', observed_at: '2026-09-20' },
  ], { recipient_basics: { age_range: '25_34' } });
  assert.equal(rejectReason(product({ interest_keys: ['matcha'] }), p, ctx), 'disliked');
});

test('LLM re-rank can reorder but cannot inject a product', async () => {
  const items = [
    { product: product({ product_id: 'GC-0001' }) },
    { product: product({ product_id: 'GC-0002' }) },
  ] as Recommendation[];
  const out = applyRerank(items, ['GC-0002', 'GC-9999']);
  assert.deepEqual(out.map((i) => i.product.product_id), ['GC-0002', 'GC-0001']);
  assert.equal(out.length, 2, 'an invented id must not add a product');
});

test('pipeline refuses a persona without consent', async () => {
  const noConsent = { ...persona, consent: { ...persona.consent, consent_given: false } };
  await assert.rejects(() => recommend(noConsent, ctx), /no consent/);
});

test('every recommendation stays inside the budget and the category cap', async () => {
  const dir = path.join(process.cwd(), 'data/personas');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const p = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as Persona;
    const bandCtx: GiftContext = {
      request_id: 't', relationship: 'friend', occasion: 'birthday',
      budget_sar: { max: 400 }, days_until_occasion: 30,
    };
    const res = await recommend(p, bandCtx);
    assert.ok(res.recommendations.length <= 5);
    const perCategory = new Map<string, number>();
    for (const r of res.recommendations) {
      assert.ok(r.product.price_sar <= 400, `${file}: ${r.product.product_id} over budget`);
      assert.ok(r.product.delivery_days <= 30);
      assert.ok(r.why.length > 20, 'every recommendation needs a reason');
      perCategory.set(r.product.category, (perCategory.get(r.product.category) ?? 0) + 1);
    }
    for (const [cat, n] of perCategory) assert.ok(n <= 2, `${file}: ${n} items from ${cat}`);
  }
});

test('no recommendation is padded when nothing fits', async () => {
  const p = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/personas/psn_omar.json'), 'utf8')) as Persona;
  const impossible: GiftContext = {
    request_id: 't', relationship: 'colleague', occasion: 'birthday',
    budget_sar: { max: 20 }, days_until_occasion: 1,
  };
  const res = await recommend(p, impossible);
  assert.equal(res.recommendations.length, 0);
});
