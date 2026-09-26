/** Builds docs/GiftCompass_5min_Talk.pptx — the Day 5 class presentation. */
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const runs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/evaluation/recommendations.json'), 'utf8'));
const layla = runs.find((r) => r.persona_id === 'psn_layla' && r.system === 'full');
const full = runs.filter((r) => r.system === 'full');
const base = runs.filter((r) => r.system === 'baseline');
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const fullN = sum(full.map((r) => r.recommendations.length));
const baseN = sum(base.map((r) => r.recommendations.length));
const catalogN = fs.readFileSync(path.join(ROOT, 'data/products_demo.csv'), 'utf8').trim().split('\n').length - 1;

// Berry & cream: warm, gift-shaped, and not the default blue.
const BERRY = '6D2E46';
const ROSE = 'A26769';
const CREAM = 'F6EFE8';
const INK = '2B1A20';
const MUTED = '6B5B60';
const WHITE = 'FFFFFF';

const HEAD = 'Cambria';
const BODY = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.33 x 7.5in — set before any slide
pres.author = 'GiftCompass Team';
pres.title = 'GiftCompass — 5 minute talk';

const shadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 2, angle: 90, opacity: 0.12 });

/** Section title used on every light slide. */
function title(slide, text, sub) {
  slide.addText(text, {
    x: 0.7, y: 0.42, w: 12, h: 0.7, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 38, bold: true, color: BERRY,
  });
  if (sub) {
    slide.addText(sub, {
      x: 0.7, y: 1.12, w: 12, h: 0.4, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 15, color: MUTED, italic: true,
    });
  }
}

/** The deck's motif: a berry disc with a number in it. */
function step(slide, n, x, y) {
  slide.addShape(pres.ShapeType.ellipse, {
    x, y, w: 0.48, h: 0.48, fill: { color: BERRY }, line: { color: BERRY, width: 0 },
  });
  slide.addText(String(n), {
    x, y, w: 0.48, h: 0.48, isTextBox: true, margin: 0,
    align: 'center', valign: 'middle', fontFace: HEAD, fontSize: 18, bold: true, color: WHITE,
  });
}

function card(slide, { x, y, w, h, fill }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: fill || CREAM }, line: { color: 'E4D8D0', width: 1 }, shadow: shadow(),
  });
}

// ------------------------------------------------------------------ 1. title
{
  const s = pres.addSlide();
  s.background = { color: BERRY };
  s.addText('GiftCompass', {
    x: 1.0, y: 2.1, w: 11, h: 1.2, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 60, bold: true, color: WHITE,
  });
  s.addText('Understand the recipient first — then find the gift that fits them.', {
    x: 1.05, y: 3.35, w: 10.5, h: 0.6, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 22, color: CREAM,
  });
  s.addShape(pres.ShapeType.ellipse, { x: 1.05, y: 4.35, w: 0.16, h: 0.16, fill: { color: ROSE }, line: { width: 0 } });
  s.addText('Jeddah  ·  prices in SAR  ·  consent-based, no scraping', {
    x: 1.4, y: 4.2, w: 10, h: 0.45, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 15, color: ROSE,
  });
  s.addNotes('30s. GiftCompass recommends gifts by understanding the person receiving them. Jeddah first, prices in SAR. The headline of the week: we redesigned it so it never touches data the recipient has not shared.');
}

// -------------------------------------------------------------- 2. problem
{
  const s = pres.addSlide();
  title(s, 'The problem', 'Buying for someone you know well, and still guessing');
  const items = [
    ['Guesswork', 'You do not know what they would genuinely like.'],
    ['Hours lost', 'Searching store after store for generic ideas.'],
    ['Over budget', 'The one good idea costs more than you can spend.'],
  ];
  items.forEach(([h, b], i) => {
    const x = 0.7 + i * 4.15;
    card(s, { x, y: 2.0, w: 3.8, h: 2.1 });
    step(s, i + 1, x + 0.32, 2.32);
    s.addText(h, {
      x: x + 0.32, y: 2.95, w: 3.2, h: 0.4, isTextBox: true, margin: 0,
      fontFace: HEAD, fontSize: 19, bold: true, color: BERRY,
    });
    s.addText(b, {
      x: x + 0.32, y: 3.35, w: 3.2, h: 0.7, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 14, color: INK,
    });
  });
  s.addText('And more choice makes the decision harder, not easier.', {
    x: 0.7, y: 4.55, w: 12, h: 0.5, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 20, italic: true, color: ROSE,
  });
  s.addNotes('30s. Three failure modes we all recognise. The last one matters most: showing someone two hundred options is not help.');
}

// --------------------------------------------------------- 3. reality check
{
  const s = pres.addSlide();
  title(s, 'What we found out this week', 'The original plan — read their TikTok reposts — is not available to us');
  const rows = [
    ['Platform terms forbid automated collection', '"It is public" is not permission (P4, Fiesler et al.)'],
    ['TikTok\'s Research API is for academics', 'Approved non-profit researchers, not apps. Login Kit gives only a user\'s own posted videos — not likes or reposts.'],
    ['Saudi PDPL requires consent and a stated purpose', 'Royal Decree M/19, enforced by SDAIA since September 2024.'],
  ];
  rows.forEach(([h, b], i) => {
    const y = 1.95 + i * 1.15;
    step(s, i + 1, 0.75, y);
    s.addText(h, {
      x: 1.45, y: y - 0.04, w: 11, h: 0.36, isTextBox: true, margin: 0,
      fontFace: HEAD, fontSize: 19, bold: true, color: INK,
    });
    s.addText(b, {
      x: 1.45, y: y + 0.34, w: 11, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 14, color: MUTED,
    });
  });
  card(s, { x: 0.7, y: 5.5, w: 11.9, h: 0.95, fill: CREAM });
  s.addText('So we designed around consent instead of collection — and the product got better, not worse.', {
    x: 1.05, y: 5.72, w: 11.2, h: 0.5, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 19, bold: true, color: BERRY,
  });
  s.addNotes('50s. This is the pivot of the week. We could not build what we originally drew, and the legal route turned out to give a cleaner design.');
}

// ------------------------------------------------------------- 4. the design
{
  const s = pres.addSlide();
  title(s, 'Consent, not collection', 'The recipient decides what we ever see');
  const cards = [
    ['Quiz is primary', 'The sender answers a few short questions. Always available, no third party, works for everyone. This is the baseline everything else must beat.'],
    ['Gift Profile is optional', 'The recipient opens a link and may donate their own platform export. It is parsed in their browser — we never receive messages, location or login data.'],
    ['Preview, approve, delete', 'They see every interest we inferred and remove what does not fit. The raw file is deleted once the profile is built; only the profile is kept, and it expires.'],
  ];
  cards.forEach(([h, b], i) => {
    const x = 0.7 + i * 4.15;
    card(s, { x, y: 1.95, w: 3.8, h: 3.0 });
    step(s, i + 1, x + 0.32, 2.25);
    s.addText(h, {
      x: x + 0.32, y: 2.88, w: 3.2, h: 0.4, isTextBox: true, margin: 0,
      fontFace: HEAD, fontSize: 18, bold: true, color: BERRY,
    });
    s.addText(b, {
      x: x + 0.32, y: 3.3, w: 3.2, h: 1.5, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 13, color: INK,
    });
  });
  s.addText('The surprise problem: a reusable Gift Profile, built once and shared with family and friends, so a request is not a signal that a gift is coming.', {
    x: 0.7, y: 5.25, w: 11.9, h: 0.6, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 15, color: MUTED, italic: true,
  });
  s.addNotes('45s. Three ideas. The quiz is the primary source, donation is a bonus, and the recipient stays in control throughout. The reusable profile solves the obvious objection: asking ruins the surprise.');
}

// ----------------------------------------------------------- 5. architecture
{
  const s = pres.addSlide();
  title(s, 'Architecture v2');
  s.addImage({
    path: path.join(ROOT, 'docs/day3/architecture-v2.png'),
    x: 0.7, y: 1.45, w: 4.42, h: 5.7,
  });
  const points = [
    ['Consent before signals', 'A collector and a persona builder now sit in front of the engine.'],
    ['Filters before ranking', 'Budget, delivery, age and relationship fit remove candidates first, so nothing unaffordable is ever ranked.'],
    ['Catalog wired in', `${catalogN} demo products with embeddings feed retrieval.`],
    ['Feedback loop', 'Thumbs up and down feed the evaluation set.'],
  ];
  points.forEach(([h, b], i) => {
    const y = 1.75 + i * 1.28;
    step(s, i + 1, 5.65, y);
    s.addText(h, {
      x: 6.35, y: y - 0.02, w: 6.3, h: 0.35, isTextBox: true, margin: 0,
      fontFace: HEAD, fontSize: 18, bold: true, color: BERRY,
    });
    s.addText(b, {
      x: 6.35, y: y + 0.36, w: 6.3, h: 0.7, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 13.5, color: INK,
    });
  });
  s.addNotes('45s. Four changes from our first diagram. The one to call out is filters before ranking — it is the difference between showing a perfect gift you cannot afford and showing one you can.');
}

// --------------------------------------------------------------- 6. persona
{
  const s = pres.addSlide();
  title(s, 'The persona is evidence, not a guess', 'Every interest carries the signals that produced it');
  card(s, { x: 0.7, y: 1.95, w: 6.6, h: 3.1 });
  s.addText([
    { text: '7 x saved      43 days old   ->  4.745\n', options: { breakLine: true } },
    { text: '3 x reposted   58 days old   ->  2.160\n', options: { breakLine: true } },
    { text: '1 x quiz answer              ->  0.850\n', options: { breakLine: true } },
    { text: 'raw = 7.755    weight = raw / (raw + 2) = 0.79', options: { bold: true } },
  ], {
    x: 1.0, y: 2.25, w: 6.0, h: 1.6, isTextBox: true, margin: 0,
    fontFace: 'Courier New', fontSize: 13, color: INK,
  });
  s.addText('matcha  ·  strong', {
    x: 1.0, y: 4.0, w: 3.0, h: 0.5, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 22, bold: true, color: BERRY,
  });
  s.addText('0.79', {
    x: 4.6, y: 3.82, w: 2.4, h: 0.9, isTextBox: true, margin: 0,
    align: 'right', fontFace: HEAD, fontSize: 48, bold: true, color: ROSE,
  });
  const rules = [
    'Posted beats reposted beats liked beats watched.',
    'Interests fade: a 180-day half-life.',
    'One signal can never reach "strong" — only repetition does.',
    '"I hate Twilight" mentions Twilight and is still a no.',
    'Religion, health, politics, sexuality: never inferred.',
  ];
  s.addText(rules.map((r, i) => ({ text: r, options: { bullet: true, breakLine: i < rules.length - 1 } })), {
    x: 7.7, y: 2.05, w: 4.9, h: 3.0, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 14.5, color: INK, paraSpaceAfter: 10,
  });
  s.addNotes('45s. This is the heart of it. A weight is computed from how strong each signal is and how recent, and it saturates, so a single repost is never an interest. Every number can be traced back to the evidence that made it.');
}

// ----------------------------------------------------------- 7. it runs
{
  const s = pres.addSlide();
  title(s, 'It runs', `Best friend · birthday · up to ${layla.context.budget_sar.max} SAR · ${layla.context.days_until_occasion} days`);
  const rows = [[
    { text: '#', options: { bold: true, color: WHITE, fill: { color: BERRY } } },
    { text: 'Gift', options: { bold: true, color: WHITE, fill: { color: BERRY } } },
    { text: 'SAR', options: { bold: true, color: WHITE, fill: { color: BERRY } } },
    { text: 'Why this matches', options: { bold: true, color: WHITE, fill: { color: BERRY } } },
  ]];
  layla.recommendations.forEach((r) => {
    rows.push([
      String(r.rank),
      r.name_en,
      String(r.price_sar),
      r.why.replace(/ At \d+ SAR.*$/, ''),
    ]);
  });
  s.addTable(rows, {
    x: 0.7, y: 1.95, w: 11.9, colW: [0.5, 3.5, 0.9, 7.0],
    fontFace: BODY, fontSize: 12, color: INK, valign: 'middle',
    border: { type: 'solid', color: 'E4D8D0', pt: 1 },
    rowH: 0.42, margin: 0.06,
  });
  s.addText(
    `${catalogN} products  →  50 retrieved  →  ${layla.trace.after_filters} pass the filters  →  ${layla.trace.returned} shown`,
    {
      x: 0.7, y: 5.55, w: 11.9, h: 0.45, isTextBox: true, margin: 0,
      fontFace: HEAD, fontSize: 17, bold: true, color: BERRY,
    },
  );
  s.addText('The milk frother she already owns was filtered out. Three items over 500 SAR were removed before ranking.', {
    x: 0.7, y: 6.0, w: 11.9, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 13.5, color: MUTED, italic: true,
  });
  s.addNotes('50s. A real run, not a mock-up. Five gifts, every one inside budget, every one with a reason the giver can read. Note the last line: it knows what she already has.');
}

// ------------------------------------------------------------ 8. evaluation
{
  const s = pres.addSlide();
  title(s, 'Does the extra data help?', 'Same catalog, same code — the only difference is how much we know about the person');
  card(s, { x: 0.7, y: 1.95, w: 5.8, h: 2.3 });
  s.addText(`${fullN}`, {
    x: 1.05, y: 2.15, w: 2.0, h: 1.0, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 54, bold: true, color: BERRY,
  });
  s.addText('gifts confidently recommended\nwith quiz + donated signals', {
    x: 3.0, y: 2.3, w: 3.2, h: 0.9, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 13.5, color: INK,
  });
  s.addText(`${baseN}`, {
    x: 1.05, y: 3.25, w: 2.0, h: 0.8, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 40, bold: true, color: ROSE,
  });
  s.addText('with the quiz alone', {
    x: 3.0, y: 3.45, w: 3.2, h: 0.5, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 13.5, color: MUTED,
  });
  card(s, { x: 6.85, y: 1.95, w: 5.75, h: 2.3, fill: WHITE });
  s.addText('What we can measure today', {
    x: 7.2, y: 2.12, w: 5.1, h: 0.35, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 16, bold: true, color: BERRY,
  });
  const measured = ['Every result inside budget, every run', 'Coverage of the top interests', 'Category spread', 'How much the two systems differ'];
  s.addText(measured.map((m, i) => ({ text: m, options: { bullet: true, breakLine: i < measured.length - 1 } })), {
    x: 7.2, y: 2.55, w: 5.1, h: 1.6, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 13, color: INK, paraSpaceAfter: 6,
  });
  card(s, { x: 0.7, y: 4.45, w: 11.9, h: 1.85, fill: CREAM });
  s.addText('What we have not done yet', {
    x: 1.05, y: 4.62, w: 11.2, h: 0.35, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 17, bold: true, color: BERRY,
  });
  s.addText('Relevance, delight and embarrassment need human judgement. The harness produced a blind rating sheet — it does not say which system made which suggestion — and three of us will rate every item independently. Those numbers are not in this deck, because we have not collected them yet.', {
    x: 1.05, y: 5.0, w: 11.2, h: 1.1, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 14, color: INK,
  });
  s.addNotes('55s. The measurable result: donated signals mostly do not change the ranking, they increase how many gifts the system is confident enough to show. Be explicit that the human ratings are not collected yet — the sheet is blind and ready.');
}

// ----------------------------------------------------------------- 9. close
{
  const s = pres.addSlide();
  s.background = { color: BERRY };
  s.addText('Understand the person → then the gift', {
    x: 0.9, y: 1.5, w: 11.5, h: 0.9, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 40, bold: true, color: WHITE,
  });
  const next = [
    'Verify catalog prices against live listings before anyone sees them',
    'Swap the keyword persona builder for the LLM one, same schema',
    'Swap TF-IDF for multilingual embeddings — most of our signals are Arabic',
    'Build the receiver Gift Profile flow, then run the human evaluation',
  ];
  s.addText(next.map((n, i) => ({ text: n, options: { bullet: true, breakLine: i < next.length - 1 } })), {
    x: 1.0, y: 2.7, w: 11.0, h: 2.2, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 17, color: CREAM, paraSpaceAfter: 12,
  });
  s.addText('Catalog prices are demo data for development — realistic for Jeddah, but not quoted prices.', {
    x: 1.0, y: 5.6, w: 11.0, h: 0.5, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 13, color: ROSE, italic: true,
  });
  s.addNotes('25s. Close on the one line that describes the product, and be straight about what is still demo data. Then questions.');
}

const out = path.join(ROOT, 'docs/GiftCompass_5min_Talk.pptx');
pres.writeFile({ fileName: out }).then(() => console.log('wrote', path.relative(ROOT, out)));
