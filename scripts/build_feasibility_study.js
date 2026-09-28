/** Builds docs/GiftCompass_Feasibility_Study.docx
 *  Structure follows the TELOS framework (Technical, Economic, Legal,
 *  Operational, Schedule) inside a standard academic report format, with the
 *  proposal elements from the instructor's ProjectManager reference.
 *  Project figures are read from the repo so they cannot drift. */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, PageBreak,
  HeadingLevel, BorderStyle, ShadingType,
} = require('docx');
const K = require('./lib/docx-kit.js');

const { P, H, bullet, code, table, note, docStyles, pageMargins, t } = K;
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

// ---------------------------------------------------------------- live data
const runs = readJson('data/evaluation/recommendations.json');
const full = runs.filter((r) => r.system === 'full');
const base = runs.filter((r) => r.system === 'baseline');
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const fullN = sum(full.map((r) => r.recommendations.length));
const baseN = sum(base.map((r) => r.recommendations.length));
const catalogRows = read('data/products_demo.csv').trim().split('\n');
const catalogN = catalogRows.length - 1;
const prices = catalogRows.slice(1).map((l) => Number(l.split(',')[7])).filter((n) => !Number.isNaN(n));
const meanPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
const taxonomyN = readJson('docs/schemas/interest-taxonomy.json').interests.length;

const SAR_PER_USD = 3.75;
const sar = (usd) => Math.round(usd * SAR_PER_USD);

// --- unit economics, computed once and used everywhere -------------------
const FIXED_USD = 20 + 25 + 15 / 12;
const FIXED_SAR = FIXED_USD * SAR_PER_USD;
const AOV = 250;                 // A6
const VAR_MID = 0.09;            // SAR per session, mid model tier
const VAR_ECON = 0.046;          // SAR per session, economy tier
const revPerSession = (conv, comm) => conv * AOV * comm;
const breakEven = (conv, comm, varCost = VAR_MID) => {
  const contribution = revPerSession(conv, comm) - varCost;
  return contribution > 0 ? Math.round(FIXED_SAR / contribution) : null;
};
const beText = (conv, comm, varCost = VAR_MID) => {
  const n = breakEven(conv, comm, varCost);
  return n === null ? 'never — margin is negative' : `${n.toLocaleString('en-US')} sessions`;
};
const minConversion = (comm, varCost = VAR_MID) => ((varCost / (AOV * comm)) * 100).toFixed(2);
const PLANNING_BE = breakEven(0.015, 0.05);

const d = [];
const p = (...x) => x.forEach((e) => d.push(e));
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ================================================================ title page
p(new Paragraph({ text: '', spacing: { after: 1400 } }));
p(new Paragraph({
  children: [t('FEASIBILITY STUDY', { bold: true, size: 30, color: '6D2E46', characterSpacing: 60 })],
  alignment: AlignmentType.CENTER, spacing: { after: 200 },
}));
p(new Paragraph({
  children: [t('GiftCompass', { bold: true, size: 72, color: '2B1A20' })],
  alignment: AlignmentType.CENTER, spacing: { after: 100 },
}));
p(new Paragraph({
  children: [t('A Consent-Based Personalised Gift Recommendation Platform', { size: 28, color: '4A3A40' })],
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
}));
p(new Paragraph({
  children: [t('for the Jeddah Market, Kingdom of Saudi Arabia', { size: 28, color: '4A3A40' })],
  alignment: AlignmentType.CENTER, spacing: { after: 700 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 14 } },
}));
p(table(['Field', 'Detail'], [
  ['Document type', 'Feasibility Study (TELOS framework)'],
  ['Project', 'GiftCompass'],
  ['Prepared by', '[Team member names]'],
  ['Student IDs', '[Student IDs]'],
  ['Course', '[Course code and title]'],
  ['Instructor', '[Instructor name]'],
  ['Institution', '[University / College / Department]'],
  ['Date of submission', '[Submission date]'],
  ['Version', '1.0'],
], [3000, 6000]));
p(note('Fields in square brackets are to be completed by the team before submission.'));
p(pageBreak());

// ================================================================ contents
p(H('Table of Contents', HeadingLevel.HEADING_1));
const toc = [
  ['1', 'Executive Summary'],
  ['2', 'Introduction — background, purpose, scope and methodology'],
  ['3', 'Project Description'],
  ['4', 'Market Feasibility'],
  ['5', 'Technical Feasibility'],
  ['6', 'Economic and Financial Feasibility'],
  ['7', 'Legal and Regulatory Feasibility'],
  ['8', 'Operational Feasibility'],
  ['9', 'Schedule Feasibility'],
  ['10', 'Risk Assessment'],
  ['11', 'Alternatives Considered'],
  ['12', 'Conclusion and Recommendation'],
  ['13', 'References'],
  ['A', 'Appendix A — Assumptions Register'],
  ['B', 'Appendix B — Evidence from the Working Prototype'],
  ['C', 'Appendix C — Glossary'],
];
p(table(['Section', 'Title'], toc, [1400, 7600]));
p(note('Sections 5 to 9 correspond to the five dimensions of the TELOS feasibility framework: Technical, Economic, Legal, Operational and Schedule. Market feasibility (Section 4) is included as an additional dimension because the project is a commercial proposition rather than an internal system.'));
p(pageBreak());

// ================================================================ 1. exec
p(H('1. Executive Summary', HeadingLevel.HEADING_1));
p(P('GiftCompass is a web platform that recommends gifts by first building a structured understanding of the person receiving the gift, then matching that understanding to products available in Jeddah within the giver\'s budget. This study assesses whether the project is feasible across six dimensions: market, technical, economic, legal, operational and schedule.'));
p(P([t('Overall finding: the project is feasible, with one qualification. ', { bold: true }),
  t('Technical, legal, operational and schedule feasibility are all assessed as high, supported by a working prototype that runs end to end and by a data-collection design built to satisfy the Saudi Personal Data Protection Law. Economic feasibility is assessed as moderate: the cost base is very low, but revenue depends on affiliate conversion rates that the team has not yet been able to measure.')]));
p(P([t('The decisive finding of the study is that the original product concept was not legally available. ', { bold: true }),
  t('GiftCompass was conceived around reading a recipient\'s TikTok reposts. Platform terms prohibit automated collection, TikTok\'s Research API is restricted to approved academic researchers rather than applications, and profiling a person without their consent conflicts with the PDPL. The project was therefore redesigned around consent: a short questionnaire answered by the giver is the primary data source, and any richer signal is donated voluntarily by the recipient. This redesign is the principal contribution of the study.')]));
p(table(['Dimension', 'Rating', 'Basis'], [
  ['Market', 'Feasible', 'A city of approximately 5.7 million people, near-universal internet penetration, and a national e-commerce sector growing 13.6% year on year. No direct competitor identified that models the recipient rather than the occasion.'],
  ['Technical', 'High', `A working prototype exists: ${catalogN} catalogued products, ${fullN} recommendations generated across five test recipients, 14 automated tests passing, and every architectural layer implemented.`],
  ['Economic', 'Moderate, with a threshold condition', `Fixed cost is approximately SAR ${Math.round(FIXED_SAR)} per month and variable cost SAR ${VAR_MID.toFixed(2)} per session. Break-even in the planning case is about ${PLANNING_BE.toLocaleString('en-US')} sessions per month. Because cost is incurred per session but revenue only per purchase, the platform does not break even at any volume unless conversion exceeds a threshold — see Section 6.4.`],
  ['Legal', 'High, conditional', 'Consent, purpose limitation, data minimisation, retention limits and a sensitive-attribute prohibition are implemented in the data model itself. Conditional on completing SDAIA registration obligations before public launch.'],
  ['Operational', 'High', 'A five-person student team can operate the platform. The one recurring operational burden is catalogue maintenance, quantified in Section 8.'],
  ['Schedule', 'High', 'The core engine was built and evaluated within a five-day cycle. A twelve-week plan to public beta is presented in Section 9.'],
], [1400, 1700, 5900]));
p(P('The study recommends proceeding to a limited public beta in Jeddah, subject to three conditions stated in Section 12: verification of catalogue pricing against live retail listings, completion of the PDPL compliance checklist, and a measured conversion rate obtained from a pilot before any revenue projection is relied upon.'));
p(pageBreak());

// ================================================================ 2. intro
p(H('2. Introduction', HeadingLevel.HEADING_1));
p(H('2.1 Background', HeadingLevel.HEADING_2));
p(P('Choosing a gift is a common decision that people routinely find difficult. The giver knows the recipient but cannot translate that knowledge into a purchase; online gift guides are organised by occasion and price rather than by person, so they return generic suggestions; and a promising idea is often discovered to be outside the intended budget only after time has been spent on it. The result is a gift that is safe rather than suitable.'));
p(P('GiftCompass proposes to invert the usual order. Rather than asking the giver to browse a catalogue, the platform first constructs a structured profile of the recipient — their interests, the strength of each interest, and what they would not want — and then searches the catalogue against that profile, filtered by the giver\'s budget and by the nature of the relationship.'));

p(H('2.2 Purpose and objectives of this study', HeadingLevel.HEADING_2));
p(P('The purpose of this feasibility study is to determine whether GiftCompass can be built, operated, funded and lawfully offered in Jeddah, and to identify the conditions under which it should proceed. Its specific objectives are:'));
p(bullet('To establish whether a market exists for a recipient-centred gift recommender in Jeddah, and how the proposition differs from existing alternatives.'));
p(bullet('To determine whether the system can be built with the skills, tools and time available to the team.'));
p(bullet('To estimate the cost of building and operating the platform, and the revenue conditions under which it would be sustainable.'));
p(bullet('To assess whether the data the platform depends on can be obtained lawfully under Saudi law and under the terms of the platforms concerned.'));
p(bullet('To assess whether the team can operate the platform once it is live.'));
p(bullet('To produce a schedule that reaches a public beta within the academic timeframe, and to identify the risks to that schedule.'));

p(H('2.3 Scope of the study', HeadingLevel.HEADING_2));
p(table(['Within scope', 'Outside scope'], [
  ['Feasibility of a web platform serving individual gift buyers in Jeddah.', 'Physical retail operations, warehousing, inventory or delivery logistics.'],
  ['A recommendation engine operating over a curated product catalogue.', 'Operating as a marketplace or processing payments. GiftCompass refers the buyer to the seller.'],
  ['Consent-based collection of recipient preference data.', 'Any collection of data without the data subject\'s consent, and any form of automated scraping.'],
  ['Affiliate and merchant-partnership revenue.', 'Advertising-funded or subscription-funded models, which are noted as future options only.'],
  ['The Jeddah market as the initial launch market.', 'National or Gulf-wide expansion, treated as a later phase.'],
], [4500, 4500]));

p(H('2.4 Methodology', HeadingLevel.HEADING_2));
p(P('This study applies the TELOS framework — Technical, Economic, Legal, Operational and Schedule feasibility — which is a standard structure for assessing information-system projects. A market feasibility section is added because the project is a commercial proposition rather than an internal system. The report format follows the project-proposal structure recommended in the reference supplied by the course instructor, which specifies an executive summary, a project description with defined scope and deliverables, resource and budget estimates, a schedule, and a statement of risks.'));
p(P('Evidence was gathered from four sources:'));
p(table(['Source', 'Used for', 'Strength'], [
  ['A working prototype built by the team', 'Technical feasibility, operational cost, performance evidence', 'Strong. Claims about what the system can do are demonstrated rather than asserted.'],
  ['Primary legal sources: PDPL and SDAIA implementing regulations; platform developer documentation', 'Legal feasibility', 'Strong for the statutory position; platform terms change frequently and were verified in September 2026.'],
  ['Published market and industry statistics', 'Market feasibility', 'Moderate. Published estimates of the Saudi e-commerce market vary widely between sources, as discussed in Section 4.2.'],
  ['Published list prices for infrastructure and model services', 'Economic feasibility', 'Strong for costs. Revenue assumptions are unverified and are identified as such throughout.'],
], [2600, 3200, 3200]));
p(note('A note on evidential honesty. This study distinguishes throughout between measured figures, published figures and assumptions. Every assumption carries an identifier (A1, A2, …) and is collected in Appendix A with its basis and its sensitivity. No figure in this report is presented as measured unless the team measured it.'));
p(pageBreak());

// ================================================================ 3. description
p(H('3. Project Description', HeadingLevel.HEADING_1));
p(H('3.1 Problem statement', HeadingLevel.HEADING_2));
p(P('How can an individual in Jeddah find a gift that genuinely suits the person receiving it, within a budget they have set, without searching through hundreds of generic options?'));

p(H('3.2 Proposed solution', HeadingLevel.HEADING_2));
p(P('A web application that collects three pieces of context from the giver — the relationship, the occasion and the budget in Saudi Riyals — then builds a structured profile of the recipient, and returns up to five specific gift suggestions, each with a short explanation of why it was chosen and a link to the seller.'));
p(P('The recipient profile is built from one of two sources. The primary source is a short questionnaire answered by the giver. The optional richer source is a "Gift Profile" that the recipient creates themselves: they open a link, choose what to share, review the interests the system has inferred, remove anything that does not represent them, and approve. Both routes produce the same structured profile, so the rest of the system is identical in either case.'));

p(H('3.3 Objectives and success criteria', HeadingLevel.HEADING_2));
p(table(['Objective', 'Success criterion'], [
  ['Recommend gifts that suit the recipient', 'Mean relevance of at least 1.5 on a 0–2 scale, rated by independent assessors'],
  ['Respect the budget without exception', '100% of recommendations at or below the stated budget'],
  ['Avoid socially inappropriate suggestions', 'No recommendation rated embarrassing for the stated relationship'],
  ['Reduce effort for the giver', 'A complete journey from landing page to recommendations in under three minutes'],
  ['Operate lawfully', 'No personal data processed without a recorded consent; no sensitive attribute inferred or stored'],
  ['Operate sustainably', 'Revenue covering operating cost within twelve months of public launch'],
], [3800, 5200]));

p(H('3.4 Deliverables', HeadingLevel.HEADING_2));
p(table(['#', 'Deliverable', 'Status at the date of this study'], [
  ['D1', 'Recipient profile data model and product data model, published as JSON Schemas', 'Complete'],
  ['D2', 'Product catalogue for the Jeddah market', `Complete as development data (${catalogN} items); pricing not yet verified against live listings`],
  ['D3', 'Recommendation engine: retrieval, filtering, ranking, explanation', 'Complete and tested'],
  ['D4', 'Consent and privacy design, including bilingual consent text', 'Design complete; user interface not yet built'],
  ['D5', 'Evaluation of recommendation quality against a baseline', 'Complete as a single-rater pilot'],
  ['D6', 'Public-facing web application', 'Not started — the current interface is a placeholder'],
  ['D7', 'Recipient Gift Profile flow (invite link, in-browser parsing, approval screen)', 'Not started; conditional on the platform assessment in Section 7.3'],
], [600, 4200, 4200]));
p(pageBreak());

// ================================================================ 4. market
p(H('4. Market Feasibility', HeadingLevel.HEADING_1));
p(H('4.1 Target market', HeadingLevel.HEADING_2));
p(P('The initial market is individuals resident in Jeddah who buy gifts for other people. The platform is not restricted by the giver\'s age or gender, nor by the type of relationship. Occasions include birthdays, graduations, weddings, anniversaries, Eid, professional achievements and gifts given for no particular occasion.'));
p(table(['Indicator', 'Figure', 'Relevance'], [
  ['Population of Jeddah', 'Approximately 5.71 million', 'The addressable population of the launch city.'],
  ['Internet penetration, Saudi Arabia', 'Approximately 99%', 'Access is not a barrier to adoption.'],
  ['5G coverage, Saudi Arabia', 'Approximately 78%', 'A mobile-first design is appropriate.'],
  ['Growth in e-commerce sales', '13.6% year on year (GASTAT E-commerce Sales Index, Q1 2026)', 'Online purchasing is growing faster than the wider retail sector.'],
], [2400, 2800, 3800]));

p(H('4.2 Market size and the limits of published estimates', HeadingLevel.HEADING_2));
p(P('Published estimates of the Saudi e-commerce market differ by more than an order of magnitude. Sources consulted for this study placed the 2025–2026 market at approximately USD 19 billion, USD 28–31 billion, and USD 251 billion respectively. The divergence reflects differing definitions — whether business-to-business trade, digital services and travel are included — rather than genuine disagreement about consumer retail.'));
p(P([t('This study therefore does not present a single market-size figure, and does not derive a revenue forecast from one. ', { bold: true }),
  t('A top-down estimate built on a number that varies by a factor of thirteen between sources would convey false precision. The economic analysis in Section 6 is built bottom-up instead, from unit costs the team can verify and conversion assumptions that are explicitly labelled as unverified.')]));

p(H('4.3 Competitive landscape', HeadingLevel.HEADING_2));
p(table(['Alternative', 'How it works', 'Limitation GiftCompass addresses'], [
  ['General marketplaces (Amazon.sa, Noon)', 'Search and browse, with gift categories and price filters', 'Organised by product, not by person. The buyer must already know what they are looking for.'],
  ['Occasion-based gift guides and blogs', 'Editorial lists: "20 gifts for her under 200 SAR"', 'Generic by construction. The same list is served to every reader.'],
  ['Retailer gift finders', 'Filter by recipient type, price band and occasion', 'A small number of coarse categories; no model of the individual recipient.'],
  ['Asking the recipient directly', 'A wish list, or simply asking', 'Effective, but removes the surprise. GiftCompass addresses this through the reusable Gift Profile.'],
  ['Gift cards', 'Transfer of choice to the recipient', 'Widely seen as impersonal; the giver signals no knowledge of the recipient.'],
], [2200, 3200, 3600]));
p(P('No direct competitor was identified in the Saudi market that builds a structured, evidence-based profile of the recipient and recommends against it. The nearest analogue in the research literature is Shopycat, a social-media-powered gift recommender developed at Walmart, which is not a commercial product available in this market.'));

p(H('4.4 Differentiation and competitive position', HeadingLevel.HEADING_2));
p(bullet('Recipient-centred rather than occasion-centred: the system models the person, not the date.'));
p(bullet('Budget respected as a hard constraint rather than as a filter applied after the fact.'));
p(bullet('Relationship-aware: a gift appropriate for a partner is filtered out for a colleague.'));
p(bullet('Explained recommendations: every suggestion states the evidence behind it, which builds the giver\'s confidence.'));
p(bullet('Consent-based by design, which is a defensible market position in a jurisdiction actively enforcing data protection law.'));
p(bullet('Bilingual and local: Arabic and English signals both handled, prices in Saudi Riyals, availability assessed for Jeddah.'));
p(P([t('Market feasibility assessment: feasible. ', { bold: true }),
  t('The population, connectivity and e-commerce growth of the launch city support the proposition, and no direct competitor occupies the recipient-modelling position. The principal market risk is not competition but demand: it is not yet established how many people will use a dedicated tool rather than searching a marketplace directly. Section 10 records this as risk R1.')]));
p(pageBreak());

// ================================================================ 5. technical
p(H('5. Technical Feasibility', HeadingLevel.HEADING_1));
p(P('Technical feasibility is the dimension on which this study has the strongest evidence, because the core of the system has already been built and measured rather than merely specified.'));

p(H('5.1 System architecture', HeadingLevel.HEADING_2));
const png = fs.readFileSync(path.join(ROOT, 'docs/day3/architecture-v2.png'));
p(new Paragraph({
  children: [new ImageRun({ data: png, type: 'png', transformation: { width: 430, height: 555 } })],
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 },
}));
p(new Paragraph({
  children: [t('Figure 1 — GiftCompass system architecture. Each numbered layer is an independently replaceable module.', { italics: true, size: 18, color: '64748B' })],
  alignment: AlignmentType.CENTER, spacing: { after: 200 },
}));
p(P('Two design decisions carry most of the technical risk reduction. First, hard constraints — budget, delivery time, age suitability, relationship appropriateness — are applied before ranking rather than after, so an unaffordable or inappropriate item is never a candidate. Second, each layer communicates through a published schema, so a layer can be replaced without disturbing the others.'));

p(H('5.2 Technology stack', HeadingLevel.HEADING_2));
p(table(['Layer', 'Technology', 'Justification'], [
  ['Web application', 'Next.js (App Router), TypeScript, Tailwind CSS', 'One language and one deployment for a small team; server-side routes remove the need for a separate backend service.'],
  ['Recommendation engine', 'TypeScript modules, one per architectural layer', 'Deterministic, inspectable and unit-testable. No model is required for the scoring logic.'],
  ['Profile construction', 'Rule-based today; a large language model in JSON mode is the intended production implementation', 'The interface is defined, so the two implementations are interchangeable.'],
  ['Retrieval', 'TF-IDF cosine similarity today; multilingual sentence embeddings intended', 'Same interface. The upgrade path does not affect any other layer.'],
  ['Data storage', 'CSV and JSON files today; PostgreSQL with the pgvector extension when scale requires it', 'Free hosted tiers are adequate for a pilot.'],
  ['Hosting', 'Managed application hosting with a managed database', 'No infrastructure administration burden on a student team.'],
], [1900, 3100, 4000]));

p(H('5.3 Evidence from the prototype', HeadingLevel.HEADING_2));
p(P('The following results were produced by running the implemented system, not by estimation.'));
p(table(['Measure', 'Result'], [
  ['Products in the catalogue', `${catalogN}, across 12 categories and all five budget bands`],
  ['Interest vocabulary shared between profiles and products', `${taxonomyN} interest keys, each with at least one matching product`],
  ['Recommendations generated', `${fullN} across five test recipients (full pipeline); ${baseN} from the questionnaire-only baseline`],
  ['Budget compliance', `${fullN + baseN} of ${fullN + baseN} recommendations at or below the stated budget`],
  ['Automated tests', '14, all passing, covering the weighting formula, every filter condition and the no-padding rule'],
  ['Mean relevance rating', '1.52 (full pipeline) against 1.58 (baseline), 0–2 scale, single-rater pilot'],
  ['Recommendations rated socially inappropriate', '0 of 30'],
  ['Response time, complete pipeline', 'Under one second per request on a development machine'],
], [3400, 5600]));

p(H('5.4 Technical constraints and open items', HeadingLevel.HEADING_2));
p(table(['Constraint', 'Status and treatment'], [
  ['Recipient TikTok activity cannot be read programmatically', 'Confirmed by the platform assessment in Section 7.3. Addressed by the consent-based redesign; the system does not depend on it.'],
  ['Profile construction is currently rule-based', 'Functional but limited: it cannot read tone or context. The production implementation is defined behind an interface and is a substitution, not a rewrite.'],
  ['Retrieval is lexical, not semantic', 'Synonyms are invisible to the current encoder. The same substitution argument applies.'],
  ['Catalogue prices are development data', 'Prices are realistic for Jeddah but unverified. The system already refuses to display an unverified item when configured to require verification. This is a launch gate, recorded as condition C1 in Section 12.'],
  ['Interest taxonomy granularity', 'Evaluation identified one interest key covering two unrelated activities, which produced the study\'s only two poor recommendations. A known, bounded catalogue fix.'],
], [3000, 6000]));
p(P([t('Technical feasibility assessment: high. ', { bold: true }),
  t('Every architectural layer is implemented and tested, the system runs end to end, and the two components that are currently simplified are isolated behind interfaces that make their replacement a substitution rather than a redesign.')]));
p(pageBreak());

// ================================================================ 6. economic
p(H('6. Economic and Financial Feasibility', HeadingLevel.HEADING_1));
p(P('All figures in this section are in Saudi Riyals. Amounts published in United States Dollars are converted at the pegged rate of SAR 3.75 to USD 1.00. Each assumption is identified and collected in Appendix A.'));

p(H('6.1 Development cost', HeadingLevel.HEADING_2));
p(P('The project is built by a student team, so development consumes no cash. For completeness the notional labour cost is stated, since a commercial sponsor would incur it.'));
p(table(['Item', 'Basis', 'Cash cost', 'Notional cost'], [
  ['Team labour to date', '5 members × approximately 120 hours (A1), at SAR 50 per hour for junior development work (A2)', 'SAR 0', 'SAR 30,000'],
  ['Software and tooling', 'Open-source frameworks; free tiers of hosting and database services', 'SAR 0', 'SAR 0'],
  ['Product catalogue construction', 'Approximately 25 hours of manual curation (A3)', 'SAR 0', 'SAR 1,250'],
  ['Total development', '', 'SAR 0', 'SAR 31,250'],
], [2300, 3400, 1600, 1700]));

p(H('6.2 Operating cost', HeadingLevel.HEADING_2));
p(P('Operating cost has a fixed monthly component and a variable per-request component.'));
p(table(['Fixed item', 'Basis', 'Monthly cost'], [
  ['Application hosting', 'Managed hosting, paid tier, USD 20 per month', `SAR ${sar(20)}`],
  ['Managed database', 'Hosted PostgreSQL, paid tier, USD 25 per month', `SAR ${sar(25)}`],
  ['Domain name', 'Approximately USD 15 per year', `SAR ${sar(15 / 12)}`],
  ['Total fixed', '', `SAR ${sar(20 + 25 + 15 / 12)} per month`],
], [2600, 4200, 2200]));
p(note('A pilot can run entirely on the free tiers of both services, reducing fixed cost to the domain name alone. The paid tiers are costed here because free tiers carry usage limits that a public launch would exceed.'));

p(P('The variable cost is the language-model call made when a recipient profile is built and when recommendations are explained. Published list prices per million tokens are USD 1.00 input and USD 5.00 output for the economy model tier, and USD 2.00 input and USD 10.00 output for the mid tier (A4).', { before: 140 }));
p(table(['Operation', 'Tokens (A5)', 'Economy tier', 'Mid tier'], [
  ['Build one recipient profile', '2,000 in / 800 out', 'SAR 0.023', 'SAR 0.045'],
  ['Rank and explain one set of recommendations', '3,000 in / 600 out', 'SAR 0.023', 'SAR 0.045'],
  ['One complete new-user journey', '', 'SAR 0.046', 'SAR 0.090'],
  ['One repeat request against an existing profile', '', 'SAR 0.023', 'SAR 0.045'],
], [3200, 2000, 1900, 1900]));
p(P('This study uses the mid tier at SAR 0.09 per complete journey as the planning figure, which is the conservative of the two. Prompt caching of the fixed instruction and schema would reduce it further and is not assumed here.'));

p(H('6.3 Revenue model', HeadingLevel.HEADING_2));
p(table(['Stream', 'Mechanism', 'Availability'], [
  ['Affiliate commission', 'A commission is earned when a user follows a recommendation and completes a purchase at the retailer. Published rates run from 1% to 10% by category on Amazon.sa, and from 4% on Noon.', 'Available at launch; the primary stream.'],
  ['Merchant partnerships', 'Local gift retailers and brands supply product data and pay for inclusion in the catalogue.', 'Requires a user base first. Phase 2.'],
  ['Sponsored placement', 'Paid promotion of products that already match the recipient.', 'Excluded from the current design. Payment must never move an irrelevant product above a better match.'],
  ['Premium features', 'Paid features for frequent givers.', 'Not required for viability. Noted as a future option.'],
], [2000, 4600, 2400]));

p(H('6.4 Unit economics and the conversion threshold', HeadingLevel.HEADING_2));
p(P('The analysis is built bottom-up from a single completed session. One structural feature of the business model drives everything that follows: cost is incurred on every session, because a recommendation is produced whether or not anything is bought, while revenue arrives only on the sessions that end in a purchase.'));
p(table(['Line', 'Value', 'Source'], [
  ['Mean catalogue price', `SAR ${meanPrice}`, `Measured across the ${catalogN}-item catalogue`],
  ['Assumed average order value', `SAR ${AOV}`, 'A6 — approximates the catalogue mean'],
  ['Assumed blended commission rate', '5%', 'A7 — mid-point of published category rates'],
  ['Commission per conversion', `SAR ${(AOV * 0.05).toFixed(2)}`, 'Calculated'],
  ['Assumed session-to-purchase conversion', '1.5%', 'A8 — the least certain figure in this study'],
  ['Revenue per session', `SAR ${revPerSession(0.015, 0.05).toFixed(4)}`, 'Calculated'],
  ['Variable cost per session', `SAR ${VAR_MID.toFixed(2)}`, 'Section 6.2'],
  ['Contribution per session', `SAR ${(revPerSession(0.015, 0.05) - VAR_MID).toFixed(4)}`, 'Calculated'],
  ['Fixed cost per month', `SAR ${Math.round(FIXED_SAR)}`, 'Section 6.2'],
  ['Break-even volume', `${PLANNING_BE.toLocaleString('en-US')} sessions per month (about ${Math.round(PLANNING_BE / 30)} per day)`, 'Calculated'],
], [3000, 2600, 3400]));

p(P([t('The threshold condition. ', { bold: true }),
  t('Because the variable cost is charged per session and the commission is earned per purchase, there is a minimum conversion rate below which each additional session loses money and no volume can produce a profit. That minimum is the variable cost divided by the commission per conversion:')]), { before: 140 });
p(...code([
  'minimum conversion = variable cost per session / (average order value x commission rate)',
  '',
  `  at 3% commission:  SAR ${VAR_MID.toFixed(2)} / SAR ${(AOV * 0.03).toFixed(2)} = ${minConversion(0.03)}%`,
  `  at 5% commission:  SAR ${VAR_MID.toFixed(2)} / SAR ${(AOV * 0.05).toFixed(2)} = ${minConversion(0.05)}%`,
  `  at 8% commission:  SAR ${VAR_MID.toFixed(2)} / SAR ${(AOV * 0.08).toFixed(2)} = ${minConversion(0.08)}%`,
]));
p(P('This is the most important economic finding in the study, and it is a finding about structure rather than about scale. Growth does not rescue a negative contribution margin; it multiplies it.', { before: 120 }));

p(H('6.5 Sensitivity analysis', HeadingLevel.HEADING_2));
p(P('Monthly sessions required to cover fixed cost, across the plausible range of both uncertain inputs:'));
p(table(['Conversion rate', 'Commission 3%', 'Commission 5%', 'Commission 8%'], [
  ['0.5% (pessimistic)', beText(0.005, 0.03), beText(0.005, 0.05), beText(0.005, 0.08)],
  ['1.5% (planning case)', beText(0.015, 0.03), beText(0.015, 0.05), beText(0.015, 0.08)],
  ['3.0% (optimistic)', beText(0.03, 0.03), beText(0.03, 0.05), beText(0.03, 0.08)],
], [2400, 2200, 2200, 2200]));
p(P('Two of the nine cases never break even. Both are in the pessimistic row, and both are cases where the commission earned on a purchase is too small to pay for the sessions that did not convert.'));

p(H('6.6 Levers available if conversion is low', HeadingLevel.HEADING_2));
p(P('The threshold is not fixed. It falls as the variable cost falls, and the variable cost is under the team\'s control:'));
p(table(['Lever', 'Effect on cost per session', 'Effect on the threshold at 5% commission'], [
  ['Use the economy model tier rather than the mid tier', `SAR ${VAR_MID.toFixed(2)} to SAR ${VAR_ECON.toFixed(3)}`, `${minConversion(0.05)}% to ${minConversion(0.05, VAR_ECON)}%`],
  ['Cache the fixed instruction and schema across requests', 'Reduces input tokens, which are the larger share', 'Further reduction, not quantified here'],
  ['Reuse a stored profile instead of rebuilding it', 'Roughly halves the cost of a repeat request', 'Applies to returning users only'],
  ['Serve the deterministic path without a model call', 'Removes the variable cost entirely', 'No threshold at all; the prototype already runs this way'],
], [3000, 3000, 3000]));
p(P([t('The last row deserves emphasis. ', { bold: true }),
  t('The prototype in its current form makes no model call at all: profile construction and ranking are deterministic. A version that runs this way has no meaningful variable cost, so it breaks even at roughly ' + (Math.round(FIXED_SAR / revPerSession(0.005, 0.03))).toLocaleString('en-US') + ' sessions per month even in the pessimistic case. The model-based implementation is an improvement to quality that the business model must be able to afford, not a requirement for the platform to function.')]));

p(P([t('Economic feasibility assessment: moderate, with a threshold condition. ', { bold: true }),
  t('Costs are verified, low, and controllable. The platform breaks even at modest volume in the planning case. But the structure of the model — pay per session, earn per purchase — means viability depends on clearing a minimum conversion rate rather than merely reaching scale, and that rate has not been measured. The appropriate response is not a more elaborate forecast but a pilot that produces the number, recorded as condition C3 in Section 12.')]));
p(pageBreak());

// ================================================================ 7. legal
p(H('7. Legal and Regulatory Feasibility', HeadingLevel.HEADING_1));
p(P('Legal feasibility received disproportionate attention in this study because the original product concept did not survive it.'));

p(H('7.1 The Personal Data Protection Law', HeadingLevel.HEADING_2));
p(P('The Saudi Personal Data Protection Law, issued under Royal Decree No. M/19, is administered by the Saudi Data and Artificial Intelligence Authority (SDAIA). Its implementing regulations were issued in 2023 and full enforcement began on 14 September 2024. SDAIA is actively enforcing: by January 2026 it had issued 48 decisions confirming violations by data controllers.'));
p(table(['Requirement', 'Application to GiftCompass'], [
  ['Lawful basis, normally consent', 'The recipient is the data subject, but the giver is the user. Profiling the recipient from social data without their consent has no lawful basis. This is the finding that forced the redesign.'],
  ['Purpose limitation', 'Data may be used only for gift recommendation. The purpose is recorded in the profile itself as a required field.'],
  ['Data minimisation', 'Only fields relevant to gift preference are retained. Messages, location, login history and device data are discarded.'],
  ['Sensitive personal data', 'Religion, health, political opinion and similar categories attract the strictest treatment. GiftCompass does not infer, store or use them at all.'],
  ['Retention limitation', 'Profiles carry an expiry date and are deleted at it. Raw uploaded files are deleted once the profile is built.'],
  ['Data subject rights', 'The recipient reviews every inferred interest before approval, may remove any of them, and may delete the profile at any time.'],
], [2600, 6400]));
p(P('Penalties are material. Administrative fines reach SAR 5 million and may be doubled for repeat violations. Under Article 35, disclosing or publishing sensitive personal data in violation of the law with intent to harm the data subject or to obtain personal benefit carries imprisonment of up to two years, a fine of up to SAR 3 million, or both.'));

p(H('7.2 Compliance measures already implemented', HeadingLevel.HEADING_2));
p(P('Compliance is enforced in the data model and in code rather than stated in a policy document alone:'));
p(bullet('Consent is a required field of the recipient profile: who consented, to what purpose, through which sources, and when. The recommendation engine refuses to process a profile without a recorded consent.'));
p(bullet('A prohibited-attribute list is written into every profile and is covered by an automated test that fails if a sensitive attribute appears anywhere outside that list.'));
p(bullet('A donated data file is parsed in the recipient\'s own browser. The server receives only the approved interest list.'));
p(bullet('Raw uploads are deleted once the profile is built, and the deletion is recorded as a field that must be true before the profile is reused.'));
p(bullet('Every profile carries an expiry date, implementing storage limitation automatically.'));
p(bullet('Consent text has been drafted in Arabic and English.'));

p(H('7.3 Platform terms of service', HeadingLevel.HEADING_2));
p(table(['Platform', 'Position', 'Decision'], [
  ['TikTok — automated collection', 'Prohibited by the terms of service. Public availability of content does not constitute permission.', 'Excluded.'],
  ['TikTok — Research API', 'Restricted to approved non-profit academic researchers in eligible jurisdictions; not available to applications.', 'Not available to this project.'],
  ['TikTok — Login Kit and Display API', 'With the account owner\'s authorisation, provides basic profile information and the owner\'s own posted videos. Does not provide likes or reposts.', 'Optional, weak signal.'],
  ['TikTok — data export by the owner', 'The account owner may request their own data and choose to share it. This is data donation, an established research method.', 'Adopted as the optional enrichment route.'],
  ['Pinterest, Spotify', 'User-authorised OAuth access to boards, pins, top artists and genres.', 'Future optional sources.'],
  ['Snapchat, X, Instagram', 'Identity data only, paid access, or restricted to business accounts respectively.', 'Not used.'],
], [2200, 4300, 2500]));

p(H('7.4 Residual legal obligations before launch', HeadingLevel.HEADING_2));
p(bullet('Confirm whether the platform meets the criteria for controller registration with SDAIA, and register if so.'));
p(bullet('Publish a privacy notice in Arabic and English meeting the disclosure requirements of the implementing regulations.'));
p(bullet('Establish a breach-notification procedure.'));
p(bullet('Complete a records-of-processing register.'));
p(bullet('Obtain a legal review of the consent text before it is shown to the public. This study is prepared by students and is not legal advice.'));
p(P([t('Legal feasibility assessment: high, conditional. ', { bold: true }),
  t('The redesigned data model is built to satisfy the PDPL, and the requirements are enforced mechanically rather than only in policy. Feasibility is conditional on completing the registration and disclosure obligations listed above, recorded as condition C2 in Section 12.')]));
p(pageBreak());

// ================================================================ 8. operational
p(H('8. Operational Feasibility', HeadingLevel.HEADING_1));
p(H('8.1 Operating model', HeadingLevel.HEADING_2));
p(P('GiftCompass is a discovery and recommendation platform, not a retailer. It holds no stock, ships nothing and processes no payment. The user is referred to the seller and the transaction takes place there. This removes the operational burdens that would otherwise dominate a gift business — inventory, fulfilment, returns and payment disputes — and is the single most important reason the project is operationally feasible for a student team.'));

p(H('8.2 Organisation and responsibilities', HeadingLevel.HEADING_2));
p(table(['Role', 'Responsibility', 'Assigned to'], [
  ['Frontend and user experience', 'Web application, gift context screens, results and feedback interface', '[Name]'],
  ['Consent and privacy', 'Gift Profile flow, consent records, retention and deletion, PDPL compliance', '[Name]'],
  ['Profile construction', 'Profile builder, interest taxonomy, model integration', '[Name]'],
  ['Catalogue and data', 'Product catalogue, verification of pricing, embeddings and storage', '[Name]'],
  ['Recommendation engine', 'Retrieval, filtering, ranking, explanations, evaluation', '[Name]'],
], [2400, 4600, 2000]));

p(H('8.3 Recurring operational workload', HeadingLevel.HEADING_2));
p(P('The one genuine ongoing burden is catalogue maintenance. Prices and availability change; a catalogue that is not maintained degrades into exactly the problem the platform exists to solve.'));
p(table(['Task', 'Frequency', 'Estimated effort (A9)'], [
  ['Verify prices and availability of catalogue items', 'Monthly', '6–8 hours'],
  ['Add new products and seasonal items', 'Monthly', '3–4 hours'],
  ['Review user feedback and act on poor recommendations', 'Weekly', '1–2 hours'],
  ['Handle data subject requests (access, deletion)', 'As they arrive', 'Under 1 hour each'],
  ['Monitor availability and errors', 'Continuous, automated', 'Negligible'],
  ['Total recurring', 'Monthly', 'Approximately 15–20 hours'],
], [3600, 2200, 3200]));
p(P('This is within the capacity of a five-person team and is the workload that a merchant-partnership arrangement would most usefully reduce, since partners would supply and maintain their own product data.'));

p(H('8.4 Adoption and user-side operation', HeadingLevel.HEADING_2));
p(bullet('The primary route requires nothing of the recipient: the giver answers a short questionnaire. This matters because any flow depending on the recipient\'s participation will lose most users.'));
p(bullet('The Gift Profile is designed to be reusable — built once by the recipient, shared with family and friends — so a request does not reveal that a gift is imminent.'));
p(bullet('If the recipient does not respond, the system falls back to the questionnaire without failing.'));
p(P([t('Operational feasibility assessment: high. ', { bold: true }),
  t('The referral model removes the heavy operational burdens, the recurring workload is quantified and modest, and the product degrades gracefully when the optional data is unavailable.')]));
p(pageBreak());

// ================================================================ 9. schedule
p(H('9. Schedule Feasibility', HeadingLevel.HEADING_1));
p(H('9.1 Work completed', HeadingLevel.HEADING_2));
p(P('The data model, recommendation engine, catalogue and evaluation were designed, built and assessed within a structured five-day cycle, which provides a measured basis for the estimates that follow rather than an assumed velocity.'));
p(table(['Stage', 'Work', 'Outcome'], [
  ['1', 'Literature review and gap analysis', 'Nine gaps identified against the initial design'],
  ['2', 'Data sources, consent and privacy', 'Primary and fallback sources chosen; consent flow and privacy rules defined'],
  ['3', 'Architecture, schemas and catalogue', `Architecture v2, two JSON Schemas, ${catalogN}-item catalogue`],
  ['4', 'Prototype pipeline', 'End-to-end engine, five test recipients, 14 passing tests'],
  ['5', 'Evaluation', 'Comparison against a baseline; results in Section 5.3'],
], [800, 4000, 4200]));

p(H('9.2 Plan to public beta', HeadingLevel.HEADING_2));
p(table(['Week', 'Phase', 'Activity', 'Milestone'], [
  ['1–2', 'Interface', 'Landing page, gift context screens, results and feedback interface', 'M1 — a user can complete a journey in the browser'],
  ['3–4', 'Catalogue', 'Verify prices against live listings; mark verified rows; expand to 300 items', 'M2 — catalogue cleared for public display'],
  ['5–6', 'Compliance', 'Privacy notice, SDAIA registration assessment, records of processing, legal review of consent text', 'M3 — compliance checklist complete'],
  ['7–8', 'Enrichment', 'Model-based profile builder; multilingual retrieval; split the over-broad interest key', 'M4 — improved profile quality demonstrated against the same test set'],
  ['9', 'Evaluation', 'Repeat evaluation with three independent raters', 'M5 — quality baseline established'],
  ['10–11', 'Pilot', 'Closed pilot in Jeddah, 50–100 users, affiliate links live', 'M6 — conversion rate measured'],
  ['12', 'Review', 'Assess pilot results against the success criteria in Section 3.3', 'M7 — decision on public launch'],
], [900, 1700, 4100, 2300]));

p(H('9.3 Critical path and schedule risks', HeadingLevel.HEADING_2));
p(P('The critical path runs through catalogue verification (weeks 3–4) and compliance (weeks 5–6). Neither can be compressed by adding people: verification is limited by the rate at which listings can be checked, and compliance depends on an external legal review. The pilot in weeks 10–11 cannot begin before both are complete, because it is the first activity that exposes real users to real product data.'));
p(P('The enrichment phase in weeks 7–8 is not on the critical path. If it slips, the pilot can proceed with the current rule-based profile builder, which the evaluation shows already produces usable recommendations.'));
p(P([t('Schedule feasibility assessment: high. ', { bold: true }),
  t('The twelve-week plan is built on measured delivery rather than assumed velocity, the critical path is short, and the one phase that might slip has been deliberately kept off it.')]));
p(pageBreak());

// ================================================================ 10. risk
p(H('10. Risk Assessment', HeadingLevel.HEADING_1));
p(P('Likelihood and impact are rated Low, Medium or High. Exposure is the combination of the two.'));
p(table(['ID', 'Risk', 'Like.', 'Impact', 'Mitigation'], [
  ['R1', 'Insufficient demand: users search a marketplace directly instead of using a dedicated tool', 'Medium', 'High', 'Measure in the closed pilot before any investment in scale. The low cost base means the platform can run while demand is tested.'],
  ['R2', 'Conversion rate falls below the pessimistic case', 'Medium', 'High', 'Free tiers keep fixed cost near zero; pursue merchant partnerships, which do not depend on conversion.'],
  ['R3', 'Catalogue prices drift from actual retail prices', 'High', 'Medium', 'Monthly verification cycle; the verification flag prevents unverified rows from being displayed; move to merchant-supplied data.'],
  ['R4', 'Platform terms change and remove a data source', 'Medium', 'Low', 'The product does not depend on any social platform. The primary source is the questionnaire.'],
  ['R5', 'Regulatory non-compliance', 'Low', 'High', 'Compliance enforced in the data model; registration and disclosure obligations completed before launch; legal review of consent text.'],
  ['R6', 'Recommendation quality insufficient to retain users', 'Medium', 'High', 'Measured against a baseline and re-measured after each change; feedback loop in the product; known taxonomy fix identified.'],
  ['R7', 'Recipients decline to create a Gift Profile', 'High', 'Low', 'By design the system works without it. The reusable profile reduces the social awkwardness of the request.'],
  ['R8', 'Key team member unavailable', 'Medium', 'Medium', 'Every layer documented and schema-defined; no undocumented component.'],
  ['R9', 'Model service cost or availability changes', 'Low', 'Low', 'The model sits behind an interface; the deterministic path works without it, as the current prototype demonstrates.'],
  ['R10', 'A recommendation causes social embarrassment', 'Low', 'Medium', 'Relationship-specific thresholds applied as a hard filter; no item was rated embarrassing in evaluation.'],
], [500, 3000, 800, 800, 3900]));
p(P('Risks R1 and R2 are the material ones, and both concern demand rather than delivery. This is the correct risk profile for a project of this kind: the team can build the product, and the open question is whether people will use it.'));

// ================================================================ 11. alternatives
p(H('11. Alternatives Considered', HeadingLevel.HEADING_1));
p(table(['Alternative', 'Assessment', 'Decision'], [
  ['Scrape recipients\' public social profiles', 'Technically possible; prohibited by platform terms and without lawful basis under the PDPL. Exposes the project to administrative fines of up to SAR 5 million.', 'Rejected on legal grounds.'],
  ['Require every recipient to create a profile before any recommendation', 'Produces the richest data but makes the product unusable when the recipient does not respond, and removes the surprise.', 'Rejected; made optional instead.'],
  ['Build a marketplace with payment and fulfilment', 'Higher revenue per transaction but requires inventory, logistics, payment licensing and returns handling.', 'Rejected as beyond team capacity.'],
  ['Licence an existing recommendation engine', 'Faster to build, but general-purpose engines model purchase history, not a third party the buyer is shopping for.', 'Rejected as a poor fit for the problem.'],
  ['Occasion-based gift guide with no personalisation', 'Far simpler, but is the product whose weakness motivates the project.', 'Rejected.'],
  ['Consent-based profile with a questionnaire fallback', 'Lawful, operable, works when the recipient does not participate, and preserves the option of richer data.', 'Adopted.'],
], [2400, 4400, 2200]));

// ================================================================ 12. conclusion
p(H('12. Conclusion and Recommendation', HeadingLevel.HEADING_1));
p(H('12.1 Summary of findings', HeadingLevel.HEADING_2));
p(table(['Dimension', 'Rating', 'Principal evidence'], [
  ['Market', 'Feasible', 'Population of 5.71 million in the launch city, 99% internet penetration, 13.6% annual e-commerce growth, no direct competitor identified'],
  ['Technical', 'High', 'Working prototype, 14 passing tests, every layer implemented, measured results'],
  ['Economic', 'Moderate, conditional', `Fixed cost SAR ${Math.round(FIXED_SAR)} per month, variable cost SAR ${VAR_MID.toFixed(2)} per session, break-even near ${PLANNING_BE.toLocaleString('en-US')} sessions per month in the planning case; viability requires conversion above ${minConversion(0.05)}% at a 5% commission`],
  ['Legal', 'High, conditional', 'PDPL requirements implemented in the data model; registration and disclosure obligations outstanding'],
  ['Operational', 'High', 'Referral model avoids inventory and fulfilment; recurring workload 15–20 hours per month'],
  ['Schedule', 'High', 'Twelve-week plan to public beta built on measured delivery'],
], [1500, 1700, 5800]));

p(H('12.2 Recommendation', HeadingLevel.HEADING_2));
p(P([t('The study recommends that GiftCompass proceed to a closed pilot in Jeddah, subject to three conditions.', { bold: true })]));
p(table(['Ref', 'Condition', 'Rationale'], [
  ['C1', 'Verify catalogue prices and availability against live retail listings, and display only verified items', 'The platform\'s credibility depends on a recommendation being purchasable at the price shown. The mechanism already exists; the data work does not.'],
  ['C2', 'Complete the PDPL obligations in Section 7.4, including a legal review of the consent text', 'Enforcement is active and penalties are material. The design is sound; the formal steps are outstanding.'],
  ['C3', 'Measure the conversion rate in the pilot before relying on any revenue projection', 'It is the least certain figure in this study and the one that determines viability. No published figure can substitute for a measurement on this product.'],
], [500, 3500, 5000]));
p(P('The project should not proceed to a public launch, nor should any revenue figure in Section 6 be treated as a forecast, until C3 has produced a measured number.'));

p(H('12.3 Concluding remark', HeadingLevel.HEADING_2));
p(P('The most valuable outcome of this study was a negative finding. The original concept — inferring a person\'s tastes from their social media activity without involving them — was not available, for reasons that were legal and contractual rather than technical. Establishing that early, and redesigning around consent, converted the project\'s greatest risk into one of its stronger features: a platform that asks permission is both lawful in the Kingdom and more defensible to the people whose preferences it models.'));
p(pageBreak());

// ================================================================ 13. references
p(H('13. References', HeadingLevel.HEADING_1));
p(P('Sources are grouped by the section that relies on them. Online sources were consulted in September 2026.'));
p(P('Methodology and report structure', { run: { bold: true }, before: 140 }));
p(bullet('ProjectManager (2026) How to Write a Project Proposal (Examples & Template Included). Available at: https://www.projectmanager.com/blog/how-to-create-a-project-proposal (Reference supplied by the course instructor.)'));
p(bullet('Feasibility study — TELOS framework (Technical, Economic, Legal, Operational, Schedule). Standard framework for information-system feasibility assessment.'));
p(P('Legal and regulatory', { run: { bold: true }, before: 140 }));
p(bullet('Kingdom of Saudi Arabia, Personal Data Protection Law, Royal Decree No. M/19, and the Implementing Regulations issued by the Saudi Data and Artificial Intelligence Authority (SDAIA), 2023; full enforcement from 14 September 2024.'));
p(bullet('Saudi Personal Data Protection Law, Article 35 — penalties for disclosure or publication of sensitive personal data.'));
p(bullet('TikTok for Developers — Display API and Login Kit documentation; Research API eligibility criteria.'));
p(bullet('Pinterest Developers — authentication and authorisation scopes. Spotify for Developers — Web API quota and development-mode documentation.'));
p(P('Market and commercial', { run: { bold: true }, before: 140 }));
p(bullet('General Authority for Statistics (GASTAT), Kingdom of Saudi Arabia — E-commerce Sales Index, Q1 2026, and population estimates.'));
p(bullet('Industry analyses of the Saudi e-commerce market, 2025–2026. Note: estimates vary substantially between sources, as discussed in Section 4.2.'));
p(bullet('Amazon.sa Associates Programme — published commission rates by category. Noon affiliate programme — published commission terms.'));
p(bullet('Anthropic — published model pricing per million tokens (list prices, September 2026).'));
p(P('Academic sources informing the system design', { run: { bold: true }, before: 140 }));
p(bullet('Gift recommendation systems: a review. Electronic Commerce Research, 2023. doi: 10.1007/s10660-023-09790-6'));
p(bullet('Pavlidis, A. et al. (2012) Anatomy of a gift recommendation engine powered by social media. ACM SIGMOD \'12, pp. 757–764. doi: 10.1145/2213836.2213950'));
p(bullet('Kosinski, M., Stillwell, D. and Graepel, T. (2013) Private traits and attributes are predictable from digital records of human behavior. PNAS, 110(15).'));
p(bullet('Fiesler, C., Beard, N. and Keegan, B. (2020) No Robots, Spiders, or Scrapers: Legal and Ethical Regulation of Data Collection Methods in Social Media Terms of Service. ICWSM, 14(1). doi: 10.1609/icwsm.v14i1.7290'));
p(bullet('Boeschoten, L. et al. (2022) A framework for privacy preserving digital trace data collection through data donation. Computational Communication Research, 4(2).'));
p(bullet('Zannettou, S. et al. (2024) Analyzing User Engagement with TikTok\'s Short Format Video Recommendations using Data Donations. CHI \'24. doi: 10.1145/3613904.3642433'));
p(bullet('Wu, L. et al. (2024) A survey on large language models for recommendation. World Wide Web, 27(5), 60. doi: 10.1007/s11280-024-01291-2'));
p(P('Project documentation', { run: { bold: true }, before: 140 }));
p(bullet('GiftCompass project reports: Research Findings and Gap Analysis; Data Sources, Consent and Privacy; Architecture v2, Schemas and Catalogue; Prototype Pipeline; Evaluation; Final Design Document.'));
p(pageBreak());

// ================================================================ appendix A
p(H('Appendix A — Assumptions Register', HeadingLevel.HEADING_1));
p(P('Every assumption used in this study, its basis, and what happens if it is wrong. Figures described as measured elsewhere in the report do not appear here.'));
p(table(['ID', 'Assumption', 'Basis', 'If it is wrong'], [
  ['A1', 'Team labour to date is approximately 120 hours per member', 'Team estimate', 'Affects the notional cost only; no cash impact'],
  ['A2', 'Junior development labour valued at SAR 50 per hour', 'Indicative rate for student-level work', 'Affects the notional cost only'],
  ['A3', 'Catalogue construction took approximately 25 hours', 'Team estimate', 'Affects the notional cost only'],
  ['A4', 'Model list prices of USD 1–2 per million input tokens and USD 5–10 per million output tokens', 'Published list prices, September 2026', 'A doubling changes the per-journey cost from SAR 0.09 to SAR 0.18, which does not alter the conclusion'],
  ['A5', 'Approximately 5,000 tokens per complete user journey', 'Derived from prototype prompt and schema sizes', 'A 50% underestimate raises the per-journey cost to SAR 0.135'],
  ['A6', 'Average order value of SAR 250', 'Approximates the measured catalogue mean of SAR ' + meanPrice, 'Revenue per session scales proportionally'],
  ['A7', 'Blended commission rate of 5%', 'Mid-point of published category rates (1–10% Amazon.sa, from 4% Noon)', 'Covered by the sensitivity analysis in Section 6.5'],
  ['A8', 'Session-to-purchase conversion of 1.5%', 'Assumption. Not measured, and not derived from a comparable product', 'The least certain figure in this study. Covered by Section 6.5 and addressed by condition C3'],
  ['A9', 'Recurring operational workload of 15–20 hours per month', 'Estimated from the effort of building the current catalogue', 'A doubling remains within team capacity'],
], [500, 2600, 3200, 2700]));

// ================================================================ appendix B
p(H('Appendix B — Evidence from the Working Prototype', HeadingLevel.HEADING_1));
p(P('The technical feasibility assessment rests on a system that runs. This appendix records a complete worked example produced by that system, so the assessment can be checked rather than taken on trust.'));
const layla = full.find((r) => r.persona_id === 'psn_layla');
p(P(`Request: a birthday gift for a best friend, budget up to ${layla.context.budget_sar.max} SAR, occasion in ${layla.context.days_until_occasion} days.`, { before: 140 }));
p(P(`Recipient profile constructed from the available signals: ${layla.persona_interests.slice(0, 4).map((i) => `${i.key} (weight ${i.weight})`).join(', ')}. Recorded dislike: ${layla.dislikes.join(', ') || 'none'}.`));
p(P(`Pipeline: ${catalogN} catalogue items, ${layla.trace.retrieved} retrieved by similarity, ${layla.trace.after_filters} surviving the hard filters, ${layla.trace.returned} presented. Items removed by filter: ${Object.entries(layla.trace.filter_drops).map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`).join(', ')}.`));
p(table(['#', 'Recommendation', 'SAR', 'Stated reason'],
  layla.recommendations.map((r) => [String(r.rank), r.name_en, String(r.price_sar), r.why]),
  [450, 2400, 700, 5450]));
p(note('Catalogue prices are development data: realistic for the Jeddah market but not verified against live listings. Condition C1 in Section 12 addresses this before any public display.'));

// ================================================================ appendix C
p(H('Appendix C — Glossary', HeadingLevel.HEADING_1));
p(table(['Term', 'Definition'], [
  ['Affiliate commission', 'A payment made by a retailer to a referring site when a referred visitor completes a purchase.'],
  ['Data donation', 'A method in which a person requests their own data from a platform and chooses to share part of it, rather than a third party collecting it.'],
  ['Giftability', 'A score expressing how well an interest or product works as a gift, as distinct from how well it matches the person.'],
  ['Hard filter', 'A condition that removes a candidate entirely, applied before ranking, rather than reducing its score.'],
  ['PDPL', 'The Personal Data Protection Law of the Kingdom of Saudi Arabia, Royal Decree No. M/19.'],
  ['Recipient profile', 'A structured record of a recipient\'s interests, each with a weight and the evidence supporting it.'],
  ['SDAIA', 'The Saudi Data and Artificial Intelligence Authority, the regulator administering the PDPL.'],
  ['Sensitive personal data', 'Categories of data attracting the strictest protection under the PDPL, including religion, health and political opinion. GiftCompass does not process them.'],
  ['TELOS', 'A feasibility framework covering Technical, Economic, Legal, Operational and Schedule dimensions.'],
], [2000, 7000]));

const doc = new Document({
  creator: 'GiftCompass Team',
  title: 'GiftCompass — Feasibility Study',
  description: 'Feasibility study for a consent-based personalised gift recommendation platform for the Jeddah market',
  styles: docStyles,
  sections: [{ ...pageMargins, children: d }],
});
const out = path.join(ROOT, 'docs/GiftCompass_Feasibility_Study.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('wrote', path.relative(ROOT, out), buf.length, 'bytes');
});
