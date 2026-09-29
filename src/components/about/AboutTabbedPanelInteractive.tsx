'use client';

/**
 * About tabbed panel — click-driven menu with image + description swap.
 * Shared by Who We Are (menu left) and Production House (menu right) sections.
 *
 * Selection changes on click only (WAI-ARIA manual activation). Arrow keys
 * move focus inside the tablist; Enter or Space activates the focused tab.
 * Hover restyles inactive rows so they still read as clickable.
 */

import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { CornerFrame } from '@/components/ui/CornerFrame';
import './about-tabbed-panel.css';

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
  eyebrow?: string;
  items: readonly AboutTabbedPanelItem[];
  /** Menu column side on large screens. Mobile always stacks menu then image. */
  imagePosition?: 'left' | 'right';
  theme?: AboutTabbedPanelTheme;
};

const THEME_CLASSES: Record<
  AboutTabbedPanelTheme,
  { tabDefault: string; tabInactiveHover: string; tabSelected: string; description: string }
> = {
  light: {
    tabDefault: ' text-black/20',
    tabInactiveHover: ' hover:text-black/40',
    tabSelected: ' is-selected bg-black text-white',
    description: ' text-black/75',
  },
  dark: {
    tabDefault: ' text-white/20',
    tabInactiveHover: ' hover:text-white/40',
    tabSelected: ' is-selected bg-white text-black',
    description: ' text-vp-text-muted',
  },
};

export function AboutTabbedPanelInteractive({
  sectionId,
  heading,
  eyebrow,
  items,
  imagePosition = 'right',
  theme = 'light',
}: AboutTabbedPanelInteractiveProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rovingIndex, setRovingIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeItem = items[activeIndex] ?? items[0];

  function focusTab(index: number) {
    setRovingIndex(index);
    tabRefs.current[index]?.focus();
  }

  function activateTab(index: number) {
    setActiveIndex(index);
    setRovingIndex(index);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = index >= last ? 0 : index + 1;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = index <= 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusTab(next);
  }

  function onTabBlur(event: FocusEvent<HTMLButtonElement>) {
    const nextTarget = event.relatedTarget;
    const list = event.currentTarget.closest('[role="tablist"]');
    if (nextTarget instanceof Node && list?.contains(nextTarget)) return;
    setRovingIndex(activeIndex);
  }

  if (!activeItem) return null;

  const headingId = `about-${sectionId}-heading`;
  const panelId = `about-${sectionId}-panel`;
  const descriptionId = `about-${sectionId}-description`;
  const themeClasses = THEME_CLASSES[theme];

  return (
    <div className="vp-about-tabs" data-theme={theme} aria-labelledby={headingId}>
      <div className="vp-about-tabs__header">
        {eyebrow ? (
          <p className="vp-about-tabs__eyebrow">
            <span className="vp-about-eyebrow__mark" aria-hidden="true">
              ●
            </span>
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={headingId}
          className="vp-about-tabs__heading m-0 mb-8 font-vp-heading text-[clamp(2.325rem,4.07vw,3.49rem)] font-bold uppercase leading-[1.15] tracking-normal"
        >
          {heading}
        </h2>
      </div>

      <div className="vp-about-tabs__layout grid grid-cols-1 gap-8" data-image={imagePosition}>
        <div className="vp-about-tabs__copy flex flex-col gap-8">
        <ul
          className="vp-about-tabs__menu m-0 flex list-none flex-col gap-0.5 p-0"
          role="tablist"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            const selected = activeIndex === index;
            return (
              <li key={item.label} role="presentation">
                <button
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`about-${sectionId}-tab-${index}`}
                  aria-controls={panelId}
                  aria-selected={selected}
                  tabIndex={rovingIndex === index ? 0 : -1}
                  className={`vp-about-tabs__tab w-full cursor-pointer px-3 py-1.5 text-left font-vp-heading text-[clamp(1.125rem,1.8vw,1.625rem)] font-bold uppercase leading-none tracking-vp-heading [transition:color_var(--vp-transition)]${
                    selected
                      ? themeClasses.tabSelected
                      : `${themeClasses.tabDefault}${themeClasses.tabInactiveHover}`
                  }`}
                  onClick={() => activateTab(index)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  onBlur={onTabBlur}
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
          className={`vp-about-tabs__description m-0 font-light leading-relaxed${themeClasses.description}`}
        >
          {activeItem.description}
        </p>
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`about-${sectionId}-tab-${activeIndex}`}
          className="vp-about-tabs__media min-w-0 w-full"
        >
          {activeItem.imageSrc ? (
            <div className="vp-about-tabs__photo relative aspect-video w-full overflow-hidden">
              <Image
                src={activeItem.imageSrc}
                alt={activeItem.imageAlt}
                fill
                sizes="(max-width: 1199px) 100vw, 1108px"
                className="object-cover"
                priority={activeIndex === 0}
              />
              <CornerFrame
                variant={theme === 'dark' ? 'dark' : 'light'}
                crosshair={{ size: 40, color: 'var(--vp-text)' }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
