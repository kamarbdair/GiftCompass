"use client";

import { useMemo, useState } from "react";
import { ARCHETYPES } from "@/lib/data";
import { getBudget, recommend, relevantCount } from "@/lib/matching";
import type {
  ArchetypeId,
  BudgetId,
  PrefKey,
  Product,
  RefineMode,
} from "@/lib/types";
import { GiftCard } from "../GiftCard";
import { GiftModal } from "../GiftModal";
import { DemoNote, Shell } from "../Shell";

const REFINEMENTS: { id: RefineMode; label: string }[] = [
  { id: "unique", label: "More Unique" },
  { id: "personal", label: "More Personal" },
  { id: "cheaper", label: "Cheaper" },
];

export function ResultsScreen({
  archetype,
  budget,
  prefs,
  recipient,
  occasion,
  onBack,
  onRestart,
  onChangeBudget,
}: {
  archetype: ArchetypeId;
  budget: BudgetId;
  prefs: PrefKey[];
  recipient: string;
  occasion: string;
  onBack: () => void;
  onRestart: () => void;
  onChangeBudget: () => void;
}) {
  const [mode, setMode] = useState<RefineMode>("default");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);

  const vibe = ARCHETYPES[archetype];
  const band = getBudget(budget);

  const gifts = useMemo(
    () => recommend({ archetype, budget, prefs, mode, page }),
    [archetype, budget, prefs, mode, page],
  );

  const totalMatches = useMemo(
    () => relevantCount(archetype, budget),
    [archetype, budget],
  );
  const hasMore = totalMatches > gifts.length;

  return (
    <Shell onBack={onBack} progress={1} maxWidth="max-w-[880px]">
      <div className="gc-fade-up">
        <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          Gifts they would actually love
        </h2>
        <p className="mt-2.5 text-[0.94rem] leading-relaxed text-ink/55">
          For your <span className="font-semibold text-ink/75">{recipient.toLowerCase()}</span>
          {" · "}
          <span className="font-semibold text-ink/75">{occasion.toLowerCase()}</span>
          {" · "}
          <span className="font-semibold text-ink/75">{band.label}</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[0.78rem] font-medium text-ink/45">
            Matched to
          </span>
          {vibe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-clay/25 bg-clay-mist px-3 py-1 text-[0.76rem] font-semibold text-clay"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="gc-fade-up gc-delay-1 mt-6 flex flex-wrap gap-2">
        {REFINEMENTS.map((refinement) => {
          const active = mode === refinement.id;
          return (
            <button
              key={refinement.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setMode(active ? "default" : refinement.id);
                setPage(0);
              }}
              className={`rounded-full border px-4 py-2 text-[0.84rem] font-semibold transition ${
                active
                  ? "border-plum bg-plum text-cream"
                  : "border-ink/12 bg-white/70 text-ink/70 hover:border-plum/40 hover:text-ink"
              }`}
            >
              {refinement.label}
            </button>
          );
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-clay/30 bg-clay-mist px-4 py-2 text-[0.84rem] font-semibold text-clay transition hover:bg-clay hover:text-cream"
          >
            Show More
          </button>
        )}
      </div>

      <div
        key={`${mode}-${page}`}
        className={`mt-7 grid gap-5 ${
          gifts.length === 1 ? "max-w-[380px]" : "sm:grid-cols-2"
        }`}
      >
        {gifts.map((product, i) => (
          <GiftCard
            key={product.id}
            product={product}
            index={i}
            onView={setSelected}
          />
        ))}
      </div>

      {gifts.length < 4 && gifts.length > 0 && (
        <p className="gc-fade-up gc-delay-3 mt-5 text-center text-[0.82rem] leading-relaxed text-ink/50">
          Showing {gifts.length} {gifts.length === 1 ? "gift" : "gifts"} that
          genuinely fit them and your budget. We would rather show fewer than
          pad the list with something they would not want.
        </p>
      )}

      {gifts.length === 0 && (
        <div className="gc-fade-up mt-7 rounded-3xl border border-ink/8 bg-white/70 p-8 text-center">
          <p className="font-display text-[1.25rem] font-semibold leading-snug text-ink">
            We couldn&apos;t find a strong match in this budget yet.
          </p>
          <p className="mx-auto mt-2.5 max-w-[24rem] text-[0.88rem] leading-relaxed text-ink/55">
            Everything we would suggest for {recipient.toLowerCase()} sits
            outside {band.label}. We would rather show nothing than a gift that
            misses.
          </p>
          <button
            type="button"
            onClick={onChangeBudget}
            className="mt-6 rounded-full bg-plum px-7 py-3.5 text-[0.9rem] font-semibold text-cream transition hover:bg-ink"
          >
            Change Budget
          </button>
        </div>
      )}

      <div className="gc-fade-up gc-delay-4 mt-10 rounded-3xl border border-ink/8 bg-white/70 p-6 text-center">
        <p className="font-display text-[1.1rem] font-semibold text-ink">
          Not quite right?
        </p>
        <p className="mx-auto mt-1.5 max-w-[24rem] text-[0.88rem] leading-relaxed text-ink/55">
          Try the refinements above, or start again with a different budget or
          occasion.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-5 rounded-full border border-ink/15 bg-white px-6 py-3 text-[0.88rem] font-semibold text-ink/75 transition hover:border-plum/40 hover:text-ink"
        >
          Start over
        </button>
      </div>

      <div className="mt-8">
        <DemoNote>
          Real products from Saudi retailers, matched to this profile. Prices
          were last checked on 16 September 2026 and may change — check the
          retailer for the latest.
        </DemoNote>
      </div>

      {selected && (
        <GiftModal product={selected} onClose={() => setSelected(null)} />
      )}
    </Shell>
  );
}
