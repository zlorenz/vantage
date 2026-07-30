import {Box, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useCurrentUser, useFormValue, type FieldProps} from 'sanity'

import {resolveDisplayTitles, trimPart} from '@display-titles'

import {getStudioRole} from '../../lib/studio-roles'
import {LocaleFlag, localeAriaLabel} from './LocaleFlag'
import {getLocalePairOptions} from './types'
import {shouldShowZh} from './shouldShowZh'

type PartsValue = {
  brandName?: string
  productName?: string
  campaignTitle?: string
  brandNameZh?: string
  productNameZh?: string
  campaignTitleZh?: string
}

const PLACEHOLDER_EN = 'Brand Product – Campaign'
const PLACEHOLDER_ZH = '品牌 产品 – 广告片名'

function HeadingLine(props: {
  locale: 'en' | 'zh'
  value: string
  placeholder: string
  muted?: boolean
}) {
  const hasValue = Boolean(props.value)
  return (
    <div
      style={{
        position: 'relative',
        paddingRight: 28,
        ...(props.muted ? {opacity: 0.72} : null),
      }}
    >
      <Text
        size={4}
        weight="semibold"
        muted={!hasValue}
        style={{
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          wordBreak: 'break-word',
        }}
      >
        {hasValue ? props.value : props.placeholder}
      </Text>
      <span
        aria-label={localeAriaLabel(props.locale)}
        title={localeAriaLabel(props.locale)}
        style={{
          position: 'absolute',
          right: 0,
          top: 6,
          display: 'flex',
        }}
      >
        <LocaleFlag locale={props.locale} size={16} />
      </span>
    </div>
  )
}

/**
 * Read-only stacked document titles (EN + conditional ZH) for portfolio entries.
 * Live-compiles from displayTitleParts so headings stay in sync.
 */
export function LocalePairHeadingField(props: FieldProps) {
  const pair = getLocalePairOptions(props.schemaType)
  const zhName = pair?.zhName ?? 'titleZh'
  const parts = (useFormValue(['displayTitleParts']) ?? {}) as PartsValue
  const titleZhStored = useFormValue([zhName]) as string | undefined
  const role = getStudioRole(useCurrentUser())
  // Match LocalePairField: translator locks EN, editor locks ZH, admin locks neither.
  const enMuted = role === 'translator'
  const zhMuted = role === 'editor'

  const enTitle = useMemo(() => {
    const compiled = resolveDisplayTitles(
      {
        brandName: parts.brandName,
        productName: parts.productName,
        campaignTitle: parts.campaignTitle,
      },
      'en',
    ).documentTitle
    return (compiled || (typeof props.value === 'string' ? props.value : '') || '')
      .replace(/\s+/g, ' ')
      .trim()
  }, [parts.brandName, parts.campaignTitle, parts.productName, props.value])

  const zhTitle = useMemo(() => {
    const hasZhParts = Boolean(
      trimPart(parts.brandNameZh) ||
        trimPart(parts.productNameZh) ||
        trimPart(parts.campaignTitleZh),
    )
    if (!hasZhParts) {
      return (titleZhStored || '').replace(/\s+/g, ' ').trim()
    }
    // Shared resolver owns ZH→EN part fallback (do not re-implement here).
    return resolveDisplayTitles(
      {
        brandName: parts.brandName,
        productName: parts.productName,
        campaignTitle: parts.campaignTitle,
        brandNameZh: parts.brandNameZh,
        productNameZh: parts.productNameZh,
        campaignTitleZh: parts.campaignTitleZh,
      },
      'zh',
    ).documentTitle.replace(/\s+/g, ' ').trim()
  }, [parts, titleZhStored])

  const showZh = shouldShowZh(enTitle, zhTitle)

  const errors = (props.validation ?? [])
    .filter((marker) => marker.level === 'error')
    .map((marker) => marker.message)
    .filter(Boolean)

  return (
    <Box paddingY={2}>
      <Stack space={4}>
        <HeadingLine
          locale="en"
          value={enTitle}
          placeholder={PLACEHOLDER_EN}
          muted={enMuted}
        />
        {showZh ? (
          <HeadingLine
            locale="zh"
            value={zhTitle}
            placeholder={PLACEHOLDER_ZH}
            muted={zhMuted}
          />
        ) : null}
        {errors.length > 0 ? (
          <Text size={0} style={{color: 'var(--card-badge-critical-fg-color)'}}>
            {errors.join(' · ')}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
