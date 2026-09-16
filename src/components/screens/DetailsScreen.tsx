"use client";

import { BUDGETS, OCCASIONS, RECIPIENTS } from "@/lib/data";
import type { BudgetId } from "@/lib/types";
import { Chip, PrimaryButton, SectionLabel, Shell } from "../Shell";

export function DetailsScreen({
  recipient,
  occasion,
  budget,
  onChange,
  onBack,
  onNext,
}: {
  recipient: string;
  occasion: string;
  budget: BudgetId | null;
  onChange: (patch: {
    recipient?: string;
    occasion?: string;
    budget?: BudgetId;
  }) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const ready = Boolean(recipient && occasion && budget);

  return (
    <Shell onBack={onBack} progress={0.2}>
      <div className="gc-fade-up">
        <h2 className="font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-ink">
          Tell us the basics
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink/55">
          Three quick things, then we will get to know them.
        </p>
      </div>

      <section className="gc-fade-up gc-delay-1 mt-9">
        <SectionLabel>Who is it for?</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {RECIPIENTS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={recipient === option}
              onClick={() => onChange({ recipient: option })}
            />
          ))}
        </div>
      </section>

      <section className="gc-fade-up gc-delay-2 mt-8">
        <SectionLabel>What is the occasion?</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={occasion === option}
              onClick={() => onChange({ occasion: option })}
            />
          ))}
        </div>
      </section>

      <section className="gc-fade-up gc-delay-3 mt-8">
        <SectionLabel>What is your budget?</SectionLabel>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {BUDGETS.map((option) => {
            const selected = budget === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ budget: option.id })}
                className={`rounded-2xl border px-4 py-3.5 text-left text-[0.9rem] font-semibold transition-all duration-200 ${
                  selected
                    ? "border-clay bg-clay text-cream shadow-[0_10px_24px_-12px_rgba(196,103,74,0.9)] -translate-y-px"
                    : "border-ink/12 bg-white/70 text-ink/75 hover:border-clay/45 hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="gc-fade-up gc-delay-4 mt-10">
        <PrimaryButton onClick={onNext} disabled={!ready}>
          Continue
        </PrimaryButton>
        {!ready && (
          <p className="mt-3 text-center text-[0.78rem] text-ink/40">
            Pick one from each to continue
          </p>
        )}
      </div>
    </Shell>
  );
}
