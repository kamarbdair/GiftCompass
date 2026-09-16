"use client";

import type { ReactNode } from "react";

export function CompassMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="var(--color-plum)" />
      <circle
        cx="20"
        cy="20"
        r="13.5"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
      />
      <path d="M26.5 13.5 17.8 17.8 13.5 26.5 22.2 22.2Z" fill="var(--color-clay-soft)" />
      <circle cx="20" cy="20" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Shell({
  children,
  onBack,
  progress,
  maxWidth = "max-w-[560px]",
}: {
  children: ReactNode;
  onBack?: () => void;
  progress?: number | null;
  maxWidth?: string;
}) {
  return (
    <main className="flex-1 flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-cream/75 border-b border-ink/5">
        <div className={`mx-auto w-full ${maxWidth} px-5 py-3.5 flex items-center gap-3`}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="shrink-0 grid place-items-center size-9 rounded-full border border-ink/10 bg-white/70 text-ink/70 hover:text-ink hover:border-ink/25 transition"
            >
              <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
                <path
                  d="M12.5 4 6.5 10l6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <span className="size-9 shrink-0" />
          )}

          <div className="flex items-center gap-2 mx-auto">
            <CompassMark className="size-7" />
            <span className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">
              GiftCompass
            </span>
          </div>

          <span className="size-9 shrink-0" />
        </div>

        {typeof progress === "number" && (
          <div className="h-[3px] w-full bg-ink/5">
            <div
              className="h-full bg-clay transition-[width] duration-500 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
      </header>

      <div className={`mx-auto w-full ${maxWidth} flex-1 px-5 pb-20 pt-7`}>
        {children}
      </div>
    </main>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-plum px-7 py-4 text-[0.98rem] font-semibold text-cream shadow-[0_12px_30px_-12px_rgba(74,46,86,0.7)] transition hover:bg-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/35 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
      {children}
    </p>
  );
}

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-4 py-2.5 text-[0.88rem] font-medium transition-all duration-200 ${
        selected
          ? "border-plum bg-plum text-cream shadow-[0_8px_20px_-10px_rgba(74,46,86,0.8)] -translate-y-px"
          : "border-ink/12 bg-white/70 text-ink/75 hover:border-plum/40 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-ink/45">
      <svg viewBox="0 0 16 16" className="mt-[3px] size-3 shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
