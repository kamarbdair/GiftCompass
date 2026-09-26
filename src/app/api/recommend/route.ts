/** POST /api/recommend — the Day 4 pipeline behind an HTTP endpoint.
 *
 *  Body: { persona_id, relationship, occasion, budget_max, days_until_occasion?,
 *          limit?, baseline? }
 *  or:   { persona: <full Persona object>, ... }
 */
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { recommend } from '../../../lib/giftcompass/pipeline.ts';
import type { GiftContext, Persona } from '../../../lib/giftcompass/types.ts';

export const runtime = 'nodejs';

interface Body {
  persona?: Persona;
  persona_id?: string;
  baseline?: boolean;
  relationship?: GiftContext['relationship'];
  occasion?: GiftContext['occasion'];
  budget_max?: number;
  budget_min?: number;
  days_until_occasion?: number;
  limit?: number;
  knows_size?: boolean;
}

function loadPersona(id: string, baseline: boolean): Persona | null {
  const file = path.join(process.cwd(), 'data/personas', `${id}${baseline ? '.baseline' : ''}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Persona;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'body must be JSON' }, { status: 400 });
  }

  const persona = body.persona
    ?? (body.persona_id ? loadPersona(body.persona_id, body.baseline ?? false) : null);

  if (!persona) {
    return NextResponse.json(
      { error: 'provide persona_id (a file in data/personas) or a full persona object' },
      { status: 400 },
    );
  }
  if (!body.relationship || !body.occasion || typeof body.budget_max !== 'number') {
    return NextResponse.json(
      { error: 'relationship, occasion and budget_max are required' },
      { status: 400 },
    );
  }

  const ctx: GiftContext = {
    request_id: `req_${Date.now().toString(36)}`,
    persona_id: persona.persona_id,
    relationship: body.relationship,
    occasion: body.occasion,
    budget_sar: { max: body.budget_max, min: body.budget_min },
    days_until_occasion: body.days_until_occasion,
    delivery_city: 'Jeddah',
    sender_constraints: { knows_size: body.knows_size ?? false },
  };

  try {
    const result = await recommend(persona, ctx, { limit: body.limit ?? 5 });
    return NextResponse.json({
      ...result,
      // Demo catalog: make it impossible to mistake these for live listings.
      disclaimer: 'Prices and availability come from a demo catalog (data_status=demo) and are not live retail data.',
      recommendations: result.recommendations.map((r) => ({
        product_id: r.product.product_id,
        name_en: r.product.name_en,
        name_ar: r.product.name_ar,
        price_sar: r.product.price_sar,
        currency: 'SAR',
        category: r.product.category,
        retailer_hint: r.product.retailer_hint,
        product_url: r.product.product_url,
        data_status: r.product.data_status,
        why: r.why,
        score: r.score,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'pipeline failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
