"use client";

import { useEffect, useState } from "react";
import { ANALYSIS_STEPS } from "@/lib/data";
import { CompassMark, DemoNote } from "../Shell";

const STEP_MS = 1150;

export function AnalysisScreen({
  route,
  onDone,
}: {
  route: "tiktok" | "questions";
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= ANALYSIS_STEPS.length) {
      const finish = setTimeout(onDone, 500);
      return () => clearTimeout(finish);
    }
    const timer = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [step, onDone]);

  const progress = Math.min(step / ANALYSIS_STEPS.length, 1);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px] text-center">
        <div className="relative mx-auto grid size-32 place-items-center">
          <span className="gc-ring absolute inset-0 rounded-full border border-clay/35" />
          <span
            className="gc-ring absolute inset-0 rounded-full border border-plum/25"
            style={{ animationDelay: "1.2s" }}
          />
          <span className="gc-spin absolute inset-2 rounded-full border-2 border-ink/8 border-t-clay" />
          <CompassMark className="size-14" />
        </div>

        <h2 className="mt-9 font-display text-[1.45rem] font-semibold leading-snug tracking-tight text-ink">
          {route === "tiktok"
            ? "Reading their repost patterns"
            : "Putting their profile together"}
        </h2>

        <div className="mt-7 space-y-3 text-left">
          {ANALYSIS_STEPS.map((message, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <div
                key={message}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${
                  state === "pending"
                    ? "border-transparent bg-transparent opacity-35"
                    : "border-ink/8 bg-white/80 opacity-100"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full transition ${
                    state === "done"
                      ? "bg-sage text-white"
                      : state === "active"
                        ? "bg-clay text-white"
                        : "bg-ink/10"
                  }`}
                >
                  {state === "done" ? (
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                      <path
                        d="M3.5 8.4l3 3 6-6.4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : state === "active" ? (
                    <span className="gc-spin size-3 rounded-full border-2 border-white/35 border-t-white" />
                  ) : null}
                </span>
                <span
                  className={`text-[0.9rem] font-medium ${
                    state === "pending" ? "text-ink/40" : "text-ink/75"
                  }`}
                >
                  {message}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-clay-soft to-clay transition-[width] duration-700 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {route === "tiktok" && (
          <div className="mt-6">
            <DemoNote>
              Simulated analysis for this prototype. No TikTok account is
              accessed.
            </DemoNote>
          </div>
        )}
      </div>
    </main>
  );
}
