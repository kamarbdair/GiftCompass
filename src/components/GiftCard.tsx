"use client";

import Image from "next/image";
import { formatSar } from "@/lib/matching";
import type { Product } from "@/lib/types";

export function GiftCard({
  product,
  index,
  onView,
}: {
  product: Product;
  index: number;
  onView: (product: Product) => void;
}) {
  const delay = `gc-delay-${Math.min(index + 1, 6)}`;

  return (
    <article
      className={`gc-card gc-card-hover gc-fade-up ${delay} overflow-hidden rounded-3xl border border-ink/8 bg-white/85`}
    >
      <div className="relative aspect-[4/3] w-full bg-white">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          loading="eager"
          sizes="(max-width: 640px) 100vw, 360px"
          className="object-contain p-4"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wider text-ink/60 backdrop-blur-sm">
          {product.store}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[1.06rem] font-semibold leading-snug text-ink">
            {product.name}
          </h3>
          <span className="shrink-0 rounded-full bg-clay-mist px-2.5 py-1 text-[0.8rem] font-bold text-clay">
            {formatSar(product.price)}
          </span>
        </div>

        <div className="rounded-2xl bg-shell/70 px-3.5 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Why it matches
          </p>
          <p className="mt-1 text-[0.86rem] leading-relaxed text-ink/75">
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

        <button
          type="button"
          onClick={() => onView(product)}
          className="mt-1 w-full rounded-full border border-plum/25 bg-plum/5 py-3 text-[0.86rem] font-semibold text-plum transition hover:bg-plum hover:text-cream"
        >
          View Gift
        </button>
      </div>
    </article>
  );
}
