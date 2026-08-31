'use client';

/**
 * About tabbed panel — hover/focus-driven menu with image + description swap.
 * Shared by Who We Are (menu left) and Production House (menu right) sections.
 */

import { useState } from 'react';
import Image from 'next/image';

export type AboutTabbedPanelItem = {
  label: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

type AboutTabbedPanelTheme = 'light' | 'dark';

type AboutTabbedPanelInteractiveProps = {
  sectionId: string;
  heading: string;
  items: readonly AboutTabbedPanelItem[];
  /** Menu column side on large screens. Mobile always stacks menu then image. */
  imagePosition?: 'left' | 'right';
  theme?: AboutTabbedPanelTheme;
};

const THEME_CLASSES: Record<
  AboutTabbedPanelTheme,
  { tabDefault: string; tabSelected: string; description: string }
> = {
  light: {
    tabDefault: ' text-black/40',
    tabSelected: ' is-selected bg-black text-white',
    description: ' text-black/75',
  },
  dark: {
    tabDefault: ' text-white/40',
    tabSelected: ' is-selected bg-white text-black',
    description: ' text-vp-text-muted',
  },
};

export function AboutTabbedPanelInteractive({
  sectionId,
  heading,
  items,
  imagePosition = 'right',
  theme = 'light',
}: AboutTabbedPanelInteractiveProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex] ?? items[0];

  if (!activeItem) return null;

  const headingId = `about-${sectionId}-heading`;
  const panelId = `about-${sectionId}-panel`;
  const descriptionId = `about-${sectionId}-description`;
  const menuOnRight = imagePosition === 'left';
  const themeClasses = THEME_CLASSES[theme];

  const menuColumn = (
    <div
      className={`flex flex-col gap-6 lg:col-span-5 lg:h-full${
        menuOnRight ? ' lg:order-2' : ' lg:order-1'
      }`}
    >
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0" role="tablist">
        {items.map((item, index) => {
          const selected = activeIndex === index;
          return (
            <li key={item.label} role="presentation">
              <button
                type="button"
                role="tab"
                id={`about-${sectionId}-tab-${index}`}
                aria-controls={panelId}
                aria-selected={selected}
                className={`w-full px-3 py-1.5 text-left font-vp-heading text-[clamp(1.125rem,1.8vw,1.625rem)] font-bold uppercase leading-none tracking-vp-heading${
                  selected ? themeClasses.tabSelected : themeClasses.tabDefault
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
        id={descriptionId}
        aria-live="polite"
        className={`m-0 font-light leading-relaxed lg:mt-auto${themeClasses.description}`}
      >
        {activeItem.description}
      </p>
    </div>
  );

  const imageColumn = (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={`about-${sectionId}-tab-${activeIndex}`}
      className={`lg:col-span-7${menuOnRight ? ' lg:order-1' : ' lg:order-2'}`}
    >
      {activeItem.imageSrc ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem]">
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
  );

  return (
    <div aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="m-0 mb-8 font-vp-heading text-[clamp(2.5rem,4.375vw,3.75rem)] font-bold uppercase leading-tight tracking-vp-heading lg:mb-10"
      >
        {heading}
      </h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-x-12 lg:gap-y-10">
        {menuColumn}
        {imageColumn}
      </div>
    </div>
  );
}
