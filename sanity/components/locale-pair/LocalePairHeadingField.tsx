import {Box, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useFormValue, type FieldProps} from 'sanity'

import {compileDisplayTitles, trimPart} from '@display-titles'

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
}) {
  const hasValue = Boolean(props.value)
  return (
    <div
      style={{
        position: 'relative',
        paddingRight: 28,
        // Match locale-pair inputs: ZH secondary to EN.
        ...(props.locale === 'zh' ? {opacity: 0.72} : null),
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

  const enTitle = useMemo(() => {
    const compiled = compileDisplayTitles({
      brandName: parts.brandName,
      productName: parts.productName,
      campaignTitle: parts.campaignTitle,
    }).documentTitle
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
    return compileDisplayTitles({
      brandName: parts.brandNameZh || parts.brandName,
      productName: parts.productNameZh,
      campaignTitle: parts.campaignTitleZh,
    }).documentTitle.replace(/\s+/g, ' ').trim()
  }, [parts, titleZhStored])

  const showZh = shouldShowZh(enTitle, zhTitle)

  const errors = (props.validation ?? [])
    .filter((marker) => marker.level === 'error')
    .map((marker) => marker.message)
    .filter(Boolean)

  return (
    <Box paddingY={2}>
      <Stack space={4}>
        <HeadingLine locale="en" value={enTitle} placeholder={PLACEHOLDER_EN} />
        {showZh ? (
          <HeadingLine locale="zh" value={zhTitle} placeholder={PLACEHOLDER_ZH} />
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
