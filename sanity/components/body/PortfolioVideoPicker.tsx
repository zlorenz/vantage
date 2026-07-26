/**
 * PortfolioVideoPicker — Search portfolio hero + additional videos to insert a URL.
 */

import {CloseIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {compileDisplayTitles, trimPart} from '@display-titles'

type PortfolioVideoRow = {
  _id: string
  title?: string
  displayTitleParts?: {
    brandName?: string
    productName?: string
    campaignTitle?: string
  }
  vimeoUrl?: string
  additionalVideos?: Array<{
    vimeoUrl?: string
    videoTitle?: string
  }>
}

export type PortfolioVideoSelection = {
  url: string
  title: string
}

type PickerItem = {
  key: string
  label: string
  detail: string
  url: string
  title: string
}

function entryLabel(doc: PortfolioVideoRow): string {
  const parts = doc.displayTitleParts
  if (parts && trimPart(parts.brandName)) {
    const compiled = compileDisplayTitles({
      brandName: parts.brandName,
      productName: parts.productName,
      campaignTitle: parts.campaignTitle,
    }).documentTitle
    if (trimPart(compiled)) return compiled
  }
  return doc.title?.trim() || doc._id
}

function flattenVideos(docs: PortfolioVideoRow[]): PickerItem[] {
  const items: PickerItem[] = []
  for (const doc of docs) {
    const label = entryLabel(doc)
    if (doc.vimeoUrl?.trim()) {
      items.push({
        key: `${doc._id}:hero`,
        label,
        detail: 'Hero video',
        url: doc.vimeoUrl.trim(),
        title: label,
      })
    }
    for (const [i, av] of (doc.additionalVideos ?? []).entries()) {
      if (!av?.vimeoUrl?.trim()) continue
      const episode = av.videoTitle?.trim()
      items.push({
        key: `${doc._id}:add:${i}`,
        label,
        detail: episode || `Additional video ${i + 1}`,
        url: av.vimeoUrl.trim(),
        title: episode || label,
      })
    }
  }
  return items
}

type PortfolioVideoPickerProps = {
  onSelect: (selection: PortfolioVideoSelection) => void
  onClose: () => void
}

export function PortfolioVideoPicker({onSelect, onClose}: PortfolioVideoPickerProps) {
  const client = useClient({apiVersion: '2025-01-01'})
  const [rows, setRows] = useState<PortfolioVideoRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    client
      .fetch<PortfolioVideoRow[]>(
        `*[_type == "portfolioEntry" && !(_id in path("drafts.**"))]{
          _id,
          title,
          displayTitleParts,
          vimeoUrl,
          additionalVideos[]{vimeoUrl, videoTitle}
        } | order(title asc)`,
      )
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load portfolio videos')
        }
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const items = useMemo(() => flattenVideos(rows ?? []), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q),
    )
  }, [items, query])

  return (
    <Dialog
      id="vp-portfolio-video-picker"
      header="Insert from portfolio"
      width={1}
      onClose={onClose}
      zOffset={1300}
    >
      <Stack space={3} padding={4}>
        <Flex gap={2} align="center">
          <Box flex={1}>
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search brand, campaign, or URL…"
            />
          </Box>
          <Button mode="bleed" icon={CloseIcon} text="Close" onClick={onClose} />
        </Flex>

        {error ? (
          <Card padding={3} tone="critical" radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}

        {!rows && !error ? (
          <Flex align="center" gap={3} padding={4} justify="center">
            <Spinner />
            <Text size={1} muted>
              Loading portfolio videos…
            </Text>
          </Flex>
        ) : null}

        {rows ? (
          <Stack space={2} style={{maxHeight: '55vh', overflow: 'auto'}}>
            {filtered.length === 0 ? (
              <Text size={1} muted>
                No videos match.
              </Text>
            ) : (
              filtered.map((item) => (
                <Card
                  key={item.key}
                  padding={3}
                  radius={2}
                  shadow={1}
                  tone="transparent"
                  border
                  as="button"
                  style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
                  onClick={() => onSelect({url: item.url, title: item.title})}
                >
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      {item.title}
                    </Text>
                    <Text size={1} muted>
                      {item.detail === item.title ? item.label : `${item.label} · ${item.detail}`}
                    </Text>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        ) : null}
      </Stack>
    </Dialog>
  )
}
