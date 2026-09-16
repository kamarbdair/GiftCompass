"use client";

import { DemoNote, Shell } from "../Shell";

export function ChoiceScreen({
  onPick,
  onBack,
}: {
  onPick: (route: "tiktok" | "questions") => void;
  onBack: () => void;
}) {
  return (
    <Shell onBack={onBack} progress={0.35}>
      <div className="gc-fade-up">
        <h2 className="font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-ink">
          How should we get to know them?
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink/55">
          The more we understand them, the better the match.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onPick("tiktok")}
        className="gc-card gc-card-hover gc-fade-up gc-delay-1 mt-8 w-full overflow-hidden rounded-3xl border border-plum/20 bg-gradient-to-br from-plum to-[#3a2344] p-6 text-left text-cream"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-cream/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cream/85">
            Recommended
          </span>
          <svg viewBox="0 0 24 24" className="size-9 shrink-0" aria-hidden="true">
            <path
              d="M15.5 3.5c.5 2.3 2 3.8 4.3 4.1v3c-1.6.1-3.1-.3-4.4-1.2v5.9c0 3.4-2.6 5.9-5.9 5.7-3-.2-5.3-2.7-5.2-5.7.1-3.1 2.8-5.5 5.9-5.3v3.1c-1.5-.4-2.9.7-2.9 2.2 0 1.3 1.1 2.4 2.4 2.3 1.3 0 2.3-1.1 2.3-2.4V3.5Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h3 className="mt-5 font-display text-[1.32rem] font-semibold leading-snug">
          Use TikTok
        </h3>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-cream/70">
          Share their TikTok username and we will use their interests and repost
          patterns to understand what they might love.
        </p>

        <span className="mt-5 inline-flex items-center gap-1.5 text-[0.86rem] font-semibold text-clay-soft">
          Continue with TikTok
          <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
            <path
              d="M7.5 4l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onPick("questions")}
        className="gc-card gc-card-hover gc-fade-up gc-delay-2 mt-4 w-full rounded-3xl border border-ink/10 bg-white/85 p-6 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-[1.22rem] font-semibold leading-snug text-ink">
            Answer Quick Questions
          </h3>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-shell text-clay">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M9 9a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.9v.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17.6" r="1.3" fill="currentColor" />
            </svg>
          </span>
        </div>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/60">
          No TikTok? Tell us a little about them instead. Nine quick taps.
        </p>
      </button>

      <div className="gc-fade-up gc-delay-3 mt-7">
        <DemoNote>
          Hackathon prototype. The TikTok route shows a simulated example
          analysis and does not connect to TikTok.
        </DemoNote>
      </div>
    </Shell>
  );
}
