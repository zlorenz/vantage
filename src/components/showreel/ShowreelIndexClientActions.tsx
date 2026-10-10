/**
 * Open + copy controls for a showreel client URL on the producer index.
 * Clicks stop propagation so they never trigger the row's editor link.
 */

'use client'

import {useState, type MouseEvent} from 'react'

interface ShowreelIndexClientActionsProps {
  url: string
  label: string
}

function OpenIcon() {
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
        d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"
      />
    </svg>
  )
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

export function ShowreelIndexClientActions({
  url,
  label,
}: ShowreelIndexClientActionsProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )

  function onOpenClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation()
  }

  async function onCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const copyLabel =
    copyState === 'copied'
      ? 'Copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : `Copy client link for ${label}`

  return (
    <span className="vp-showreel-index__client-actions">
      <a
        href={url}
        className="vp-showreel-index__icon-btn"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open client page for ${label}`}
        title="Open client page"
        onClick={onOpenClick}
      >
        <OpenIcon />
      </a>
      <button
        type="button"
        className={
          copyState === 'copied'
            ? 'vp-showreel-index__icon-btn is-copied'
            : copyState === 'failed'
              ? 'vp-showreel-index__icon-btn is-failed'
              : 'vp-showreel-index__icon-btn'
        }
        onClick={onCopy}
        aria-label={copyLabel}
        title={copyLabel}
      >
        {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
    </span>
  )
}
