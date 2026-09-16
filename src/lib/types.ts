export type BudgetId =
  | "under-100"
  | "100-250"
  | "250-500"
  | "500-1000"
  | "1000-plus";

export type ArchetypeId =
  | "cozy-creative"
  | "tech-play"
  | "style-glow"
  | "active-outdoors"
  | "cafe-culture";

export type PrefKey = "practical" | "personal" | "unique" | "luxe" | "experiential" | "home";

export type RefineMode = "default" | "unique" | "personal" | "cheaper";

export type Route = "tiktok" | "questions";

export interface Budget {
  id: BudgetId;
  label: string;
  min: number;
  max: number;
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  tagline: string;
  tags: string[];
  accent: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  tags: string[];
  archetype: ArchetypeId;
  why: string;
  prefs: PrefKey[];
}

export interface QuestionOption {
  id: string;
  label: string;
  hint: string;
  scores?: Partial<Record<ArchetypeId, number>>;
  prefs?: PrefKey[];
}

export interface Question {
  id: string;
  prompt: string;
  options: QuestionOption[];
}

export interface Session {
  recipient: string;
  occasion: string;
  budget: BudgetId | null;
  route: Route | null;
  tiktokHandle: string;
  answers: Record<string, string>;
  archetype: ArchetypeId | null;
  prefs: PrefKey[];
}
