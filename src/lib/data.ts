import type { Archetype, Budget, Question } from "./types";

export const RECIPIENTS = [
  "Friend",
  "Partner",
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Colleague",
  "Other",
];

export const OCCASIONS = [
  "Birthday",
  "Graduation",
  "Anniversary",
  "Wedding",
  "Thank You",
  "Just Because",
  "Other",
];

export const BUDGETS: Budget[] = [
  { id: "under-100", label: "Under SAR 100", min: 0, max: 99 },
  { id: "100-250", label: "SAR 100–250", min: 100, max: 250 },
  { id: "250-500", label: "SAR 250–500", min: 250, max: 500 },
  { id: "500-1000", label: "SAR 500–1,000", min: 500, max: 1000 },
  { id: "1000-plus", label: "SAR 1,000+", min: 1000, max: 100000 },
];

export const ARCHETYPES: Record<string, Archetype> = {
  "cozy-creative": {
    id: "cozy-creative",
    name: "Cozy Creative",
    tagline: "Slow mornings, good books, and everything soft.",
    tags: ["Matcha", "Books", "Cozy", "Minimal"],
    accent: "#7f9070",
  },
  "tech-play": {
    id: "tech-play",
    name: "Tech & Play",
    tagline: "A clean setup, good gear, and something to tinker with.",
    tags: ["Gaming", "Technology", "Minimal", "Setup"],
    accent: "#4a2e56",
  },
  "style-glow": {
    id: "style-glow",
    name: "Style & Glow",
    tagline: "Polished, put-together, and quietly luxurious.",
    tags: ["Fashion", "Beauty", "Luxury", "Self-care"],
    accent: "#c4674a",
  },
  "active-outdoors": {
    id: "active-outdoors",
    name: "Active & Outdoors",
    tagline: "Always moving, always planning the next trip.",
    tags: ["Fitness", "Travel", "Outdoors", "Energy"],
    accent: "#5f7d6a",
  },
  "cafe-culture": {
    id: "cafe-culture",
    name: "Café & Culture",
    tagline: "Specialty coffee, sketchbooks, and good company.",
    tags: ["Coffee", "Art", "Social", "Creative"],
    accent: "#a4713d",
  },
};

/**
 * The live catalogue of real, purchasable products lives in ./products.
 * Re-exported here so existing imports keep working unchanged.
 */
export { PRODUCTS } from "./products";

export const QUESTIONS: Question[] = [
  {
    id: "friday",
    prompt: "What is their ideal Friday night?",
    options: [
      { id: "a", label: "Tea, a book, early night", hint: "Quiet and restorative", scores: { "cozy-creative": 3 } },
      { id: "b", label: "Gaming or a new gadget", hint: "Deep in a rabbit hole", scores: { "tech-play": 3 } },
      { id: "c", label: "Dinner somewhere nice", hint: "An excuse to dress up", scores: { "style-glow": 3 } },
      { id: "d", label: "A cafe with friends", hint: "Long conversations", scores: { "cafe-culture": 3 } },
    ],
  },
  {
    id: "weekend",
    prompt: "Pick their weekend energy.",
    options: [
      { id: "a", label: "Slow morning at home", hint: "Nowhere to be", scores: { "cozy-creative": 3 } },
      { id: "b", label: "Trail, gym, or the sea", hint: "Outside and moving", scores: { "active-outdoors": 3 } },
      { id: "c", label: "Cafe hopping", hint: "Sketchbook in bag", scores: { "cafe-culture": 3 } },
      { id: "d", label: "Building or tinkering", hint: "A project on the go", scores: { "tech-play": 3 } },
    ],
  },
  {
    id: "aesthetic",
    prompt: "What is their aesthetic?",
    options: [
      { id: "a", label: "Warm and textured", hint: "Linen, wood, ceramics", scores: { "cozy-creative": 3 } },
      { id: "b", label: "Clean and monochrome", hint: "Minimal, nothing extra", scores: { "tech-play": 2, "cozy-creative": 1 } },
      { id: "c", label: "Polished and elevated", hint: "Always put-together", scores: { "style-glow": 3 } },
      { id: "d", label: "Earthy and practical", hint: "Built to be used", scores: { "active-outdoors": 3 } },
    ],
  },
  {
    id: "spend",
    prompt: "What do they always spend money on?",
    options: [
      { id: "a", label: "Books and candles", hint: "Little comforts", scores: { "cozy-creative": 3 } },
      { id: "b", label: "Tech and upgrades", hint: "The newest thing", scores: { "tech-play": 3 } },
      { id: "c", label: "Skincare and fragrance", hint: "The good stuff", scores: { "style-glow": 3 } },
      { id: "d", label: "Coffee and art supplies", hint: "Fuel and materials", scores: { "cafe-culture": 3 } },
    ],
  },
  {
    id: "timespent",
    prompt: "Where do they spend most of their time?",
    options: [
      { id: "a", label: "Their cosy corner at home", hint: "Blanket, lamp, book", scores: { "cozy-creative": 3 } },
      { id: "b", label: "At their desk or setup", hint: "Screens and gear", scores: { "tech-play": 3 } },
      { id: "c", label: "Out and about", hint: "Rarely sitting still", scores: { "active-outdoors": 2, "style-glow": 1 } },
      { id: "d", label: "In cafes", hint: "Their second home", scores: { "cafe-culture": 3 } },
    ],
  },
  {
    id: "drink",
    prompt: "What is their usual order?",
    options: [
      { id: "a", label: "Matcha latte", hint: "Always matcha", scores: { "cozy-creative": 3 } },
      { id: "b", label: "Specialty coffee, black", hint: "Knows the roaster", scores: { "cafe-culture": 3 } },
      { id: "c", label: "Protein shake", hint: "Post-workout", scores: { "active-outdoors": 2, "tech-play": 1 } },
      { id: "d", label: "Something iced and pretty", hint: "Worth a photo", scores: { "style-glow": 3 } },
    ],
  },
  {
    id: "lightup",
    prompt: "What would make them light up?",
    options: [
      { id: "a", label: "A cosy upgrade for their room", hint: "Softer, warmer", scores: { "cozy-creative": 3 } },
      { id: "b", label: "A gear upgrade", hint: "Better kit", scores: { "tech-play": 2, "active-outdoors": 1 } },
      { id: "c", label: "Something that feels luxurious", hint: "A proper treat", scores: { "style-glow": 3 } },
      { id: "d", label: "Something to make things with", hint: "Creative fuel", scores: { "cafe-culture": 3 } },
    ],
  },
  {
    id: "giftstyle",
    prompt: "When they get a gift, what wins?",
    options: [
      { id: "a", label: "Something practical", hint: "They will use it daily", prefs: ["practical"] },
      { id: "b", label: "Something sentimental", hint: "Meaning over function", prefs: ["personal"] },
      { id: "c", label: "Something unexpected", hint: "They would never pick it themselves", prefs: ["unique"] },
      { id: "d", label: "Something a little luxurious", hint: "A proper treat", prefs: ["luxe"], scores: { "style-glow": 1 } },
    ],
  },
  {
    id: "producttype",
    prompt: "Product or experience person?",
    options: [
      { id: "a", label: "A thing to unwrap", hint: "Nothing beats opening a box", prefs: ["practical"] },
      { id: "b", label: "Something that starts a hobby", hint: "A new thing to get into", prefs: ["experiential"], scores: { "cafe-culture": 1, "cozy-creative": 1 } },
      { id: "c", label: "Something for their space", hint: "Makes home better", prefs: ["home"], scores: { "cozy-creative": 1 } },
      { id: "d", label: "Something for going out", hint: "Comes with them", prefs: ["practical"], scores: { "style-glow": 1, "active-outdoors": 1 } },
    ],
  },
];

/**
 * Fixed, predetermined demo analysis used by the TikTok route.
 * This is illustrative sample data that shows how repost analysis would work.
 * The prototype does not access TikTok and does not read any real account.
 */
export const TIKTOK_DEMO_SIGNALS = [
  { label: "Matcha & cafe drinks", share: 34, note: "12 sample reposts" },
  { label: "Books & reading", share: 27, note: "9 sample reposts" },
  { label: "Cafe culture", share: 23, note: "8 sample reposts" },
  { label: "Cozy / minimal interiors", share: 16, note: "6 sample reposts" },
];

export const TIKTOK_DEMO_ARCHETYPE = "cozy-creative" as const;

export const ANALYSIS_STEPS = [
  "Looking through their interests...",
  "Finding patterns in what they love...",
  "Understanding their style...",
  "Finding the perfect gift...",
];
