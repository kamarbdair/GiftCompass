/** Shared types for the GiftCompass recommendation pipeline.
 *  These mirror docs/schemas/*.json — the schemas stay the source of truth. */

export type SignalType =
  | 'posted' | 'reposted' | 'saved' | 'liked' | 'followed' | 'watched'
  | 'quiz_answer' | 'manual_caption';

export type SourceType = 'quiz' | 'manual_caption' | 'tiktok_export' | 'pinterest' | 'spotify';

/** Signal strength ladder from the task brief: what someone posts is stronger
 *  evidence than what they merely watched. */
export const SIGNAL_STRENGTH: Record<SignalType, number> = {
  posted: 1.0,
  reposted: 0.9,
  quiz_answer: 0.85,
  saved: 0.8,
  manual_caption: 0.7,
  liked: 0.6,
  followed: 0.55,
  watched: 0.3,
};

export const HALF_LIFE_DAYS = 180;

/** One normalized signal, whatever source it came from. Layer 2 output. */
export interface RawSignal {
  text: string;
  source: SourceType;
  signal_type: SignalType;
  observed_at: string;
  count?: number;
}

export interface Evidence {
  source: SourceType;
  signal_type: SignalType;
  excerpt?: string;
  observed_at: string;
  count: number;
}

export interface Interest {
  key: string;
  label_en: string;
  label_ar: string;
  weight: number;
  strength: 'strong' | 'medium' | 'weak';
  sentiment: 'positive' | 'neutral';
  giftability: number;
  confidence: number;
  evidence: Evidence[];
}

export interface Dislike {
  key: string;
  label_en: string;
  reason: 'negative_sentiment' | 'stated_dislike' | 'allergy_or_restriction_declared' | 'receiver_removed';
  source: SourceType | 'receiver_edit';
}

export type AgeRange =
  | 'under_12' | '12_17' | '18_24' | '25_34' | '35_44' | '45_54' | '55_plus' | 'unknown';

export interface Persona {
  persona_id: string;
  schema_version: '1.0.0';
  created_at: string;
  expires_at?: string;
  locale?: 'ar-SA' | 'en-SA' | 'en';
  consent: {
    consent_given: boolean;
    granted_by: 'receiver' | 'sender_about_self';
    purpose: 'gift_recommendation';
    consent_version: string;
    granted_at: string;
    receiver_reviewed?: boolean;
    sources: SourceType[];
    raw_data_deleted?: boolean;
    revocable_until?: string;
  };
  recipient_basics?: { age_range?: AgeRange; city?: string; life_stage?: string };
  interests: Interest[];
  dislikes?: Dislike[];
  style?: {
    aesthetics?: string[];
    practical_vs_sentimental?: number;
    product_vs_experience?: number;
  };
  already_owns?: { label: string; interest_key?: string }[];
  blocked_attributes?: string[];
  provenance: {
    builder: string;
    built_at: string;
    signal_count: number;
    source_mix?: Record<string, number>;
    completeness?: number;
    is_fallback?: boolean;
  };
}

export type Relationship =
  | 'friend' | 'best_friend' | 'partner' | 'mother' | 'father' | 'sister'
  | 'brother' | 'relative' | 'colleague' | 'classmate' | 'other';

export type Occasion =
  | 'birthday' | 'graduation' | 'anniversary' | 'wedding' | 'achievement'
  | 'thank_you' | 'just_because' | 'eid' | 'new_job' | 'get_well' | 'other';

export type BudgetBand = 'under_100' | '100_250' | '250_500' | '500_1000' | '1000_plus';

export interface GiftContext {
  request_id: string;
  persona_id?: string | null;
  relationship: Relationship;
  occasion: Occasion;
  budget_sar: { band?: BudgetBand; min?: number; max: number; includes_delivery?: boolean };
  days_until_occasion?: number;
  delivery_city?: string;
  sender_constraints?: {
    experiences_ok?: boolean;
    diy_ok?: boolean;
    knows_size?: boolean;
    exclude_categories?: string[];
  };
}

export interface Product {
  product_id: string;
  name_en: string;
  name_ar: string;
  category: string;
  tags: string[];
  interest_keys: string[];
  style_tags: string[];
  price_sar: number;
  currency: string;
  budget_band: BudgetBand;
  age_min: number;
  age_max: number;
  occasions: string[];
  relationship_fit: string[];
  giftability: number;
  embarrassment_risk: number;
  novelty: number;
  is_experience: boolean;
  personalizable: boolean;
  requires_size: boolean;
  available_in_jeddah: boolean;
  delivery_days: number;
  retailer_hint: string;
  product_url: string | null;
  image_url: string | null;
  data_status: 'demo' | 'verified';
  verified_at: string | null;
  notes: string | null;
}

export interface ScoreBreakdown {
  interest_match: number;
  giftability: number;
  budget_fit: number;
  novelty: number;
  embarrassment_risk: number;
  total: number;
  matched_keys: string[];
  top_key: string | null;
  cosine: number;
}

export interface Recommendation {
  product: Product;
  score: ScoreBreakdown;
  why: string;
}

export interface PipelineResult {
  request: GiftContext;
  persona_id: string;
  recommendations: Recommendation[];
  trace: {
    catalog_size: number;
    retrieved: number;
    after_filters: number;
    filter_drops: Record<string, number>;
    returned: number;
    llm_rerank: boolean;
  };
}
