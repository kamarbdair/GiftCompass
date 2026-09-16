"use client";

import { ARCHETYPES, TIKTOK_DEMO_SIGNALS } from "@/lib/data";
import type { ArchetypeId } from "@/lib/types";
import { DemoNote, PrimaryButton, Shell } from "../Shell";

export function VibeScreen({
  archetype,
  route,
  handle,
  onBack,
  onNext,
}: {
  archetype: ArchetypeId;
  route: "tiktok" | "questions";
  handle: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const vibe = ARCHETYPES[archetype];
  const cleanHandle = handle.replace(/^@+/, "").trim();

  return (
    <Shell onBack={onBack} progress={0.82}>
      <div className="gc-pop text-center">
        <h2 className="font-display text-[1.9rem] font-semibold leading-tight tracking-tight text-ink">
          We found their vibe <span className="inline-block">✨</span>
        </h2>
        <p className="mx-auto mt-2.5 max-w-[22rem] text-[0.94rem] leading-relaxed text-ink/55">
          {vibe.tagline}
        </p>
      </div>

      <div className="gc-fade-up gc-delay-1 mt-7 flex flex-wrap justify-center gap-2.5">
        {vibe.tags.map((tag, i) => (
          <span
            key={tag}
            className={`gc-pop gc-delay-${i + 2} rounded-full border border-clay/25 bg-clay-mist px-4 py-2 text-[0.88rem] font-semibold text-clay`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="gc-fade-up gc-delay-4 mt-8 rounded-3xl border border-ink/8 bg-white/85 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
            {route === "tiktok" ? "What we picked up" : "What your answers showed"}
          </p>
          <span className="rounded-full bg-shell px-2.5 py-1 text-[0.7rem] font-semibold text-ink/55">
            {vibe.name}
          </span>
        </div>

        {route === "tiktok" ? (
          <>
            <p className="mt-3 text-[0.86rem] leading-relaxed text-ink/60">
              Example breakdown of the kinds of videos{" "}
              <span className="font-semibold text-ink/75">
                @{cleanHandle || "their_account"}
              </span>{" "}
              would be reposting:
            </p>

            <ul className="mt-4 space-y-3.5">
              {TIKTOK_DEMO_SIGNALS.map((signal, i) => (
                <li key={signal.label} className={`gc-fade-up gc-delay-${i + 1}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[0.88rem] font-semibold text-ink/80">
                      {signal.label}
                    </span>
                    <span className="shrink-0 text-[0.76rem] font-medium text-ink/40">
                      {signal.note}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-shell">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-clay-soft to-clay transition-[width] duration-1000 ease-out"
                      style={{ width: `${signal.share}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/65">
            Your answers pointed consistently towards{" "}
            <span className="font-semibold text-ink">{vibe.name}</span>. We will
            use these interests, plus your budget, to pick the gifts.
          </p>
        )}
      </div>

      <div className="gc-fade-up gc-delay-5 mt-8">
        <PrimaryButton onClick={onNext}>See gift ideas</PrimaryButton>
      </div>

      {route === "tiktok" && (
        <div className="mt-5">
          <DemoNote>
            Sample data shown to demonstrate the concept. This prototype does not
            access TikTok or any real account.
          </DemoNote>
        </div>
      )}
    </Shell>
  );
}
