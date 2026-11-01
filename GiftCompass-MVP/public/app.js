'use strict';
/* GiftCompass MVP front end. Plain JavaScript, no build step.
   Talks to the Node server: GET /api/options, POST /api/recommend. */

const EMOJI = {
  interests: { reading: '📚', gaming: '🎲', coffee: '☕', cooking: '🍳', tech: '💻', fitness: '🏃', outdoors: '🏕️', art: '🎨',
    photography: '📷', fragrance: '🧴', beauty: '🧖', fashion: '👗', plants: '🪴', music: '🎵', travel: '✈️', home_decor: '🛋️' },
  personalities: { adventurous: '🧭', artistic: '🎨', homebody: '🏠', social: '🗣️', trendy: '🕶️', traditional: '🕌', calm: '🌿', active: '⚡' },
  styles: { practical: '🧰', sentimental: '💌', fun: '🎉', luxurious: '✨', creative: '🖌️' },
  giftTypes: { keepsake: '🎁', experience: '🎟️', personalised: '✍️', treat: '🍫', gadget: '🔌', home: '🏡', hobby: '🎯' },
  avoid: { scent: '🚫🌸', food: '🚫🍬', caffeine: '🚫☕', electronics: '🚫🔌', wearable: '🚫👕', upkeep: '🚫🪴', scheduled: '🚫📅', personalised: '🚫✍️', decor: '🚫🖼️' },
  occasions: { birthday: '🎂', graduation: '🎓', eid: '🌙', wedding: '💍', anniversary: '💞', housewarming: '🏠', thank_you: '🙏' },
  relationships: { friend: '🤝', partner: '❤️', parent: '👪', sibling: '🧑‍🤝‍🧑', colleague: '💼', family_friend: '🏡' }
};
const CHIP_LABELS = {
  relationships: { friend: 'Friend', partner: 'Partner or spouse', parent: 'Parent', sibling: 'Sibling', colleague: 'Colleague', family_friend: 'Relative or family friend' },
  occasions: { birthday: 'Birthday', graduation: 'Graduation', eid: 'Eid', wedding: 'Wedding', anniversary: 'Anniversary', housewarming: 'Housewarming', thank_you: 'Thank you' },
  personalities: { adventurous: 'Adventurous', artistic: 'Artistic', homebody: 'Cosy homebody', social: 'Social and outgoing', trendy: 'Stylish and trendy', traditional: 'Traditional', calm: 'Calm and reflective', active: 'Energetic and sporty' },
  styles: { practical: 'Practical', sentimental: 'Sentimental', fun: 'Fun', luxurious: 'Luxurious', creative: 'Creative' },
  giftTypes: { keepsake: 'Something to keep', experience: 'An experience', personalised: 'Personalised', treat: 'Food or treats', gadget: 'Gadget', home: 'For the home', hobby: 'Hobby gear' },
  avoid: { scent: 'Fragrances & scents', food: 'Food & sweets', caffeine: 'Coffee & caffeine', electronics: 'Electronics', wearable: 'Clothing & accessories', upkeep: 'Plants / needs care', scheduled: 'Vouchers needing booking', personalised: 'Personalised items', decor: 'Decorative items' }
};
const BUDGETS = [[0, 100, 'Under SAR 100'], [100, 200, 'SAR 100–200'], [150, 250, 'SAR 150–250'], [200, 400, 'SAR 200–400'], [400, 1000, 'SAR 400+']];
const STEPS = 5;
const QUESTIONS_PER_STEP = { 1: 'Questions 1–2', 2: 'Questions 3–4', 3: 'Questions 5–6', 4: 'Questions 7–9', 5: 'Question 10' };
const BREAKDOWN_LABELS = { wish: 'Mentioned wish', interest: 'Interests', style: 'Gift style', giftType: 'Gift type', personality: 'Personality', context: 'Occasion + relationship' };

const blank = () => ({ relationship: null, occasion: null, interests: [], personalities: [], styles: [], giftTypes: [], wishes: '', owned: '', avoid: [], minBudget: null, maxBudget: null });
const state = blank();
let options = null;
let step = 1;
let hasResults = false;
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '');

function show(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${screen}`));
  window.scrollTo({ top: 0 });
}

const CHIP_FIELDS = { relationshipChips: 'relationship', occasionChips: 'occasion', interestChips: 'interests', personalityChips: 'personalities', styleChips: 'styles', giftTypeChips: 'giftTypes', avoidChips: 'avoid' };

function makeChips(container, field, entries, mode, max) {
  container.textContent = '';
  for (const [key, label, emoji] of entries) {
    const b = el('button', 'chip');
    b.type = 'button';
    b.dataset.value = key;
    if (emoji) b.append(el('span', 'em', emoji));
    b.append(document.createTextNode(label));
    b.addEventListener('click', () => {
      if (mode === 'single') state[field] = key;
      else {
        const list = state[field];
        const i = list.indexOf(key);
        if (i >= 0) list.splice(i, 1);
        else if (list.length < max) list.push(key);
        else { $('quizError').textContent = `You can choose up to ${max}.`; return; }
      }
      $('quizError').textContent = '';
      syncInputs();
    });
    container.append(b);
  }
}

function syncInputs() {
  for (const [id, field] of Object.entries(CHIP_FIELDS)) {
    $(id).querySelectorAll('.chip').forEach((c) => {
      const v = state[field];
      c.setAttribute('aria-pressed', String(Array.isArray(v) ? v.includes(c.dataset.value) : v === c.dataset.value));
    });
  }
  $('budgetChips').querySelectorAll('.chip').forEach((c) => {
    c.setAttribute('aria-pressed', String(Number(c.dataset.min) === state.minBudget && Number(c.dataset.max) === state.maxBudget));
  });
  $('minBudget').value = state.minBudget ?? '';
  $('maxBudget').value = state.maxBudget ?? '';
  $('wishes').value = state.wishes;
  $('owned').value = state.owned;
}

function buildQuiz() {
  const L = options.labels;
  const lim = options.limits;
  const entries = (group, labels) => Object.keys(L[group]).map((k) => [k, labels ? labels[k] : cap(L[group][k]), EMOJI[group][k]]);
  makeChips($('relationshipChips'), 'relationship', entries('relationships', CHIP_LABELS.relationships), 'single');
  makeChips($('occasionChips'), 'occasion', entries('occasions', CHIP_LABELS.occasions), 'single');
  makeChips($('interestChips'), 'interests', entries('interests'), 'multi', lim.maxInterests);
  makeChips($('personalityChips'), 'personalities', entries('personalities', CHIP_LABELS.personalities), 'multi', lim.maxPersonalities);
  makeChips($('styleChips'), 'styles', entries('styles', CHIP_LABELS.styles), 'multi', lim.maxStyles);
  makeChips($('giftTypeChips'), 'giftTypes', entries('giftTypes', CHIP_LABELS.giftTypes), 'multi', lim.maxGiftTypes);
  makeChips($('avoidChips'), 'avoid', Object.keys(L.avoid).map((k) => [k, CHIP_LABELS.avoid[k], null]), 'multi', Object.keys(L.avoid).length);
  const bc = $('budgetChips');
  for (const [min, max, label] of BUDGETS) {
    const b = el('button', 'chip', label);
    b.type = 'button'; b.dataset.min = min; b.dataset.max = max;
    b.addEventListener('click', () => { state.minBudget = min; state.maxBudget = max; $('quizError').textContent = ''; syncInputs(); });
    bc.append(b);
  }
  $('minBudget').addEventListener('input', (e) => { state.minBudget = e.target.value === '' ? null : Number(e.target.value); syncInputs(); });
  $('maxBudget').addEventListener('input', (e) => { state.maxBudget = e.target.value === '' ? null : Number(e.target.value); syncInputs(); });
  $('wishes').addEventListener('input', (e) => { state.wishes = e.target.value; });
  $('owned').addEventListener('input', (e) => { state.owned = e.target.value; });
}

function goStep(n) {
  step = n;
  document.querySelectorAll('.step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === n));
  $('progressBar').style.width = `${(n / STEPS) * 100}%`;
  $('stepLabel').textContent = `Step ${n} of ${STEPS} · ${QUESTIONS_PER_STEP[n]} of 10`;
  $('backBtn').textContent = n === 1 ? 'Home' : 'Back';
  $('nextBtn').textContent = n === STEPS ? 'Show my gift ideas' : 'Next';
  $('updateBtn').hidden = !hasResults || n === STEPS;
  $('quizError').textContent = '';
  syncInputs();
  show('quiz');
}

function stepError(n) {
  if (n === 1) {
    if (!state.relationship) return 'Please choose who the gift is for.';
    if (!state.occasion) return 'Please choose the occasion.';
  }
  if (n === 2 && state.interests.length === 0) return 'Please choose at least one interest.';
  if (n === STEPS) {
    const { minBudget: a, maxBudget: b } = state;
    if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) return 'Please choose or enter a budget.';
    if (a < 0 || b > 10000) return 'Budget must be between SAR 0 and SAR 10,000.';
    if (a > b) return 'Minimum budget cannot be higher than maximum budget.';
  }
  return '';
}

async function getRecommendations() {
  $('nextBtn').disabled = true; $('updateBtn').disabled = true;
  try {
    const res = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
    const data = await res.json();
    if (!data.ok) { $('quizError').textContent = data.errors.join(' '); return; }
    renderResults(data);
    hasResults = true;
    show('results');
  } catch (e) {
    $('quizError').textContent = 'Could not reach the GiftCompass server. Is it running?';
  } finally {
    $('nextBtn').disabled = false; $('updateBtn').disabled = false;
  }
}

function renderSummary(p) {
  const L = options.labels;
  const sum = $('summary'); sum.textContent = '';
  const tag = (text, cls) => sum.append(el('span', `tag${cls ? ' ' + cls : ''}`, text));
  tag(`${EMOJI.occasions[p.occasion]} ${CHIP_LABELS.occasions[p.occasion]}`);
  p.interests.forEach((i) => tag(`${EMOJI.interests[i]} ${cap(L.interests[i])}`));
  p.personalities.forEach((x) => tag(`${EMOJI.personalities[x]} ${CHIP_LABELS.personalities[x]}`, 'soft'));
  p.styles.forEach((s) => tag(`${EMOJI.styles[s]} ${CHIP_LABELS.styles[s]}`, 'soft'));
  p.giftTypes.forEach((t) => tag(`${EMOJI.giftTypes[t]} ${CHIP_LABELS.giftTypes[t]}`, 'soft'));
  if (p.wishes) tag(`⭐ Wants: ${p.wishes}`, 'wish');
  if (p.owned) tag(`✓ Has: ${p.owned}`, 'avoid');
  p.avoid.forEach((a) => tag(`Avoid: ${CHIP_LABELS.avoid[a]}`, 'avoid'));
  tag(`SAR ${p.minBudget}–${p.maxBudget}`, 'budget');
}

function renderCard(r) {
  const card = el('article', 'card');
  const visual = el('div', `visual cat-${slug(r.product.category)}`);
  visual.append(el('span', 'visual-emoji', r.product.emoji), el('span', 'visual-cap', 'Illustrative image'));
  card.append(visual);

  const body = el('div', 'card-body');
  const top = el('div', 'card-top');
  top.append(el('span', 'rank', `#${r.rank}`), el('span', 'cat', r.product.category));
  if (r.matched.wish) top.append(el('span', 'wishbadge', '⭐ On their wish list'));
  body.append(top);
  body.append(el('h4', null, r.product.name));
  const meta = el('div', 'meta');
  meta.append(el('span', 'price', `SAR ${r.product.priceSAR}`));
  const match = el('span', 'match');
  const meter = el('span', 'meter'); const fill = el('i'); fill.style.width = `${Math.round(r.score * 100)}%`; meter.append(fill);
  match.append(el('strong', null, `${Math.round(r.score * 100)}% match`), meter);
  meta.append(match);
  body.append(meta);
  body.append(el('p', 'why', r.summary));

  const ul = el('ul', 'reasons');
  r.reasons.forEach((t) => ul.append(el('li', null, t)));
  body.append(ul);

  const det = el('details');
  det.append(el('summary', null, 'How was this scored?'));
  const tb = el('table');
  const head = el('tr'); head.append(el('th', null, 'Question'), el('th', null, 'Match × weight'), el('th', null, 'Points')); tb.append(head);
  for (const [k, b] of Object.entries(r.breakdown)) {
    const tr = el('tr', b.counted ? null : 'skipped');
    tr.append(el('td', null, BREAKDOWN_LABELS[k]),
      el('td', null, b.counted ? `${b.value.toFixed(2)} × ${b.weight.toFixed(2)}` : 'not answered'),
      el('td', null, b.counted ? (b.value * b.weight).toFixed(3) : '–'));
    tb.append(tr);
  }
  const pts = Object.values(r.breakdown).filter((b) => b.counted).reduce((s, b) => s + b.value * b.weight, 0);
  const tr = el('tr', 'total'); tr.append(el('td', null, 'Match'), el('td', null, `${pts.toFixed(3)} ÷ ${r.totalWeight.toFixed(2)}`), el('td', null, `= ${Math.round(r.score * 100)}%`));
  tb.append(tr);
  det.append(tb);
  det.append(el('p', 'tiny', 'Only answered questions count, so skipping an optional question never lowers the match.'));
  body.append(det);

  body.append(el('div', 'retail', 'Retailer: not verified yet · demo item, no live listing or link'));
  card.append(body);
  return card;
}

function renderResults(data) {
  const p = data.profile;
  $('forWhom').textContent = options.labels.relationships[p.relationship];
  renderSummary(p);

  const s = data.stats;
  const removed = s.excludedAvoid + s.excludedOwned;
  $('stats').textContent = `${s.withinBudget} of ${s.catalogueSize} demo products fit your budget` +
    (removed ? ` · ${removed} removed by your exclusions` : '') + ` · ${s.suitable} matched · showing the top ${data.results.length}`;

  const box = $('results'); box.textContent = '';
  if (data.results.length === 0) {
    box.append(el('div', 'empty', 'No suitable demo products for these answers. Try widening the budget, adding interests or removing an exclusion.'));
  } else if (data.results.length < 3) {
    box.append(el('div', 'empty', `Only ${data.results.length} suitable demo product(s) for these answers. Widen the budget, add interests or remove an exclusion for more ideas.`));
  }
  data.results.forEach((r) => box.append(renderCard(r)));

  const ex = data.excluded;
  $('excludedBox').hidden = ex.length === 0;
  $('excludedBox').open = false;
  $('excludedSummary').textContent = `${ex.length} in-budget item${ex.length === 1 ? ' was' : 's were'} removed because of your answers to Q8–Q9`;
  const list = $('excludedList'); list.textContent = '';
  ex.forEach((e) => { const li = el('li'); li.append(el('strong', null, e.name), document.createTextNode(`: ${e.text}`)); list.append(li); });

  $('notice').textContent = data.notice;
}

async function init() {
  try {
    options = await (await fetch('/api/options')).json();
  } catch (e) {
    document.querySelector('main').textContent = 'Could not load GiftCompass. Start the server with: node server.js';
    return;
  }
  buildQuiz();
  $('startBtn').addEventListener('click', () => goStep(1));
  $('homeLink').addEventListener('click', (e) => { e.preventDefault(); show('welcome'); });
  $('backBtn').addEventListener('click', () => (step === 1 ? show('welcome') : goStep(step - 1)));
  $('nextBtn').addEventListener('click', () => {
    const err = stepError(step);
    if (err) { $('quizError').textContent = err; return; }
    if (step < STEPS) goStep(step + 1); else getRecommendations();
  });
  $('updateBtn').addEventListener('click', () => {
    for (let n = 1; n <= STEPS; n++) { const err = stepError(n); if (err) { goStep(n); $('quizError').textContent = err; return; } }
    getRecommendations();
  });
  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => goStep(Number(b.dataset.edit))));
  $('editBtn').addEventListener('click', () => goStep(1));
  $('restartBtn').addEventListener('click', () => { Object.assign(state, blank()); hasResults = false; show('welcome'); });
}
init();
