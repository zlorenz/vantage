/**
 * Copy-link control for library cards, table rows, project detail toolbar,
 * and (multi-film) per-video thumbs on detail.
 *
 * Entry mode:
 * - Single playable film → menu: Client Link + Vimeo/YouTube + Xinpianchang
 * - Multi-film → one-click Client Link only (platform links live on each video)
 *
 * Video mode: menu (or one-click) for that film’s Vimeo/YouTube / Xinpianchang.
 */

'use client';

import {useEffect, useId, useRef, useState, type MouseEvent} from 'react';
import {
  resolvePortfolioVideos,
  type PortfolioVideoFields,
} from '@portfolio-videos';
import type {Locale} from '@/i18n/routing';
import {parseVideoUrl} from '@/lib/video-url';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import type {InternalLibraryEntry} from '@/types/sanity';
import {getPublicPortfolioUrl} from './entry-url';

interface WorkInternalCopyLinkButtonProps {
  /** Entry-level control (grid / table / detail toolbar). */
  entry?: InternalLibraryEntry;
  locale?: Locale;
  /** Per-film control on multi-video detail grid. */
  video?: PortfolioVideoFields;
  /** icon = overlay/table; detail = toolbar; media = detail video thumb. */
  variant?: 'icon' | 'detail' | 'media';
}

type CopyState = 'idle' | 'copied' | 'failed';

type CopyTarget = {
  id: string;
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

function isPlayableVideo(video: PortfolioVideoFields): boolean {
  if (video.vimeoUrl?.trim()) {
    const parsed = parseVideoUrl(video.vimeoUrl);
    if (parsed?.provider === 'vimeo' || parsed?.provider === 'youtube') {
      return true;
    }
  }
  return Boolean(
    video.xinpianchangUrl && xinpianchangToEmbedUrl(video.xinpianchangUrl),
  );
}

function countPlayableVideos(entry: InternalLibraryEntry): number {
  return resolvePortfolioVideos(entry).filter(isPlayableVideo).length;
}

/** Platform share targets for one film (Vimeo/YouTube and/or Xinpianchang). */
export function getVideoShareTargets(video: PortfolioVideoFields): CopyTarget[] {
  const targets: CopyTarget[] = [];
  const rawVimeo = video.vimeoUrl?.trim();
  if (rawVimeo) {
    const parsed = parseVideoUrl(rawVimeo);
    if (parsed?.provider === 'youtube') {
      targets.push({
        id: 'youtube',
        label: 'YouTube',
        url: `https://www.youtube.com/watch?v=${parsed.id}`,
      });
    } else if (parsed?.provider === 'vimeo') {
      targets.push({
        id: 'vimeo',
        label: 'Vimeo',
        url: `https://vimeo.com/${parsed.id}`,
      });
    }
  }
  const rawXpc = video.xinpianchangUrl?.trim();
  if (rawXpc) {
    const embed = xinpianchangToEmbedUrl(rawXpc);
    if (embed) {
      targets.push({
        id: 'xinpianchang',
        label: 'Xinpianchang',
        url: embed,
      });
    }
  }
  return targets;
}

function buildEntryTargets(
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

  // Multi-film campaigns: toolbar/index only copies the client page.
  // Platform URLs live on each film thumb on the detail page.
  if (countPlayableVideos(entry) > 1) {
    return targets;
  }

  const primary = resolvePortfolioVideos(entry).find(isPlayableVideo);
  if (primary) {
    targets.push(...getVideoShareTargets(primary));
  }
  return targets;
}

export function WorkInternalCopyLinkButton({
  entry,
  locale,
  video,
  variant = 'icon',
}: WorkInternalCopyLinkButtonProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const targets = video
    ? getVideoShareTargets(video)
    : entry && locale
      ? buildEntryTargets(entry, locale)
      : [];

  const useMenu = targets.length > 1;
  const isDetail = variant === 'detail';
  const isMedia = variant === 'media';

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

  if (targets.length === 0) {
    return null;
  }

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
    if (!useMenu) {
      void copyTarget(targets[0]);
      return;
    }
    setOpen((prev) => !prev);
  }

  const triggerLabel =
    copyState === 'copied'
      ? 'Copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : useMenu
          ? 'Copy link'
          : targets[0]?.id === 'client'
            ? 'Copy client link'
            : `Copy ${targets[0]?.label ?? 'link'}`;

  const triggerClassName =
    copyState === 'copied'
      ? 'vp-internal-copy-link is-copied'
      : copyState === 'failed'
        ? 'vp-internal-copy-link is-failed'
        : 'vp-internal-copy-link';

  const rootClass = [
    'vp-internal-copy-link-menu',
    open ? 'is-open' : '',
    isDetail ? 'vp-internal-copy-link-menu--detail' : '',
    isMedia ? 'vp-internal-copy-link-menu--media' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={rootRef}
      className={rootClass}
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
        aria-expanded={useMenu ? open : undefined}
        aria-haspopup={useMenu ? 'menu' : undefined}
        aria-controls={useMenu ? menuId : undefined}
        onClick={onTriggerClick}
      >
        {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
      {open && useMenu ? (
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
