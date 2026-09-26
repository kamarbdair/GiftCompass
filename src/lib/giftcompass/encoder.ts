/** Text encoder used for candidate retrieval (layer 4).
 *
 *  The Day 3 design calls for multilingual sentence embeddings. Those need a
 *  model we cannot run offline, so the prototype ships a TF-IDF vector space
 *  instead: still cosine similarity over a shared vocabulary, just a lexical
 *  encoder rather than a neural one. Swapping in sentence-transformers means
 *  replacing this one object — nothing else in the pipeline changes.
 */
export interface Encoder {
  name: string;
  fit(documents: string[]): void;
  encode(text: string): Map<string, number>;
}

/** Splits Arabic and Latin script alike; drops punctuation and diacritics. */
export function tokenize(text: string): string[] {
  const stripped = text
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '')   // Arabic diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
  return (stripped.match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => t.length > 1);
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [term, wa] of small) {
    const wb = large.get(term);
    if (wb) dot += wa * wb;
  }
  if (dot === 0) return 0;
  let na = 0;
  let nb = 0;
  for (const w of a.values()) na += w * w;
  for (const w of b.values()) nb += w * w;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function createTfidfEncoder(): Encoder {
  let idf = new Map<string, number>();

  return {
    name: 'tfidf-cosine@1.0.0',

    fit(documents: string[]) {
      const df = new Map<string, number>();
      for (const doc of documents) {
        for (const term of new Set(tokenize(doc))) df.set(term, (df.get(term) ?? 0) + 1);
      }
      const n = documents.length;
      idf = new Map([...df].map(([term, count]) => [term, Math.log((n + 1) / (count + 1)) + 1]));
    },

    encode(text: string) {
      const tokens = tokenize(text);
      if (tokens.length === 0) return new Map();
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      const vec = new Map<string, number>();
      for (const [term, count] of tf) {
        // Unseen terms still get a floor weight so a rare query word is not ignored.
        vec.set(term, (count / tokens.length) * (idf.get(term) ?? 1));
      }
      return vec;
    },
  };
}
