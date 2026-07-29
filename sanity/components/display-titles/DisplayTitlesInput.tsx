/**
 * DisplayTitlesInput — Brand / Product / Campaign editor with live previews.
 * Syncs document title (en-dash) via document operations (root-level patches).
 *
 * Nested FormCallbacks prefix all paths with `displayTitleParts`, so sibling
 * fields like `title` / overrides must be written with useDocumentOperation.
 */

import {EditIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Grid, Popover, Stack, Text, TextArea} from '@sanity/ui'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import {
  getPublishedId,
  set,
  unset,
  useDocumentOperation,
  useFormValue,
  type ObjectInputProps,
  type PatchOperations,
} from 'sanity'

import {
  compileDisplayTitles,
  hasDisplayTitleParts,
  resolveDisplayTitles,
  trimPart,
  type DisplayTitleParts,
} from '@display-titles'

import {FlagDecoratedControl} from '../locale-pair/FlagDecoratedControl'
import {LocalePairStack} from '../locale-pair/LocalePairStack'

type PartsValue = {
  brandName?: string
  productName?: string
  campaignTitle?: string
  brandNameZh?: string
  productNameZh?: string
  campaignTitleZh?: string
}

type OverrideField =
  | 'thumbTitleOverride'
  | 'thumbTitleOverrideZh'
  | 'headerTitleOverride'
  | 'headerTitleOverrideZh'
  | 'longTitleOverride'
  | 'longTitleOverrideZh'

const PREVIEW_TEXT: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: 1.35,
  paddingRight: 52,
}

function PreviewPane(props: {
  locale: 'en' | 'zh'
  html: string
  overrideValue: string
  overrideField: OverrideField
  readOnly?: boolean
  onSaveOverride: (field: OverrideField, value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(props.overrideValue)
  const buttonId = useId()
  const hasOverride = Boolean(trimPart(props.overrideValue))

  useEffect(() => {
    if (open) {
      setDraft(props.overrideValue)
    }
  }, [open, props.overrideValue])

  const close = useCallback(() => setOpen(false), [])

  const save = useCallback(() => {
    props.onSaveOverride(props.overrideField, draft)
    setOpen(false)
  }, [draft, props])

  const clear = useCallback(() => {
    setDraft('')
    props.onSaveOverride(props.overrideField, '')
    setOpen(false)
  }, [props])

  const onButtonClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (props.readOnly) return
      setOpen((prev) => !prev)
    },
    [props.readOnly],
  )

  return (
    <FlagDecoratedControl locale={props.locale} align="start">
      <div style={{position: 'relative'}}>
        <Card padding={3} radius={2} tone="transparent" border>
          <Text size={1} weight="bold" style={PREVIEW_TEXT}>
            <span
              dangerouslySetInnerHTML={{__html: props.html || '—'}}
              className="vp-display-title-preview"
            />
          </Text>
        </Card>

        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 34,
            zIndex: 2,
          }}
        >
          <Popover
            open={open}
            portal
            placement="bottom-end"
            constrainSize
            content={
              <Box padding={3} style={{width: 320, maxWidth: '90vw'}}>
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    Override {props.locale === 'zh' ? '(Chinese)' : '(English)'}
                  </Text>
                  <Text size={0} muted>
                    Optional HTML when Brand / Product / Campaign cannot express the layout. Supports
                    {' '}
                    <code>&lt;span class=&quot;vp-outline&quot;&gt;</code>.
                  </Text>
                  <TextArea
                    rows={4}
                    value={draft}
                    readOnly={props.readOnly}
                    placeholder={props.html || 'Custom title HTML…'}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                  />
                  <Flex gap={2} justify="flex-end">
                    {hasOverride || draft.trim() ? (
                      <Button text="Clear" mode="ghost" tone="critical" onClick={clear} />
                    ) : null}
                    <Button text="Cancel" mode="ghost" onClick={close} />
                    <Button text="Save" tone="primary" onClick={save} disabled={props.readOnly} />
                  </Flex>
                </Stack>
              </Box>
            }
          >
            <Button
              id={buttonId}
              icon={EditIcon}
              mode={hasOverride ? 'default' : 'bleed'}
              tone={hasOverride ? 'primary' : 'default'}
              padding={2}
              fontSize={1}
              aria-label={hasOverride ? 'Edit title override' : 'Add title override'}
              title={hasOverride ? 'Edit override' : 'Override title'}
              disabled={props.readOnly}
              selected={open}
              onClick={onButtonClick}
            />
          </Popover>
        </div>
      </div>
    </FlagDecoratedControl>
  )
}

function PreviewPair(props: {
  label: string
  enHtml: string
  zhHtml: string
  showZh: boolean
  enOverride: string
  zhOverride: string
  enField: OverrideField
  zhField: OverrideField
  readOnly?: boolean
  onSaveOverride: (field: OverrideField, value: string) => void
}) {
  return (
    <Stack space={2}>
      <Text size={0} muted weight="semibold">
        {props.label}
      </Text>
      <Stack space={2}>
        <PreviewPane
          locale="en"
          html={props.enHtml}
          overrideValue={props.enOverride}
          overrideField={props.enField}
          readOnly={props.readOnly}
          onSaveOverride={props.onSaveOverride}
        />
        {props.showZh ? (
          <PreviewPane
            locale="zh"
            html={props.zhHtml}
            overrideValue={props.zhOverride}
            overrideField={props.zhField}
            readOnly={props.readOnly}
            onSaveOverride={props.onSaveOverride}
          />
        ) : null}
      </Stack>
    </Stack>
  )
}

function partsEqual(a: PartsValue, b: PartsValue): boolean {
  const keys: Array<keyof PartsValue> = [
    'brandName',
    'productName',
    'campaignTitle',
    'brandNameZh',
    'productNameZh',
    'campaignTitleZh',
  ]
  return keys.every((key) => trimPart(a[key]) === trimPart(b[key]))
}

export function DisplayTitlesInput(props: ObjectInputProps) {
  const {value, readOnly, onChange} = props
  const stored = (value ?? {}) as PartsValue
  const [draft, setDraft] = useState<PartsValue>(stored)

  const documentId = useFormValue(['_id']) as string | undefined
  const documentType = useFormValue(['_type']) as string | undefined
  const publishedId = documentId ? getPublishedId(documentId) : ''
  const {patch} = useDocumentOperation(publishedId, documentType || 'portfolioEntry')

  const thumbTitleOverride = (useFormValue(['thumbTitleOverride']) as string | undefined) ?? ''
  const thumbTitleOverrideZh = (useFormValue(['thumbTitleOverrideZh']) as string | undefined) ?? ''
  const headerTitleOverride = (useFormValue(['headerTitleOverride']) as string | undefined) ?? ''
  const headerTitleOverrideZh =
    (useFormValue(['headerTitleOverrideZh']) as string | undefined) ?? ''
  const longTitleOverride = (useFormValue(['longTitleOverride']) as string | undefined) ?? ''
  const longTitleOverrideZh = (useFormValue(['longTitleOverrideZh']) as string | undefined) ?? ''
  const heroFilmTitle = (useFormValue(['heroFilmTitle']) as string | undefined) ?? ''
  const heroFilmTitleZh = (useFormValue(['heroFilmTitleZh']) as string | undefined) ?? ''

  useEffect(() => {
    setDraft((prev) => (partsEqual(prev, stored) ? prev : stored))
  }, [
    stored.brandName,
    stored.productName,
    stored.campaignTitle,
    stored.brandNameZh,
    stored.productNameZh,
    stored.campaignTitleZh,
  ])

  const resolveInput = useMemo(
    () => ({
      ...draft,
      heroFilmTitle,
      heroFilmTitleZh,
      thumbTitleOverride,
      thumbTitleOverrideZh,
      headerTitleOverride,
      headerTitleOverrideZh,
      longTitleOverride,
      longTitleOverrideZh,
    }),
    [
      draft,
      headerTitleOverride,
      headerTitleOverrideZh,
      heroFilmTitle,
      heroFilmTitleZh,
      longTitleOverride,
      longTitleOverrideZh,
      thumbTitleOverride,
      thumbTitleOverrideZh,
    ],
  )

  const enResolved = useMemo(
    () => resolveDisplayTitles(resolveInput, 'en'),
    [resolveInput],
  )
  const zhResolved = useMemo(
    () => resolveDisplayTitles(resolveInput, 'zh'),
    [resolveInput],
  )

  const showZhPreview = Boolean(
    trimPart(draft.brandNameZh) ||
      trimPart(draft.productNameZh) ||
      trimPart(draft.campaignTitleZh) ||
      trimPart(heroFilmTitleZh) ||
      trimPart(thumbTitleOverrideZh) ||
      trimPart(headerTitleOverrideZh) ||
      trimPart(longTitleOverrideZh),
  )

  const commit = useCallback(
    (next: PartsValue) => {
      // Relative form patch — nested FormCallbacks already scopes to displayTitleParts.
      onChange(hasDisplayTitleParts(next as DisplayTitleParts) ? set(next) : unset())

      const en = compileDisplayTitles({
        brandName: next.brandName,
        productName: next.productName,
        campaignTitle: next.campaignTitle,
        heroFilmTitle,
      })
      const hasZh = Boolean(
        trimPart(next.brandNameZh) ||
          trimPart(next.productNameZh) ||
          trimPart(next.campaignTitleZh) ||
          trimPart(heroFilmTitleZh),
      )
      const zh = compileDisplayTitles({
        brandName: next.brandNameZh || next.brandName,
        productName: next.productNameZh,
        campaignTitle: next.campaignTitleZh,
        heroFilmTitle: heroFilmTitleZh || undefined,
      })

      // Root-level title sync — must bypass nested FormCallbacks path prefixing.
      if (!publishedId || !documentType) return

      const patches: PatchOperations[] = []
      const setFields: Record<string, unknown> = {}

      if (trimPart(en.documentTitle)) {
        setFields.title = en.documentTitle
      }
      if (hasZh && trimPart(zh.documentTitle)) {
        setFields.titleZh = zh.documentTitle
      }

      if (Object.keys(setFields).length > 0) {
        patches.push({set: setFields})
      }
      if (!hasZh) {
        patches.push({unset: ['titleZh']})
      }

      if (patches.length > 0) {
        patch.execute(patches)
      }
    },
    [documentType, heroFilmTitle, heroFilmTitleZh, onChange, patch, publishedId],
  )

  const setPart = useCallback(
    (key: keyof PartsValue, raw: string) => {
      const next: PartsValue = {...draft, [key]: raw}
      if (!trimPart(raw)) {
        delete next[key]
      } else {
        next[key] = raw
      }
      setDraft(next)
      commit(next)
    },
    [commit, draft],
  )

  const saveOverride = useCallback(
    (field: OverrideField, raw: string) => {
      if (!publishedId || !documentType) return
      const trimmed = raw.trim()
      if (trimmed) {
        patch.execute([{set: {[field]: raw}}])
      } else {
        patch.execute([{unset: [field]}])
      }
    },
    [documentType, patch, publishedId],
  )

  return (
    <Stack space={4}>
      <style>{`
        .vp-display-title-preview .vp-outline {
          /* Studio preview is small — outline stroke looks muddy; use thin weight instead. */
          color: inherit;
          -webkit-text-stroke: 0;
          font-weight: 300;
        }
        /* Stack on narrow form columns / mobile; side-by-side when the field area is wide. */
        .vp-brand-product-row {
          container-type: inline-size;
          width: 100%;
        }
        .vp-brand-product-row__grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }
        @container (min-width: 520px) {
          .vp-brand-product-row__grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <Text size={1} muted>
        Portfolio titles will automatically update when you fill these fields. If the hero film's name differs from the Campaign Title,
        you can set that in the Media tab.
      </Text>

      <Stack space={4}>
        <div className="vp-brand-product-row">
          <div className="vp-brand-product-row__grid">
            <LocalePairStack
              label="Brand Name"
              enValue={draft.brandName ?? ''}
              zhValue={draft.brandNameZh ?? ''}
              enReadOnly={readOnly}
              zhReadOnly={readOnly}
              onEnChange={(v) => setPart('brandName', v)}
              onZhChange={(v) => setPart('brandNameZh', v)}
            />
            <LocalePairStack
              label="Product/Service"
              optional
              enValue={draft.productName ?? ''}
              zhValue={draft.productNameZh ?? ''}
              enReadOnly={readOnly}
              zhReadOnly={readOnly}
              onEnChange={(v) => setPart('productName', v)}
              onZhChange={(v) => setPart('productNameZh', v)}
            />
          </div>
        </div>
        <LocalePairStack
          label="Campaign Title"
          optional
          enValue={draft.campaignTitle ?? ''}
          zhValue={draft.campaignTitleZh ?? ''}
          enReadOnly={readOnly}
          zhReadOnly={readOnly}
          onEnChange={(v) => setPart('campaignTitle', v)}
          onZhChange={(v) => setPart('campaignTitleZh', v)}
        />
      </Stack>

      <Text size={1} muted>
        Use the pencil on a preview to override that title with custom HTML.
      </Text>
      <Card padding={4} radius={2} shadow={1} tone="transparent" border>
        <Stack space={4}>
          <Text size={1} weight="bold">
            Live preview
          </Text>
          <Grid columns={[1, 1, 3]} gap={3}>
            <PreviewPair
              label="Thumbnail"
              enHtml={enResolved.thumbTitle}
              zhHtml={zhResolved.thumbTitle}
              showZh={showZhPreview}
              enOverride={thumbTitleOverride}
              zhOverride={thumbTitleOverrideZh}
              enField="thumbTitleOverride"
              zhField="thumbTitleOverrideZh"
              readOnly={readOnly}
              onSaveOverride={saveOverride}
            />
            <PreviewPair
              label="Header"
              enHtml={enResolved.headerTitle}
              zhHtml={zhResolved.headerTitle}
              showZh={showZhPreview}
              enOverride={headerTitleOverride}
              zhOverride={headerTitleOverrideZh}
              enField="headerTitleOverride"
              zhField="headerTitleOverrideZh"
              readOnly={readOnly}
              onSaveOverride={saveOverride}
            />
            <PreviewPair
              label="Full"
              enHtml={enResolved.longTitle}
              zhHtml={zhResolved.longTitle}
              showZh={showZhPreview}
              enOverride={longTitleOverride}
              zhOverride={longTitleOverrideZh}
              enField="longTitleOverride"
              zhField="longTitleOverrideZh"
              readOnly={readOnly}
              onSaveOverride={saveOverride}
            />
          </Grid>
        </Stack>
      </Card>
    </Stack>
  )
}
