/** Day 4 — build the persona JSON files from the synthetic signal bundles.
 *  Run: node scripts/build-personas.ts
 *
 *  Produces two personas per recipient:
 *    data/personas/<id>.json            full pipeline (quiz + donated signals)
 *    data/personas/<id>.baseline.json   quiz only, the Day 5 comparison baseline
 */
import fs from 'node:fs';
import path from 'node:path';
import { deterministicPersonaBuilder } from '../src/lib/giftcompass/personaBuilder.ts';
import type { Persona, RawSignal } from '../src/lib/giftcompass/types.ts';

/** Fixed build date so personas are reproducible run to run. */
const BUILT_AT = '2026-09-26T09:00:00Z';

const ROOT = process.cwd();
const signalsDir = path.join(ROOT, 'data/signals');
const personasDir = path.join(ROOT, 'data/personas');
fs.mkdirSync(personasDir, { recursive: true });

interface Bundle {
  persona_id: string;
  recipient_label: string;
  recipient_basics: Persona['recipient_basics'];
  style: Persona['style'];
  already_owns: Persona['already_owns'];
  consent: Persona['consent'];
  signals: RawSignal[];
}

const files = fs.readdirSync(signalsDir).filter((f) => f.endsWith('.json')).sort();
const summary: string[] = [];

for (const file of files) {
  const bundle = JSON.parse(fs.readFileSync(path.join(signalsDir, file), 'utf8')) as Bundle;

  const full = deterministicPersonaBuilder.build({
    persona_id: bundle.persona_id,
    signals: bundle.signals,
    consent: bundle.consent,
    recipient_basics: bundle.recipient_basics,
    style: bundle.style,
    already_owns: bundle.already_owns,
    built_at: BUILT_AT,
  });

  const quizOnly = bundle.signals.filter((s) => s.source === 'quiz' || s.source === 'manual_caption');
  const baseline = deterministicPersonaBuilder.build({
    persona_id: `${bundle.persona_id}_baseline`,
    signals: quizOnly,
    // The sender answered the quiz about the receiver, so consent is
    // sender_about_self and limited to quiz / manual sources.
    consent: {
      ...bundle.consent,
      granted_by: 'sender_about_self',
      receiver_reviewed: false,
      sources: ['quiz'],
    },
    recipient_basics: bundle.recipient_basics,
    style: bundle.style,
    already_owns: bundle.already_owns,
    built_at: BUILT_AT,
  });

  fs.writeFileSync(path.join(personasDir, `${bundle.persona_id}.json`), `${JSON.stringify(full, null, 2)}\n`);
  fs.writeFileSync(path.join(personasDir, `${bundle.persona_id}.baseline.json`), `${JSON.stringify(baseline, null, 2)}\n`);

  const top = full.interests.slice(0, 4).map((i) => `${i.key} ${i.weight}`).join(', ');
  const dis = (full.dislikes ?? []).map((d) => d.key).join(', ') || 'none';
  summary.push(
    `${bundle.persona_id.padEnd(12)} full: ${String(full.interests.length).padStart(2)} interests  `
    + `baseline: ${String(baseline.interests.length).padStart(2)}  dislikes: ${dis}\n`
    + `             top: ${top}`,
  );
}

console.log(`built ${files.length * 2} persona files in data/personas\n`);
console.log(summary.join('\n'));
