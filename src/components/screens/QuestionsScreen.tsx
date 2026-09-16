"use client";

import { QUESTIONS } from "@/lib/data";
import { Shell } from "../Shell";

export function QuestionsScreen({
  index,
  answers,
  onAnswer,
  onBack,
}: {
  index: number;
  answers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
  onBack: () => void;
}) {
  const question = QUESTIONS[index];
  const progress = 0.35 + (index / QUESTIONS.length) * 0.3;

  return (
    <Shell onBack={onBack} progress={progress}>
      <div key={question.id} className="gc-fade-up">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-clay">
          Question {index + 1} of {QUESTIONS.length}
        </p>
        <h2 className="mt-3 font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">
          {question.prompt}
        </h2>

        <div className="mt-7 grid gap-3">
          {question.options.map((option, i) => {
            const selected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAnswer(question.id, option.id)}
                aria-pressed={selected}
                className={`gc-fade-up gc-delay-${i + 1} gc-card-hover group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-plum bg-plum text-cream"
                    : "border-ink/10 bg-white/85 hover:border-plum/40"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-[0.82rem] font-bold transition ${
                    selected
                      ? "bg-cream/20 text-cream"
                      : "bg-shell text-ink/45 group-hover:bg-blush group-hover:text-clay"
                  }`}
                >
                  {option.id.toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[0.97rem] font-semibold leading-snug ${
                      selected ? "text-cream" : "text-ink"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`mt-0.5 block text-[0.8rem] ${
                      selected ? "text-cream/65" : "text-ink/45"
                    }`}
                  >
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-7 text-center text-[0.78rem] text-ink/40">
          Tap an answer to continue
        </p>
      </div>
    </Shell>
  );
}
