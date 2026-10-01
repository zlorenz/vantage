/**
 * DisplayTitlesInput — Brand / Product / Campaign editor.
 * Syncs document title (en-dash) via document operations (root-level patches).
 *
 * Nested FormCallbacks prefix all paths with `displayTitleParts`, so sibling
 * fields like `title` must be written with useDocumentOperation.
 */

import {Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  getPublishedId,
  set,
  unset,
  useCurrentUser,
  useDocumentOperation,
  useFormValue,
  type ObjectInputProps,
  type PatchOperations,
} from 'sanity'

import {
  hasDisplayTitleParts,
  resolveDisplayTitles,
  trimPart,
  type DisplayTitleParts,
} from '@display-titles'

import {getStudioRole} from '../../lib/studio-roles'
import {LocalePairStack} from '../locale-pair/LocalePairStack'

type PartsValue = {
  brandName?: string
  productName?: string
  campaignTitle?: string
  brandNameZh?: string
  productNameZh?: string
  campaignTitleZh?: string
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

  const formReadOnly = Boolean(readOnly)
  const role = getStudioRole(useCurrentUser())
  const enReadOnly = formReadOnly || role === 'translator'
  const zhReadOnly = formReadOnly || role === 'editor'

  const documentId = useFormValue(['_id']) as string | undefined
  const documentType = useFormValue(['_type']) as string | undefined
  const publishedId = documentId ? getPublishedId(documentId) : ''
  const {patch} = useDocumentOperation(publishedId, documentType || 'portfolioEntry')

  // Prefer videos[0] episode title; fall back to legacy heroFilmTitle*.
  const heroFilmTitleLegacy =
    (useFormValue(['heroFilmTitle']) as string | undefined) ?? ''
  const heroFilmTitleZhLegacy =
    (useFormValue(['heroFilmTitleZh']) as string | undefined) ?? ''
  const videosForHero = useFormValue(['videos']) as
    | Array<{videoTitle?: string; videoTitleZh?: string} | undefined>
    | undefined
  const heroFilmTitle =
    (typeof videosForHero?.[0]?.videoTitle === 'string' &&
    videosForHero[0].videoTitle.trim()
      ? videosForHero[0].videoTitle
      : heroFilmTitleLegacy) ?? ''
  const heroFilmTitleZh =
    (typeof videosForHero?.[0]?.videoTitleZh === 'string' &&
    videosForHero[0].videoTitleZh.trim()
      ? videosForHero[0].videoTitleZh
      : heroFilmTitleZhLegacy) ?? ''

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

  const commit = useCallback(
    (next: PartsValue) => {
      // Relative form patch — nested FormCallbacks already scopes to displayTitleParts.
      onChange(hasDisplayTitleParts(next as DisplayTitleParts) ? set(next) : unset())

      const en = resolveDisplayTitles(
        {
          brandName: next.brandName,
          productName: next.productName,
          campaignTitle: next.campaignTitle,
          heroFilmTitle,
        },
        'en',
      )
      const hasZh = Boolean(
        trimPart(next.brandNameZh) ||
          trimPart(next.productNameZh) ||
          trimPart(next.campaignTitleZh) ||
          trimPart(heroFilmTitleZh),
      )
      // Shared resolver owns ZH→EN part fallback (do not re-implement here).
      const zh = resolveDisplayTitles(
        {
          brandName: next.brandName,
          productName: next.productName,
          campaignTitle: next.campaignTitle,
          heroFilmTitle,
          brandNameZh: next.brandNameZh,
          productNameZh: next.productNameZh,
          campaignTitleZh: next.campaignTitleZh,
          heroFilmTitleZh,
        },
        'zh',
      )

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

  return (
    <Stack space={4}>
      <style>{`
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
              enReadOnly={enReadOnly}
              zhReadOnly={zhReadOnly}
              onEnChange={(v) => setPart('brandName', v)}
              onZhChange={(v) => setPart('brandNameZh', v)}
            />
            <LocalePairStack
              label="Product/Service"
              optional
              enValue={draft.productName ?? ''}
              zhValue={draft.productNameZh ?? ''}
              enReadOnly={enReadOnly}
              zhReadOnly={zhReadOnly}
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
          enReadOnly={enReadOnly}
          zhReadOnly={zhReadOnly}
          onEnChange={(v) => setPart('campaignTitle', v)}
          onZhChange={(v) => setPart('campaignTitleZh', v)}
        />
      </Stack>
    </Stack>
  )
}
