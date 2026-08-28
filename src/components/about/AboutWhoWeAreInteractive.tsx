'use client';

/**
 * About Who We Are — hover/focus-driven menu with image + description swap.
 * Receives pre-resolved copy and image URLs from AboutWhoWeAreSection (server).
 */

import { useState } from 'react';
import Image from 'next/image';

export type WhoWeAreItem = {
  label: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

type AboutWhoWeAreInteractiveProps = {
  heading: string;
  items: readonly WhoWeAreItem[];
};

export function AboutWhoWeAreInteractive({
  heading,
  items,
}: AboutWhoWeAreInteractiveProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex] ?? items[0];

  if (!activeItem) return null;

  return (
    <div
      className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10"
      aria-labelledby="about-who-we-are-heading"
    >
      <div className="flex flex-col gap-8 lg:col-span-5">
        <h2
          id="about-who-we-are-heading"
          className="m-0 font-vp-heading text-[clamp(2rem,3.5vw,3rem)] font-bold uppercase leading-tight tracking-vp-heading"
        >
          {heading}
        </h2>

        <ul className="m-0 flex list-none flex-col gap-2 p-0" role="tablist">
          {items.map((item, index) => {
            const selected = activeIndex === index;
            return (
              <li key={item.label} role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`about-who-we-are-tab-${index}`}
                  aria-controls="about-who-we-are-panel"
                  aria-selected={selected}
                  className={`w-full px-4 py-3 text-left font-vp-heading text-[clamp(1.125rem,1.8vw,1.625rem)] font-bold uppercase leading-tight tracking-vp-heading${
                    selected ? ' is-selected bg-white text-black' : ' text-vp-text'
                  }`}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <p
          id="about-who-we-are-description"
          aria-live="polite"
          className="m-0 font-light leading-relaxed text-vp-text-muted"
        >
          {activeItem.description}
        </p>
      </div>

      <div
        id="about-who-we-are-panel"
        role="tabpanel"
        aria-labelledby={`about-who-we-are-tab-${activeIndex}`}
        className="lg:col-span-7"
      >
        {activeItem.imageSrc ? (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={activeItem.imageSrc}
              alt={activeItem.imageAlt}
              fill
              sizes="(max-width: 992px) 100vw, 58vw"
              className="object-cover"
              priority={activeIndex === 0}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
