'use client';

/**
 * About tabbed panel — click-driven menu with image + description swap.
 * Shared by Who We Are (menu left) and Production House (menu right) sections.
 *
 * Mobile: accordion — description + media under the selected tab.
 * Desktop: description accordion under the selected tab; media in the side column.
 * Desktop opens the first item on load; mobile starts fully collapsed (media lives
 * inside the accordion, so an idle stage would feel wrong). Clicking the active
 * tab collapses it; on desktop, media then falls back to the first item.
 *
 * Selection changes on click only (WAI-ARIA manual activation). Arrow keys
 * move focus inside the tablist; Enter or Space activates the focused tab.
 * Hover restyles inactive rows so they still read as clickable.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import Image from 'next/image';
import {useLocale} from 'next-intl';
import {AboutAccordionReveal} from '@/components/about/AboutAccordionReveal';
import {AboutLoopingPreview} from '@/components/about/AboutLoopingPreview';
import {CornerFrame} from '@/components/ui/CornerFrame';
import './about-tabbed-panel.css';

export type AboutTabbedPanelItem = {
  label: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  /** Homepage-style preview URL. Null keeps the still. */
  previewVimeoUrl?: string | null;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
};

type AboutTabbedPanelInteractiveProps = {
  sectionId: string;
  heading: string;
  eyebrow?: string;
  items: readonly AboutTabbedPanelItem[];
  /** Menu column side on large screens. Mobile always stacks menu then image. */
  imagePosition?: 'left' | 'right';
};

function clipKey(item: AboutTabbedPanelItem) {
  return [
    item.previewVimeoUrl ?? '',
    item.previewStartSeconds ?? '',
    item.previewEndSeconds ?? '',
  ].join(':');
}

/**
 * Poster for the selected tab, plus every preview in this section once the
 * section has been near the viewport. Inactive clips stay muted and paused
 * so a later click can skip the still when they have already buffered.
 */
function AboutTabMedia({
  items,
  activeIndex,
  warmed,
}: {
  items: readonly AboutTabbedPanelItem[];
  activeIndex: number;
  warmed: boolean;
}) {
  const locale = useLocale();
  const allowVideoPreview = locale !== 'zh';
  const activeItem = items[activeIndex];
  const [readyClips, setReadyClips] = useState<ReadonlySet<string>>(() => new Set());
  const handlers = useRef(new Map<string, (ready: boolean) => void>());

  const onReady = useCallback((key: string, ready: boolean) => {
    setReadyClips((current) => {
      const has = current.has(key);
      if (ready === has) return current;
      const next = new Set(current);
      if (ready) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  function handlerFor(key: string) {
    let handler = handlers.current.get(key);
    if (!handler) {
      handler = (ready: boolean) => onReady(key, ready);
      handlers.current.set(key, handler);
    }
    return handler;
  }

  if (!activeItem) return null;

  const activeKey = clipKey(activeItem);
  const activeHasPreview = allowVideoPreview && Boolean(activeItem.previewVimeoUrl);
  const posterVisible =
    Boolean(activeItem.imageSrc) && !(activeHasPreview && readyClips.has(activeKey));

  return (
    <div className="vp-about-tabs__photo-clip">
      {warmed && allowVideoPreview
        ? items.map((item, index) => {
            if (!item.previewVimeoUrl) return null;
            const key = clipKey(item);
            const selected = index === activeIndex;
            return (
              <div
                key={`${index}:${key}`}
                className={
                  selected ? 'vp-about-tabs__preview is-active' : 'vp-about-tabs__preview'
                }
              >
                <AboutLoopingPreview
                  url={item.previewVimeoUrl}
                  active={selected}
                  previewStartSeconds={item.previewStartSeconds}
                  previewEndSeconds={item.previewEndSeconds}
                  onReadyChange={handlerFor(key)}
                />
              </div>
            );
          })
        : null}
      {posterVisible ? (
        <div className="vp-about-tabs__poster">
          <Image
            src={activeItem.imageSrc}
            alt={activeItem.imageAlt}
            fill
            sizes="(max-width: 991px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}

function AboutTabMediaFrame({
  items,
  activeIndex,
  warmed,
}: {
  items: readonly AboutTabbedPanelItem[];
  activeIndex: number;
  warmed: boolean;
}) {
  const item = items[activeIndex];
  if (!item || !(item.imageSrc || item.previewVimeoUrl)) return null;

  return (
    <div className="vp-about-tabs__media">
      <div className="vp-about-tabs__photo">
        <AboutTabMedia items={items} activeIndex={activeIndex} warmed={warmed} />
        <CornerFrame
          crosshair={{size: 40, color: 'var(--vp-text)'}}
        />
      </div>
    </div>
  );
}

export function AboutTabbedPanelInteractive({
  sectionId,
  heading,
  eyebrow,
  items,
  imagePosition = 'right',
}: AboutTabbedPanelInteractiveProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rovingIndex, setRovingIndex] = useState(0);
  const [warmed, setWarmed] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  /* Desktop (≥992px): open first item before paint. Mobile stays collapsed. */
  useLayoutEffect(() => {
    if (window.matchMedia('(min-width: 992px)').matches) {
      setActiveIndex(0);
    }
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || warmed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setWarmed(true);
      },
      {rootMargin: '0px 0px 240px 0px'},
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [warmed]);

  function focusTab(index: number) {
    setRovingIndex(index);
    tabRefs.current[index]?.focus();
  }

  function activateTab(index: number) {
    setActiveIndex((current) => (current === index ? null : index));
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
    setRovingIndex(activeIndex ?? 0);
  }

  if (items.length === 0) return null;

  const headingId = `about-${sectionId}-heading`;
  /* Desktop side stage: keep first-item media when every tab is collapsed. */
  const mediaIndex = activeIndex ?? 0;

  return (
    <div
      ref={sectionRef}
      className="vp-about-tabs"
      aria-labelledby={headingId}
    >
      <div className="vp-about-tabs__header">
        {eyebrow ? (
          <p className="vp-about-tabs__eyebrow">
            <span className="vp-about-eyebrow__mark" aria-hidden="true">
              ●
            </span>
            {eyebrow}
          </p>
        ) : null}
        <h2 id={headingId} className="vp-about-tabs__heading">
          {heading}
        </h2>
      </div>

      <div className="vp-about-tabs__layout" data-image={imagePosition}>
        <ul
          className="vp-about-tabs__menu"
          role="tablist"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            const selected = activeIndex === index;
            const panelId = `about-${sectionId}-panel-${index}`;
            const descriptionId = `about-${sectionId}-description-${index}`;
            return (
              <li
                key={item.label}
                role="presentation"
                className={selected ? 'is-selected' : undefined}
              >
                <button
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`about-${sectionId}-tab-${index}`}
                  aria-controls={panelId}
                  aria-selected={selected}
                  aria-expanded={selected}
                  tabIndex={rovingIndex === index ? 0 : -1}
                  className={`vp-about-tabs__tab${selected ? ' is-selected' : ''}`}
                  onClick={() => activateTab(index)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  onBlur={onTabBlur}
                >
                  <span className="vp-about-tabs__tab-label">{item.label}</span>
                  <span
                    className={`vp-about-tabs__tab-toggle${
                      selected ? ' is-open' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <AboutAccordionReveal
                  open={selected}
                  id={panelId}
                  role="tabpanel"
                  aria-labelledby={`about-${sectionId}-tab-${index}`}
                  bodyClassName="vp-about-tabs__panel"
                >
                  <p
                    id={selected ? descriptionId : undefined}
                    aria-live={selected ? 'polite' : undefined}
                    className="vp-about-tabs__description text-vp-text-muted"
                  >
                    {item.description}
                  </p>
                  <div className="vp-about-tabs__media-inline">
                    <AboutTabMediaFrame
                      items={items}
                      activeIndex={index}
                      warmed={warmed}
                    />
                  </div>
                </AboutAccordionReveal>
              </li>
            );
          })}
        </ul>

        {/* Desktop side stage. Mobile uses the inline accordion media instead. */}
        <div className="vp-about-tabs__media-stage is-active">
          <AboutTabMediaFrame
            items={items}
            activeIndex={mediaIndex}
            warmed={warmed}
          />
        </div>
      </div>
    </div>
  );
}
