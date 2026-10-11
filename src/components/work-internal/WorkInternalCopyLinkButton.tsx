/**
 * Copy-link control for library cards, table rows, and project detail.
 * Opens a small menu: Client Link and (when present) Vimeo / YouTube.
 */

'use client';

import {useEffect, useId, useRef, useState, type MouseEvent} from 'react';
import type {Locale} from '@/i18n/routing';
import {parseVideoUrl} from '@/lib/video-url';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import type {InternalLibraryEntry} from '@/types/sanity';
import {getPublicPortfolioUrl} from './entry-url';

interface WorkInternalCopyLinkButtonProps {
  entry: InternalLibraryEntry;
  locale: Locale;
  /** Icon control (grid/table) vs toolbar placement (detail). */
  variant?: 'icon' | 'detail';
}

type CopyState = 'idle' | 'copied' | 'failed';

type CopyTarget = {
  id: 'client' | 'video' | 'xinpianchang';
  label: string;
  url: string;
};

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M9.55 17.6 4.9 12.95l1.4-1.4 3.25 3.25 7.15-7.15 1.4 1.4z"
      />
    </svg>
  );
}

/** First playable Vimeo/YouTube URL on the entry (canonical watch/page link). */
export function getPrimaryVideoShareLink(
  entry: InternalLibraryEntry,
): {url: string; label: 'Vimeo' | 'YouTube'} | null {
  for (const video of entry.videos ?? []) {
    const raw = video.vimeoUrl?.trim();
    if (!raw) continue;
    const parsed = parseVideoUrl(raw);
    if (!parsed) continue;
    if (parsed.provider === 'youtube') {
      return {
        url: `https://www.youtube.com/watch?v=${parsed.id}`,
        label: 'YouTube',
      };
    }
    return {
      url: `https://vimeo.com/${parsed.id}`,
      label: 'Vimeo',
    };
  }
  return null;
}

/** First valid Xinpianchang player URL on the entry. */
export function getPrimaryXinpianchangShareLink(
  entry: InternalLibraryEntry,
): string | null {
  for (const video of entry.videos ?? []) {
    const raw = video.xinpianchangUrl?.trim();
    if (!raw) continue;
    const embed = xinpianchangToEmbedUrl(raw);
    if (embed) return embed;
  }
  return null;
}

function buildTargets(
  entry: InternalLibraryEntry,
  locale: Locale,
): CopyTarget[] {
  const targets: CopyTarget[] = [
    {
      id: 'client',
      label: 'Client Link',
      url: getPublicPortfolioUrl(entry, locale),
    },
  ];
  const video = getPrimaryVideoShareLink(entry);
  if (video) {
    targets.push({
      id: 'video',
      label: video.label,
      url: video.url,
    });
  }
  const xinpianchang = getPrimaryXinpianchangShareLink(entry);
  if (xinpianchang) {
    targets.push({
      id: 'xinpianchang',
      label: 'Xinpianchang',
      url: xinpianchang,
    });
  }
  return targets;
}

export function WorkInternalCopyLinkButton({
  entry,
  locale,
  variant = 'icon',
}: WorkInternalCopyLinkButtonProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const targets = buildTargets(entry, locale);
  const isDetail = variant === 'detail';

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function copyTarget(target: CopyTarget) {
    try {
      await navigator.clipboard.writeText(target.url);
      setCopyState('copied');
      setOpen(false);
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      setOpen(false);
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }

  function onTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  }

  const triggerLabel =
    copyState === 'copied'
      ? 'Copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : 'Copy link';

  const triggerClassName =
    copyState === 'copied'
      ? 'vp-internal-copy-link is-copied'
      : copyState === 'failed'
        ? 'vp-internal-copy-link is-failed'
        : 'vp-internal-copy-link';

  return (
    <div
      ref={rootRef}
      className={
        open
          ? `vp-internal-copy-link-menu is-open${isDetail ? ' vp-internal-copy-link-menu--detail' : ''}`
          : `vp-internal-copy-link-menu${isDetail ? ' vp-internal-copy-link-menu--detail' : ''}`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        className={triggerClassName}
        aria-label={triggerLabel}
        title={triggerLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={onTriggerClick}
      >
        {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
      {open ? (
        <div
          id={menuId}
          className="vp-internal-copy-link-menu__panel"
          role="menu"
          aria-label="Copy link"
        >
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              role="menuitem"
              className="vp-internal-copy-link-menu__item"
              onClick={() => {
                void copyTarget(target);
              }}
            >
              {target.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
