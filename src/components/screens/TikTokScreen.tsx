"use client";

import { DemoNote, PrimaryButton, Shell } from "../Shell";

export function TikTokScreen({
  handle,
  onChange,
  onBack,
  onNext,
}: {
  handle: string;
  onChange: (handle: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const cleaned = handle.replace(/^@+/, "").trim();

  return (
    <Shell onBack={onBack} progress={0.5}>
      <div className="gc-fade-up">
        <h2 className="font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-ink">
          What is their TikTok?
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink/55">
          We look at the kinds of videos they repost to understand what they are
          into.
        </p>
      </div>

      <form
        className="gc-fade-up gc-delay-1 mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (cleaned) onNext();
        }}
      >
        <label
          htmlFor="tiktok-handle"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/45"
        >
          TikTok username
        </label>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-ink/12 bg-white/85 px-4 py-3.5 transition focus-within:border-plum/50 focus-within:shadow-[0_0_0_4px_rgba(74,46,86,0.08)]">
          <span className="text-[1.05rem] font-semibold text-ink/35">@</span>
          <input
            id="tiktok-handle"
            type="text"
            value={handle}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            placeholder="username"
            className="w-full bg-transparent text-[1.02rem] font-medium text-ink outline-none placeholder:text-ink/30"
          />
        </div>

        <div className="mt-8">
          <PrimaryButton type="submit" disabled={!cleaned}>
            Analyse their vibe
          </PrimaryButton>
        </div>
      </form>

      <div className="gc-fade-up gc-delay-2 mt-8 rounded-2xl border border-ink/8 bg-shell/60 p-4">
        <DemoNote>
          <strong className="font-semibold text-ink/60">
            Simulated for this prototype.
          </strong>{" "}
          GiftCompass does not connect to TikTok here. The next screen shows a
          worked example of the repost analysis using sample data, so you can see
          how the real product would read someone&apos;s interests.
        </DemoNote>
      </div>
    </Shell>
  );
}
