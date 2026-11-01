'use strict';
/**
 * GiftCompass recommendation engine (prototype).
 *
 * Transparent, deterministic, content-based scoring. NOT a trained
 * machine-learning model: every score can be recomputed by hand.
 *
 * Inputs come from the 10-question recipient questionnaire:
 *   Q1 relationship  Q2 occasion  Q3 interests  Q4 personality  Q5 gift styles
 *   Q6 preferred gift types  Q7 things they mentioned wanting (wishes)
 *   Q8 things they already own  Q9 things to avoid  Q10 budget (SAR)
 *
 * Pipeline
 *   1. Budget filter   (hard)  minBudget <= price <= maxBudget
 *   2. Exclusions      (hard)  products tagged with anything in "avoid" (Q9) are removed;
 *                              products matching "already own" (Q8) keywords are removed
 *   3. Relevance gate          a product must match an interest, a wish or a gift style
 *   4. Weighted score          each criterion gives a value in [0, 1]:
 *        interest    = min(1, matched interests / min(selected, 2))
 *        wish        = 1 if the product matches something they mentioned wanting, else 0
 *        style       = matched styles / selected styles
 *        giftType    = 1 if the product is one of the preferred gift types, else 0
 *        personality = min(1, matched traits / min(selected, 2))
 *        context     = (occasion fits + relationship fits) / 2
 *      score = sum(weight x value) / sum(weights of the questions that were answered)
 *      Optional questions that were skipped are left out of the denominator, so
 *      skipping a question never lowers the match percentage.
 *   5. Rank                    score desc, wish first, more matched interests,
 *                              price closest to budget midpoint, then id
 *   6. Explain                 every sentence and bullet is generated only from
 *                              criteria that actually matched
 */

const WEIGHTS = Object.freeze({ wish: 0.30, interest: 0.25, style: 0.15, giftType: 0.10, personality: 0.10, context: 0.10 });

const LABELS = Object.freeze({
  interests: {
    reading: 'reading', gaming: 'games and puzzles', coffee: 'coffee', cooking: 'cooking and food',
    tech: 'technology', fitness: 'fitness', outdoors: 'outdoors and camping', art: 'art and crafts',
    photography: 'photography', fragrance: 'fragrance and oud', beauty: 'beauty and self-care',
    fashion: 'fashion', plants: 'plants', music: 'music', travel: 'travel', home_decor: 'home decor'
  },
  personalities: {
    adventurous: 'adventurous', artistic: 'artistic', homebody: 'homebody', social: 'social',
    trendy: 'stylish', traditional: 'traditional', calm: 'calm', active: 'sporty'
  },
  styles: { practical: 'practical', sentimental: 'sentimental', fun: 'fun', luxurious: 'luxurious', creative: 'creative' },
  giftTypes: {
    keepsake: 'something to keep', experience: 'an experience', personalised: 'a personalised gift',
    treat: 'a food or self-care treat', gadget: 'a gadget', home: 'something for the home', hobby: 'gear for a hobby'
  },
  avoid: {
    scent: 'fragrances and scented items', food: 'food and sweets', caffeine: 'coffee and caffeine',
    electronics: 'gadgets and electronics', wearable: 'clothing and accessories', upkeep: 'plants or items that need care',
    scheduled: 'vouchers that need booking', personalised: 'personalised or engraved items', decor: 'decorative items'
  },
  occasions: {
    birthday: 'a birthday', graduation: 'a graduation', eid: 'Eid', wedding: 'a wedding',
    anniversary: 'an anniversary', housewarming: 'a housewarming', thank_you: 'a thank-you gift'
  },
  relationships: {
    friend: 'a friend', partner: 'a partner or spouse', parent: 'a parent', sibling: 'a sibling',
    colleague: 'a colleague', family_friend: 'a relative or family friend'
  }
});

const OCCASION_ADJ = { birthday: 'birthday', graduation: 'graduation', eid: 'Eid', wedding: 'wedding', anniversary: 'anniversary', housewarming: 'housewarming', thank_you: 'thank-you' };

const LIMITS = Object.freeze({ maxInterests: 5, maxPersonalities: 3, maxStyles: 3, maxGiftTypes: 3, maxTextLength: 100, minBudget: 0, maxBudget: 10000 });

/* ---------- free-text keyword matching (Q7 wishes, Q8 already own) ---------- */
// Lower-case, keep letters/digits (any script), drop punctuation, strip a simple plural "s".
function normalise(text) {
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    .split(/\s+/).filter(Boolean).map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)).join(' ');
}
/** Returns the first product keyword (original spelling) contained in the text, or null. */
function keywordHit(text, keywords) {
  const t = ` ${normalise(text)} `;
  if (t.trim() === '') return null;
  for (const k of keywords || []) { const n = normalise(k); if (n && t.includes(` ${n} `)) return k; }
  return null;
}

/** Validate and normalise a questionnaire. Returns { ok, profile } or { ok:false, errors }. */
function validateProfile(input) {
  const errors = [];
  const p = input && typeof input === 'object' ? input : {};
  const pickList = (arr, allowed, max, field) => {
    if (!Array.isArray(arr)) return [];
    const clean = [...new Set(arr.filter((v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(allowed, v)))];
    if (clean.length > max) errors.push(`Choose at most ${max} ${field}.`);
    return clean.slice(0, max);
  };
  const pickOne = (v, allowed) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(allowed, v) ? v : null);
  const text = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, LIMITS.maxTextLength) : '');

  const relationship = pickOne(p.relationship, LABELS.relationships);
  const occasion = pickOne(p.occasion, LABELS.occasions);
  const interests = pickList(p.interests, LABELS.interests, LIMITS.maxInterests, 'interests');
  const personalities = pickList(p.personalities, LABELS.personalities, LIMITS.maxPersonalities, 'personality traits');
  const styles = pickList(p.styles, LABELS.styles, LIMITS.maxStyles, 'gift styles');
  const giftTypes = pickList(p.giftTypes, LABELS.giftTypes, LIMITS.maxGiftTypes, 'gift types');
  const avoid = pickList(p.avoid, LABELS.avoid, Object.keys(LABELS.avoid).length, 'things to avoid');
  const wishes = text(p.wishes);
  const owned = text(p.owned);
  const minBudget = Number(p.minBudget);
  const maxBudget = Number(p.maxBudget);

  if (!relationship) errors.push('Choose your relationship to the recipient.');
  if (!occasion) errors.push('Choose the occasion.');
  if (interests.length === 0) errors.push('Choose at least one interest.');
  if (p.minBudget == null || p.maxBudget == null || p.minBudget === '' || p.maxBudget === '' || !Number.isFinite(minBudget) || !Number.isFinite(maxBudget)) errors.push('Enter a valid budget.');
  else if (minBudget < LIMITS.minBudget || maxBudget > LIMITS.maxBudget) errors.push(`Budget must be between SAR ${LIMITS.minBudget} and SAR ${LIMITS.maxBudget}.`);
  else if (minBudget > maxBudget) errors.push('Minimum budget cannot be higher than maximum budget.');

  if (errors.length) return { ok: false, errors };
  return { ok: true, profile: { relationship, occasion, interests, personalities, styles, giftTypes, wishes, owned, avoid, minBudget, maxBudget } };
}

function intersect(a, b) { const set = new Set(b); return a.filter((x) => set.has(x)); }
const round2 = (n) => Math.round(n * 100) / 100;
const joinAnd = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Why a product is excluded (or null). Avoid list first, then "already own". */
function exclusionReason(product, profile) {
  const avoided = intersect(profile.avoid, product.avoidTags || []);
  if (avoided.length) return { type: 'avoid', detail: avoided, text: `You asked to avoid ${joinAnd(avoided.map((a) => LABELS.avoid[a]))}` };
  const own = keywordHit(profile.owned, product.keywords);
  if (own) return { type: 'owned', detail: [own], text: `They may already have this (you mentioned "${own}")` };
  return null;
}

/** Score one product against a validated profile. */
function scoreProduct(product, profile) {
  const m = {
    interests: intersect(profile.interests, product.interests),
    personalities: intersect(profile.personalities, product.personalities || []),
    styles: intersect(profile.styles, product.styles),
    giftTypes: intersect(profile.giftTypes, product.giftTypes || []),
    wish: keywordHit(profile.wishes, product.keywords),
    occasion: product.occasions.includes(profile.occasion),
    relationship: product.relationships.includes(profile.relationship)
  };
  const values = {
    interest: Math.min(1, m.interests.length / Math.min(profile.interests.length, 2)),
    wish: m.wish ? 1 : 0,
    style: profile.styles.length ? m.styles.length / profile.styles.length : 0,
    giftType: m.giftTypes.length ? 1 : 0,
    personality: profile.personalities.length ? Math.min(1, m.personalities.length / Math.min(profile.personalities.length, 2)) : 0,
    context: ((m.occasion ? 1 : 0) + (m.relationship ? 1 : 0)) / 2
  };
  // Only questions the user answered count towards the score.
  const answered = {
    interest: true, context: true,
    wish: profile.wishes !== '', style: profile.styles.length > 0,
    giftType: profile.giftTypes.length > 0, personality: profile.personalities.length > 0
  };
  const used = Object.keys(WEIGHTS).filter((k) => answered[k]);
  const totalWeight = used.reduce((s, k) => s + WEIGHTS[k], 0);
  const raw = used.reduce((s, k) => s + WEIGHTS[k] * values[k], 0);
  const score = raw / totalWeight;

  // Criteria bullets (one per matched criterion)
  const reasons = [];
  if (m.wish) reasons.push(`They mentioned wanting "${m.wish}"`);
  if (m.interests.length) reasons.push(`Matches their interest in ${joinAnd(m.interests.map((i) => LABELS.interests[i]))}`);
  if (m.personalities.length) reasons.push(`Suits a ${joinAnd(m.personalities.map((x) => LABELS.personalities[x]))} personality`);
  if (m.styles.length) reasons.push(`Fits your preference for ${joinAnd(m.styles.map((s) => LABELS.styles[s]))} gifts`);
  if (m.giftTypes.length) reasons.push(`It is ${joinAnd(m.giftTypes.map((t) => LABELS.giftTypes[t]))}, a gift type you preferred`);
  if (m.occasion) reasons.push(`Suitable for ${LABELS.occasions[profile.occasion]}`);
  if (m.relationship) reasons.push(`Appropriate for ${LABELS.relationships[profile.relationship]}`);
  reasons.push(`SAR ${product.priceSAR}: within your SAR ${profile.minBudget}–${profile.maxBudget} budget`);

  // One personalised summary sentence built from the same matched criteria
  const lead = m.occasion ? `${OCCASION_ADJ[profile.occasion]} gift idea` : 'gift idea';
  const head = `${/^[aeiouAEIOU]/.test(lead) ? 'An' : 'A'} ${lead}${m.relationship ? ` that suits ${LABELS.relationships[profile.relationship]}` : ''}`;
  const clauses = [];
  if (m.wish) clauses.push(`matches something they said they wanted (${m.wish})`);
  if (m.interests.length) clauses.push(`ties into their love of ${joinAnd(m.interests.map((i) => LABELS.interests[i]))}`);
  if (m.personalities.length) clauses.push(`fits their ${joinAnd(m.personalities.map((x) => LABELS.personalities[x]))} side`);
  if (m.styles.length) clauses.push(`is the ${joinAnd(m.styles.map((s) => LABELS.styles[s]))} kind of gift you wanted`);
  if (m.giftTypes.length) clauses.push(`is ${LABELS.giftTypes[m.giftTypes[0]]}`);
  const summary = `${head}${clauses.length ? `: it ${joinAnd(clauses)}` : ''}.`;

  const breakdown = {};
  for (const k of Object.keys(WEIGHTS)) breakdown[k] = { value: round2(values[k]), weight: WEIGHTS[k], counted: answered[k] };

  return {
    product,
    score: round2(score),
    breakdown, totalWeight: round2(totalWeight),
    matched: m,
    summary,
    reasons
  };
}

/**
 * Recommend gifts.
 * @returns {{ok:true, profile, results, excluded, stats} | {ok:false, errors:string[]}}
 */
function recommend(products, input, limit = 5) {
  const v = validateProfile(input);
  if (!v.ok) return v;
  const profile = v.profile;
  const mid = (profile.minBudget + profile.maxBudget) / 2;

  const inBudget = products.filter((p) => p.priceSAR >= profile.minBudget && p.priceSAR <= profile.maxBudget);
  const excluded = [];
  const allowed = [];
  for (const p of inBudget) {
    const why = exclusionReason(p, profile);
    if (why) excluded.push({ id: p.id, name: p.name, reason: why.type, text: why.text });
    else allowed.push(p);
  }
  const scored = allowed
    .map((p) => scoreProduct(p, profile))
    .filter((r) => r.matched.interests.length > 0 || r.matched.wish || r.matched.styles.length > 0)
    .sort((a, b) =>
      b.score - a.score ||
      (b.matched.wish ? 1 : 0) - (a.matched.wish ? 1 : 0) ||
      b.matched.interests.length - a.matched.interests.length ||
      Math.abs(a.product.priceSAR - mid) - Math.abs(b.product.priceSAR - mid) ||
      a.product.id.localeCompare(b.product.id));

  return {
    ok: true,
    profile,
    results: scored.slice(0, limit).map((r, i) => ({ rank: i + 1, ...r })),
    excluded,
    stats: {
      catalogueSize: products.length,
      withinBudget: inBudget.length,
      excludedAvoid: excluded.filter((e) => e.reason === 'avoid').length,
      excludedOwned: excluded.filter((e) => e.reason === 'owned').length,
      suitable: scored.length
    }
  };
}

module.exports = { recommend, scoreProduct, validateProfile, exclusionReason, keywordHit, normalise, WEIGHTS, LABELS, LIMITS };
