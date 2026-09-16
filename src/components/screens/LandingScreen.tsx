"use client";

import { CompassMark, PrimaryButton } from "../Shell";

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-14">
      <div className="w-full max-w-[560px] text-center">
        <div className="gc-pop mx-auto mb-9 flex items-center justify-center gap-2.5">
          <CompassMark className="size-9" />
          <span className="font-display text-[1.3rem] font-semibold tracking-tight text-ink">
            GiftCompass
          </span>
        </div>

        <div className="gc-fade-up gc-delay-1 relative mx-auto mb-10 grid size-44 place-items-center sm:size-52">
          <span className="gc-ring absolute inset-0 rounded-full border border-clay/30" />
          <span
            className="gc-ring absolute inset-0 rounded-full border border-plum/25"
            style={{ animationDelay: "0.8s" }}
          />
          <div className="gc-float grid size-32 place-items-center rounded-full bg-gradient-to-br from-blush via-shell to-plum-mist shadow-[0_24px_60px_-28px_rgba(74,46,86,0.7)] sm:size-36">
            <svg viewBox="0 0 120 120" className="size-20 sm:size-24" aria-hidden="true">
              <rect x="22" y="52" width="76" height="50" rx="10" fill="#c4674a" />
              <rect x="22" y="52" width="76" height="14" rx="7" fill="#a8543a" />
              <rect x="16" y="40" width="88" height="20" rx="9" fill="#e08b68" />
              <rect x="54" y="40" width="12" height="62" fill="#f4ebe1" opacity="0.92" />
              <path
                d="M60 40c-9-3-18-9-16-17 1-6 9-7 13-2 3 4 3 12 3 19Z"
                fill="#f0c9a8"
              />
              <path
                d="M60 40c9-3 18-9 16-17-1-6-9-7-13-2-3 4-3 12-3 19Z"
                fill="#f7dcc4"
              />
            </svg>
          </div>
        </div>

        <h1 className="gc-fade-up gc-delay-2 font-display text-[2.1rem] font-semibold leading-[1.14] tracking-tight text-ink sm:text-[2.7rem]">
          Find a gift that
          <br />
          <span className="text-clay">actually feels like them.</span>
        </h1>

        <p className="gc-fade-up gc-delay-3 mx-auto mt-5 max-w-[26rem] text-[1rem] leading-relaxed text-ink/60">
          GiftCompass understands what someone actually likes, then finds
          personalised gift ideas that fit your budget.
        </p>

        <div className="gc-fade-up gc-delay-4 mx-auto mt-10 max-w-[19rem]">
          <PrimaryButton onClick={onStart}>Find a Gift</PrimaryButton>
        </div>

        <p className="gc-fade-up gc-delay-5 mt-5 text-[0.78rem] text-ink/40">
          Takes about a minute · Jeddah, Saudi Arabia
        </p>
      </div>
    </main>
  );
}
