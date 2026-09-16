"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { formatSar } from "@/lib/matching";
import type { Product } from "@/lib/types";

export function GiftModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Keep the results page exactly where it was behind the modal.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="gc-fade-up relative w-full max-w-[460px] overflow-hidden rounded-t-[1.75rem] border border-ink/8 bg-cream shadow-[0_-8px_60px_-16px_rgba(42,26,50,0.5)] sm:rounded-[1.75rem] sm:shadow-[0_30px_80px_-24px_rgba(42,26,50,0.6)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close gift details"
          className="absolute right-3.5 top-3.5 z-10 grid size-9 place-items-center rounded-full bg-cream/85 text-ink/65 backdrop-blur-sm transition hover:bg-cream hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
            <path
              d="M5.5 5.5l9 9M14.5 5.5l-9 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="relative aspect-[4/3] w-full bg-white">
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized
            loading="eager"
            sizes="460px"
            className="object-contain p-6"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink/60 backdrop-blur-sm">
            {product.store}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="gift-modal-title"
              className="font-display text-[1.35rem] font-semibold leading-snug text-ink"
            >
              {product.name}
            </h2>
            <span className="shrink-0 rounded-full bg-clay-mist px-3 py-1.5 text-[0.9rem] font-bold text-clay">
              {formatSar(product.price)}
            </span>
          </div>

          <div className="rounded-2xl bg-shell/75 px-4 py-3.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
              Why it matches
            </p>
            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink/75">
              {product.why}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-ink/10 px-2.5 py-1 text-[0.72rem] font-medium text-ink/55"
              >
                {tag}
              </span>
            ))}
          </div>

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-plum py-3.5 text-[0.9rem] font-semibold text-cream transition hover:bg-ink"
          >
            View at {product.store}
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
              <path
                d="M8 4h8v8M16 4l-9 9M13 15v1H4V7h1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>

          <p className="text-center text-[0.75rem] leading-relaxed text-ink/45">
            Price and availability may change. Check the retailer for the latest
            information.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-ink/15 bg-white py-3 text-[0.86rem] font-semibold text-ink/70 transition hover:border-plum/40 hover:text-ink"
          >
            Back to recommendations
          </button>
        </div>
      </div>
    </div>
  );
}
