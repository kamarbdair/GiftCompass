/** Layer 3 — Persona Builder.
 *
 *  Turns normalized signals into a Persona. This implementation is
 *  DETERMINISTIC: it maps signal text to interest keys with the taxonomy's
 *  match_terms, then applies the documented weight formula. The LLM builder
 *  described in the Day 3 document is a drop-in replacement behind
 *  `PersonaBuilder` — it must emit the same schema and the same keys, and its
 *  output is validated before use. Nothing downstream knows which built it.
 */
import { HALF_LIFE_DAYS, SIGNAL_STRENGTH } from './types.ts';
import type {
  Dislike, Evidence, Interest, Persona, RawSignal, SourceType,
} from './types.ts';
import { loadTaxonomy } from './data.ts';

/** Words that flip a mention into a dislike. "I hate Twilight" mentions
 *  Twilight and is a NO (P2) — direction matters, not just keywords. */
const NEGATIONS = [
  'hate', "don't like", 'dont like', 'not a fan', 'not into', 'not interested',
  'never liked', 'cannot stand', "can't stand", 'dislike', 'allergic', 'no thanks',
  'ما احب', 'ما أحب', 'لا احب', 'لا أحب', 'اكره', 'أكره', 'ما يعجبني', 'حساسية',
];

export interface PersonaBuilder {
  name: string;
  build(input: BuildInput): Persona;
}

export interface BuildInput {
  persona_id: string;
  signals: RawSignal[];
  consent: Persona['consent'];
  recipient_basics?: Persona['recipient_basics'];
  style?: Persona['style'];
  already_owns?: Persona['already_owns'];
  built_at?: string;
}

const norm = (s: string): string => s.toLowerCase().replace(/[#_]/g, ' ').replace(/\s+/g, ' ').trim();

export function isNegative(text: string): boolean {
  const t = norm(text);
  return NEGATIONS.some((n) => t.includes(n));
}

/** Word forms of a signal, used so matching happens on token boundaries.
 *  Plain substring matching produced false positives that were not obvious
 *  until the personas were built: "skincare" contains "car", "carry-on"
 *  contains "car", "watching" contains "watch". */
function wordSet(text: string): Set<string> {
  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const set = new Set<string>();
  for (const w of words) {
    set.add(w);
    if (w.length > 3 && w.endsWith('s')) set.add(w.slice(0, -1));   // plural
    if (w.length > 3 && w.startsWith('ال')) set.add(w.slice(2));     // Arabic article
  }
  return set;
}

/** Which interest keys a single signal mentions.
 *  A term matches when it is a whole word, a phrase present in the text, or a
 *  prefix of a longer token — the last only for terms of 6+ characters, which
 *  catches concatenated hashtags like #matcharecipe without letting "watch"
 *  match "watching". */
export function matchKeys(text: string): string[] {
  const t = norm(text);
  const words = wordSet(t);
  const hits: string[] = [];
  for (const entry of loadTaxonomy().interests) {
    const hit = entry.match_terms.some((term) => {
      const n = norm(term);
      if (n.includes(' ')) return t.includes(n);
      if (words.has(n)) return true;
      if (n.length >= 6) return [...words].some((w) => w.startsWith(n));
      return false;
    });
    if (hit) hits.push(entry.key);
  }
  return hits;
}

const daysBetween = (from: string, to: string): number =>
  Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000));

export const decay = (ageDays: number): number => 0.5 ** (ageDays / HALF_LIFE_DAYS);

/** weight = raw / (raw + 2), rounded to 2dp.
 *  Saturating: evidence has diminishing returns, so a single signal lands in
 *  the weak band however strong its type. It only rounds to 1.00 at a raw
 *  score around 200, which needs a great deal of repeated evidence. */
export const toWeight = (raw: number): number => Math.round((raw / (raw + 2)) * 100) / 100;

export const band = (w: number): Interest['strength'] =>
  (w >= 0.66 ? 'strong' : w >= 0.33 ? 'medium' : 'weak');

export const deterministicPersonaBuilder: PersonaBuilder = {
  name: 'persona-builder-deterministic@1.0.0',

  build({ persona_id, signals, consent, recipient_basics, style, already_owns, built_at }): Persona {
    const now = built_at ?? new Date().toISOString();
    const today = now.slice(0, 10);
    const taxonomy = new Map(loadTaxonomy().interests.map((i) => [i.key, i]));

    const raw = new Map<string, number>();
    const evidence = new Map<string, Evidence[]>();
    const negativeKeys = new Map<string, SourceType>();
    const sourceMix: Record<string, number> = {};

    for (const s of signals) {
      sourceMix[s.source] = (sourceMix[s.source] ?? 0) + 1;
      const keys = matchKeys(s.text);
      if (keys.length === 0) continue;

      if (isNegative(s.text)) {
        for (const k of keys) negativeKeys.set(k, s.source);
        continue;
      }

      const count = s.count ?? 1;
      const contribution = count * SIGNAL_STRENGTH[s.signal_type] * decay(daysBetween(s.observed_at, today));
      for (const k of keys) {
        raw.set(k, (raw.get(k) ?? 0) + contribution);
        const list = evidence.get(k) ?? [];
        list.push({
          source: s.source,
          signal_type: s.signal_type,
          excerpt: s.text.slice(0, 140),
          observed_at: s.observed_at,
          count,
        });
        evidence.set(k, list);
      }
    }

    // A negatively-mentioned topic never becomes an interest.
    for (const k of negativeKeys.keys()) raw.delete(k);

    const interests: Interest[] = [...raw.entries()]
      .map(([key, rawScore]) => {
        const entry = taxonomy.get(key)!;
        const weight = toWeight(rawScore);
        const ev = evidence.get(key) ?? [];
        return {
          key,
          label_en: entry.label_en,
          label_ar: entry.label_ar,
          weight,
          strength: band(weight),
          sentiment: 'positive' as const,
          giftability: entry.default_giftability,
          // More independent evidence items -> more confident, capped.
          confidence: Math.round(Math.min(0.95, 0.4 + 0.12 * ev.length) * 100) / 100,
          evidence: ev,
        };
      })
      .filter((i) => i.weight > 0)
      .sort((a, b) => b.weight - a.weight);

    const dislikes: Dislike[] = [...negativeKeys.entries()].map(([key, source]) => ({
      key,
      label_en: taxonomy.get(key)!.label_en,
      reason: 'negative_sentiment',
      source,
    }));

    const strong = interests.filter((i) => i.strength === 'strong').length;
    const completeness = Math.round(
      Math.min(1, (interests.length / 6) * 0.6 + (strong / 2) * 0.4) * 100,
    ) / 100;

    return {
      persona_id,
      schema_version: '1.0.0',
      created_at: now,
      expires_at: new Date(Date.parse(now) + 180 * 86_400_000).toISOString(),
      locale: 'ar-SA',
      consent,
      recipient_basics,
      interests,
      dislikes,
      style,
      already_owns,
      blocked_attributes: ['religion', 'health', 'politics', 'sexuality', 'ethnicity', 'income', 'financial_status'],
      provenance: {
        builder: 'persona-builder-deterministic@1.0.0',
        built_at: now,
        signal_count: signals.length,
        source_mix: sourceMix,
        completeness,
        is_fallback: signals.every((s) => s.source === 'quiz' || s.source === 'manual_caption'),
      },
    };
  },
};
