/**
 * Work-internal key visuals lightbox — same chrome / slide nav as the
 * video lightbox, plus fullscreen (keyboard arrows still work in FS).
 */

'use client';

import Image from 'next/image';
import {useEffect, useId, useRef, useState} from 'react';
import {urlForImage} from '@/lib/sanity';
import {snapNextImageWidth} from '../../../shared/next-image-sizes';
import type {InternalLibraryKeyVisual} from '@/types/sanity';

type ReadyItem = InternalLibraryKeyVisual & {
  asset: NonNullable<InternalLibraryKeyVisual['asset']> & {_id: string};
};

const FALLBACK_WIDTH = 1600;

/** 1 = forward (next / from-right), -1 = back (prev / from-left). */
function navDirection(from: number, to: number, length: number): 1 | -1 {
  if (length < 2 || from === to) return 1;
  if ((from + 1) % length === to) return 1;
  if ((from - 1 + length) % length === to) return -1;
  const forwardDist = (to - from + length) % length;
  return forwardDist <= length / 2 ? 1 : -1;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.42 6.29 6.29-6.3 6.3 1.42 1.4 6.29-6.29 6.3 6.3 1.4-1.42-6.29-6.29 6.3-6.3z"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
      />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
      />
    </svg>
  );
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function requestElementFullscreen(el: HTMLElement): void {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => void;
  };
  if (typeof el.requestFullscreen === 'function') {
    void el.requestFullscreen().catch(() => {});
    return;
  }
  anyEl.webkitRequestFullscreen?.();
}

function exitDocumentFullscreen(): void {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
  };
  if (!getFullscreenElement()) return;
  void document.exitFullscreen?.().catch(() => {});
  doc.webkitExitFullscreen?.();
}

function keyVisualLightboxUrl(item: ReadyItem): string {
  const width = item.asset.metadata?.dimensions?.width || FALLBACK_WIDTH;
  const displayWidth = snapNextImageWidth(Math.min(width, 2400));
  return urlForImage({
    _type: 'image',
    asset: {_type: 'reference', _ref: item.asset._id},
  })
    .width(displayWidth)
    .url();
}

export function WorkInternalKeyVisualsLightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: ReadyItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)),
  );
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [isSliding, setIsSliding] = useState(false);
  const [leaveUrl, setLeaveUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeItem = items[activeIndex] ?? items[0] ?? null;
  const multi = items.length > 1;
  const activeUrl = activeItem ? keyVisualLightboxUrl(activeItem) : null;
  const activeKey = activeItem?._key ?? `kv-${activeIndex}`;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the dialog (not Close) so arrow keys don't paint :focus-visible on X.
    panelRef.current?.focus({preventScroll: true});
    return () => {
      document.body.style.overflow = prev;
      if (getFullscreenElement()) exitDocumentFullscreen();
    };
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      const panel = panelRef.current;
      setIsFullscreen(Boolean(panel && getFullscreenElement() === panel));
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        onFullscreenChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!isSliding) return;
    const timer = window.setTimeout(() => setIsSliding(false), 380);
    return () => window.clearTimeout(timer);
  }, [isSliding, activeKey]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Browser exits fullscreen first; only close the dialog when not in FS.
        if (getFullscreenElement()) return;
        onClose();
        return;
      }
      if (!multi) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(activeIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [onClose, multi, activeIndex, isSliding]);

  function goTo(nextIndex: number) {
    if (!multi || items.length < 1 || isSliding || !activeUrl) return;
    const wrapped =
      ((nextIndex % items.length) + items.length) % items.length;
    if (wrapped === activeIndex) return;
    setLeaveUrl(activeUrl);
    setSlideDir(navDirection(activeIndex, wrapped, items.length));
    setIsSliding(true);
    setActiveIndex(wrapped);
  }

  function toggleFullscreen() {
    const panel = panelRef.current;
    if (!panel) return;
    if (getFullscreenElement() === panel) {
      exitDocumentFullscreen();
      return;
    }
    requestElementFullscreen(panel);
  }

  if (!activeItem || !activeUrl) return null;

  return (
    <div
      className="vp-showreel-lightbox"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="vp-showreel-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="vp-showreel-lightbox__stage">
          <button
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close image"
          >
            <CloseIcon />
          </button>
          <div className="vp-showreel-lightbox__player">
            <div
              className={
                isSliding
                  ? slideDir === 1
                    ? 'vp-showreel-lightbox__viewport vp-showreel-lightbox__viewport--image is-sliding is-dir-next'
                    : 'vp-showreel-lightbox__viewport vp-showreel-lightbox__viewport--image is-sliding is-dir-prev'
                  : 'vp-showreel-lightbox__viewport vp-showreel-lightbox__viewport--image'
              }
            >
              {isSliding && leaveUrl ? (
                <div
                  className="vp-showreel-lightbox__slide vp-showreel-lightbox__slide--leave"
                  aria-hidden="true"
                >
                  <Image
                    src={leaveUrl}
                    alt=""
                    fill
                    sizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
                    className="object-contain"
                  />
                </div>
              ) : null}
              <div
                key={activeKey}
                className={
                  isSliding
                    ? 'vp-showreel-lightbox__slide vp-showreel-lightbox__slide--enter'
                    : 'vp-showreel-lightbox__slide'
                }
              >
                <Image
                  src={activeUrl}
                  alt={activeItem.asset.altText?.trim() || ''}
                  fill
                  sizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            {/* Same corner as video chrome fullscreen — above footer nav. */}
            <button
              type="button"
              className="vp-showreel-lightbox__fs"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <FullscreenIcon />
            </button>
          </div>
        </div>
        <div className="vp-showreel-lightbox__footer vp-showreel-lightbox__footer--end">
          <h2 id={titleId} className="sr-only">
            Key visual {activeIndex + 1} of {items.length}
          </h2>
          {multi ? (
            <div className="vp-showreel-lightbox__nav">
              <span className="vp-showreel-lightbox__count" aria-live="polite">
                {activeIndex + 1} / {items.length}
              </span>
              <button
                type="button"
                className="vp-showreel-lightbox__nav-btn"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous image"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="vp-showreel-lightbox__nav-btn"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next image"
              >
                <ChevronRightIcon />
              </button>
            </div>
          ) : (
            <span className="vp-showreel-lightbox__count" aria-live="polite">
              1 / 1
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
