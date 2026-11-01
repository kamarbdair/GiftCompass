'use strict';
/* GiftCompass MVP validation tests. Run with:  npm test   (or: node --test test/run-tests.js, Node 18+) */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { recommend, validateProfile, keywordHit, LABELS, WEIGHTS } = require('../src/engine');
const server = require('../server');

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'catalog.json'), 'utf8'));
const P = catalog.products;
const base = { personalities: [], styles: [], giftTypes: [], wishes: '', owned: '', avoid: [] };

const PROFILES = {
  A_friend_birthday_books_games: { ...base, relationship: 'friend', occasion: 'birthday', interests: ['reading', 'gaming'], personalities: ['homebody', 'social'], styles: ['fun'], giftTypes: ['hobby'], minBudget: 150, maxBudget: 250 },
  B_parent_eid_coffee_oud: { ...base, relationship: 'parent', occasion: 'eid', interests: ['coffee', 'fragrance'], personalities: ['traditional'], styles: ['sentimental', 'luxurious'], owned: 'They already have a dallah', avoid: ['food'], minBudget: 200, maxBudget: 400 },
  C_partner_anniversary_adventurous: { ...base, relationship: 'partner', occasion: 'anniversary', interests: ['travel', 'photography'], personalities: ['adventurous'], styles: ['sentimental'], giftTypes: ['experience'], wishes: 'stargazing', minBudget: 100, maxBudget: 700 },
  D_colleague_thanks_low_budget: { ...base, relationship: 'colleague', occasion: 'thank_you', interests: ['plants', 'coffee', 'reading'], styles: ['practical'], avoid: ['upkeep'], minBudget: 0, maxBudget: 100 },
  E_sibling_graduation_tech_wish: { ...base, relationship: 'sibling', occasion: 'graduation', interests: ['reading', 'tech'], personalities: ['calm'], styles: ['practical'], giftTypes: ['gadget'], wishes: 'noise cancelling headphones', minBudget: 100, maxBudget: 500 },
  F_required_answers_only: { ...base, relationship: 'family_friend', occasion: 'housewarming', interests: ['home_decor'], minBudget: 50, maxBudget: 300 }
};

const ids = (out) => out.results.map((r) => r.product.id);

function checkResultInvariants(name, profile, out) {
  assert.equal(out.ok, true, `${name}: should succeed`);
  const prof = out.profile;
  for (const r of out.results) {
    const p = r.product;
    // Q10: budget is a strict filter
    assert.ok(p.priceSAR >= prof.minBudget && p.priceSAR <= prof.maxBudget, `${name}: ${p.id} outside budget`);
    // Q9: avoided tags never appear
    prof.avoid.forEach((a) => assert.ok(!p.avoidTags.includes(a), `${name}: ${p.id} has avoided tag ${a}`));
    // Q8: owned items never appear
    assert.equal(keywordHit(prof.owned, p.keywords), null, `${name}: ${p.id} matches an owned item`);
    // matched criteria are real
    r.matched.interests.forEach((i) => assert.ok(prof.interests.includes(i) && p.interests.includes(i)));
    r.matched.personalities.forEach((x) => assert.ok(prof.personalities.includes(x) && p.personalities.includes(x)));
    r.matched.styles.forEach((s) => assert.ok(prof.styles.includes(s) && p.styles.includes(s)));
    r.matched.giftTypes.forEach((t) => assert.ok(prof.giftTypes.includes(t) && p.giftTypes.includes(t)));
    if (r.matched.wish) assert.ok(p.keywords.includes(r.matched.wish) && keywordHit(prof.wishes, [r.matched.wish]));
    assert.equal(r.matched.occasion, p.occasions.includes(prof.occasion));
    assert.equal(r.matched.relationship, p.relationships.includes(prof.relationship));
    // relevance gate
    assert.ok(r.matched.interests.length || r.matched.wish || r.matched.styles.length, `${name}: ${p.id} irrelevant`);
    // explanations mention exactly what matched, and nothing that did not
    const text = r.reasons.join(' | ') + ' | ' + r.summary;
    for (const i of prof.interests) assert.equal(text.includes(LABELS.interests[i]), r.matched.interests.includes(i), `${name}: ${p.id} interest text ${i}`);
    for (const s of prof.styles) assert.equal(r.reasons.join('|').includes(`${LABELS.styles[s]}`), r.matched.styles.includes(s), `${name}: ${p.id} style text ${s}`);
    assert.equal(text.includes('wanting') || text.includes('said they wanted'), !!r.matched.wish, `${name}: ${p.id} wish text`);
    assert.equal(r.reasons.some((x) => x.startsWith('Suitable for')), r.matched.occasion);
    assert.equal(r.reasons.some((x) => x.startsWith('Appropriate for')), r.matched.relationship);
    // score equals the documented formula
    const used = Object.entries(r.breakdown).filter(([, b]) => b.counted);
    const expected = used.reduce((s, [, b]) => s + b.value * b.weight, 0) / used.reduce((s, [, b]) => s + b.weight, 0);
    assert.ok(Math.abs(r.score - Math.round(expected * 100) / 100) < 1e-9, `${name}: formula mismatch`);
    assert.ok(r.score >= 0 && r.score <= 1);
  }
  for (let i = 1; i < out.results.length; i++) assert.ok(out.results[i - 1].score >= out.results[i].score, `${name}: not sorted`);
  // every exclusion is justified
  for (const e of out.excluded) {
    const p = P.find((x) => x.id === e.id);
    if (e.reason === 'avoid') assert.ok(prof.avoid.some((a) => p.avoidTags.includes(a)));
    else assert.ok(keywordHit(prof.owned, p.keywords));
  }
}

test('weights sum to 1 and catalogue is demo data and well-formed', () => {
  assert.equal(Math.round(Object.values(WEIGHTS).reduce((a, b) => a + b, 0) * 1000) / 1000, 1);
  assert.match(catalog.notice, /DEMO DATA/);
  const seen = new Set();
  for (const p of P) {
    assert.ok(!seen.has(p.id)); seen.add(p.id);
    assert.ok(Number.isFinite(p.priceSAR) && p.priceSAR > 0);
    for (const [field, group] of [['interests', 'interests'], ['styles', 'styles'], ['giftTypes', 'giftTypes'], ['personalities', 'personalities'], ['occasions', 'occasions'], ['relationships', 'relationships'], ['avoidTags', 'avoid']]) {
      assert.ok(Array.isArray(p[field]), `${p.id} missing ${field}`);
      p[field].forEach((v) => assert.ok(v in LABELS[group], `${p.id} unknown ${field} ${v}`));
    }
    assert.ok(p.keywords.length > 0 && p.interests.length > 0 && p.styles.length > 0 && p.giftTypes.length > 0);
    assert.ok(!('url' in p) && !('affiliateLink' in p) && !('retailer' in p) && !('rating' in p), 'no live links, retailers or reviews in demo data');
  }
});

for (const [name, profile] of Object.entries(PROFILES)) {
  test(`profile ${name}: budget, exclusions, explanations, formula`, () => {
    const out = recommend(P, profile, 5);
    checkResultInvariants(name, profile, out);
    console.log(`\n${name}  (${JSON.stringify(out.stats)})`);
    out.results.forEach((r) => console.log(`  #${r.rank} ${r.product.name} | SAR ${r.product.priceSAR} | ${Math.round(r.score * 100)}% | ${r.summary}`));
    out.excluded.forEach((e) => console.log(`   removed: ${e.name} (${e.text})`));
  });
}

test('main demo profiles each get at least three recommendations', () => {
  for (const k of ['A_friend_birthday_books_games', 'B_parent_eid_coffee_oud', 'C_partner_anniversary_adventurous', 'E_sibling_graduation_tech_wish', 'F_required_answers_only']) {
    assert.ok(recommend(P, PROFILES[k]).results.length >= 3, `${k} returned fewer than 3`);
  }
});

test('every questionnaire answer changes the recommendations', () => {
  const b = PROFILES.A_friend_birthday_books_games;
  const r0 = recommend(P, b);
  const changed = (variant, label) => {
    const r = recommend(P, { ...b, ...variant });
    assert.ok(JSON.stringify(ids(r)) !== JSON.stringify(ids(r0)) || JSON.stringify(r.results.map((x) => x.score)) !== JSON.stringify(r0.results.map((x) => x.score)), `${label} had no effect`);
  };
  changed({ relationship: 'colleague' }, 'Q1 relationship');
  changed({ occasion: 'wedding' }, 'Q2 occasion');
  changed({ interests: ['cooking'] }, 'Q3 interests');
  changed({ personalities: ['active'] }, 'Q4 personality');
  changed({ styles: ['practical'] }, 'Q5 style');
  changed({ giftTypes: ['personalised'] }, 'Q6 gift type');
  changed({ wishes: 'jigsaw puzzle' }, 'Q7 wishes');
  changed({ owned: 'board game' }, 'Q8 already own');
  changed({ avoid: ['electronics'] }, 'Q9 avoid');
  changed({ minBudget: 50, maxBudget: 120 }, 'Q10 budget');
});

test('known wishes receive meaningful priority', () => {
  const e = PROFILES.E_sibling_graduation_tech_wish;
  const withWish = recommend(P, e);
  assert.equal(withWish.results[0].product.id, 'p15', 'wished-for earbuds should rank first');
  assert.ok(withWish.results[0].matched.wish);
  const noWish = recommend(P, { ...e, wishes: '' });
  assert.ok(ids(noWish).indexOf('p15') !== 0, 'without the wish the earbuds are not first');
  // A wish can lift an item that only loosely fits into the top 3
  const c = recommend(P, PROFILES.C_partner_anniversary_adventurous);
  assert.equal(c.results[0].product.id, 'p45');
  // Plural / punctuation tolerant
  assert.equal(keywordHit('Headphones!!', ['headphones']), 'headphones');
  assert.equal(keywordHit('an E-Reader', ['e-reader']), 'e-reader');
  assert.equal(keywordHit('reader', ['e-reader']), null);
});

test('things to avoid and already-owned items are excluded', () => {
  const b = PROFILES.E_sibling_graduation_tech_wish;
  const out = recommend(P, { ...b, avoid: ['electronics'] });
  assert.ok(out.results.every((r) => !r.product.avoidTags.includes('electronics')));
  assert.ok(out.stats.excludedAvoid >= 5);
  assert.ok(!ids(out).includes('p15'), 'avoid beats wish');
  const owned = recommend(P, { ...b, owned: 'headphones, e-reader' });
  assert.ok(!ids(owned).includes('p15') && !ids(owned).includes('p43'));
  assert.equal(owned.stats.excludedOwned, 2);
  // every avoid option removes all tagged products
  for (const a of Object.keys(LABELS.avoid)) {
    const r = recommend(P, { ...PROFILES.F_required_answers_only, interests: ['home_decor', 'reading', 'tech', 'fragrance', 'cooking'], minBudget: 0, maxBudget: 1000, avoid: [a] });
    r.results.forEach((x) => assert.ok(!x.product.avoidTags.includes(a), `avoid ${a} leaked ${x.product.id}`));
  }
});

test('nothing outside the selected budget is ever returned', () => {
  for (const [min, max] of [[0, 100], [100, 200], [150, 250], [200, 400], [400, 1000], [0, 60], [300, 300]]) {
    for (const prof of Object.values(PROFILES)) {
      const out = recommend(P, { ...prof, minBudget: min, maxBudget: max });
      out.results.forEach((r) => assert.ok(r.product.priceSAR <= max && r.product.priceSAR >= min));
    }
  }
  assert.equal(recommend(P, { ...PROFILES.A_friend_birthday_books_games, minBudget: 0, maxBudget: 50 }).results.length, 0);
});

test('skipping optional questions never lowers the match percentage', () => {
  const r = recommend(P, PROFILES.F_required_answers_only).results[0];
  assert.equal(r.breakdown.wish.counted, false);
  assert.equal(r.totalWeight, Math.round((WEIGHTS.interest + WEIGHTS.context) * 100) / 100);
});

test('invalid questionnaires are rejected and input is sanitised', () => {
  const ok = PROFILES.A_friend_birthday_books_games;
  assert.equal(validateProfile({}).ok, false);
  assert.equal(validateProfile({ ...ok, interests: [] }).ok, false);
  assert.equal(validateProfile({ ...ok, minBudget: 300, maxBudget: 100 }).ok, false);
  assert.equal(validateProfile({ ...ok, minBudget: '', maxBudget: '' }).ok, false);
  assert.equal(validateProfile({ ...ok, occasion: 'unknown' }).ok, false);
  assert.equal(validateProfile({ ...ok, interests: ['reading', 'a', '__proto__'] }).profile.interests.length, 1);
  assert.equal(validateProfile({ ...ok, avoid: ['electronics', 'xyz'] }).profile.avoid.length, 1);
  assert.equal(validateProfile({ ...ok, wishes: 'x'.repeat(500) }).profile.wishes.length, 100);
  assert.equal(validateProfile({ ...ok, wishes: 42 }).profile.wishes, '');
});

test('end-to-end over HTTP: options, recommend, validation, static app', async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await (await fetch(`${url}/`)).text();
    assert.match(html, /GiftCompass/);
    assert.match(html, /Coming later/);
    const opts = await (await fetch(`${url}/api/options`)).json();
    for (const g of ['interests', 'personalities', 'styles', 'giftTypes', 'avoid', 'occasions', 'relationships']) assert.ok(Object.keys(opts.labels[g]).length > 0);
    for (const [name, profile] of Object.entries(PROFILES)) {
      const res = await fetch(`${url}/api/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      assert.equal(res.status, 200);
      checkResultInvariants(`http:${name}`, profile, await res.json());
    }
    const bad = await fetch(`${url}/api/recommend`, { method: 'POST', body: JSON.stringify({ interests: [] }) });
    assert.equal(bad.status, 422);
    const big = await fetch(`${url}/api/recommend`, { method: 'POST', body: 'x'.repeat(20000) });
    assert.equal(big.status, 413);
    const traversal = await fetch(`${url}/..%2Fserver.js`);
    assert.notEqual(traversal.status, 200);
  } finally {
    server.close();
  }
});
