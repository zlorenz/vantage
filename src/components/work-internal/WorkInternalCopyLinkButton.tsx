/**
 * Icon button that copies the marketing portfolio URL for an entry.
 * Used on grid cards and table rows (sibling of hit targets so it never navigates).
 */

'use client'

import {useState, type MouseEvent} from 'react'
import type {Locale} from '@/i18n/routing'
import type {InternalLibraryEntry} from '@/types/sanity'
import {getPublicPortfolioUrl} from './entry-url'

interface WorkInternalCopyLinkButtonProps {
  entry: InternalLibraryEntry
  locale: Locale
}

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
  )
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
  )
}

export function WorkInternalCopyLinkButton({
  entry,
  locale,
}: WorkInternalCopyLinkButtonProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )

  async function onCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(getPublicPortfolioUrl(entry, locale))
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const label =
    copyState === 'copied'
      ? 'Copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : 'Copy public link to clipboard'

  return (
    <button
      type="button"
      className={
        copyState === 'copied'
          ? 'vp-internal-copy-link is-copied'
          : copyState === 'failed'
            ? 'vp-internal-copy-link is-failed'
            : 'vp-internal-copy-link'
      }
      onClick={onCopy}
      aria-label={label}
      title={label}
    >
      {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}
