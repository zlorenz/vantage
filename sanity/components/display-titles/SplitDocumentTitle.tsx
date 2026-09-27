import type {CSSProperties} from 'react'
import {Text} from '@sanity/ui'

/** Sanity text font sizes. The brand line stays at the list's 10px-under-13px ratio. */
const CAMPAIGN_FONT_PX = {2: 15, 4: 21} as const

type CampaignSize = keyof typeof CAMPAIGN_FONT_PX

/**
 * Gap that clears Sanity Text's line-box trim and leaves a few pixels of ink.
 * Size 1 (the list) uses 8. Size 2 and 4 collapse a little more as the ascender grows.
 */
const TITLE_GAP: Record<CampaignSize, number> = {2: 9, 4: 11}

export function SplitDocumentTitle(props: {
  brand: string
  campaign: string
  /** Existing title size at this surface. The campaign line keeps it. */
  size: CampaignSize
  /** Header chrome clips to one line. The form heading wraps. */
  ellipsis?: boolean
  muted?: boolean
  campaignStyle?: CSSProperties
}) {
  const brandPx = Math.round((CAMPAIGN_FONT_PX[props.size] * 10) / 13)
  const clip = props.ellipsis
    ? {
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        whiteSpace: 'nowrap' as const,
      }
    : {wordBreak: 'break-word' as const}

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TITLE_GAP[props.size],
        minWidth: 0,
      }}
    >
      {/* Plain span, not Sanity Text: Text's line-box trim eats a normal stack gap. */}
      <span
        style={{
          color: '#fdb913',
          fontWeight: 600,
          fontSize: brandPx,
          lineHeight: 1.2,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          ...clip,
        }}
      >
        {props.brand}
      </span>
      <Text
        size={props.size}
        weight="semibold"
        muted={props.muted}
        textOverflow={props.ellipsis ? 'ellipsis' : undefined}
        style={props.campaignStyle}
      >
        {props.campaign}
      </Text>
    </div>
  )
}
