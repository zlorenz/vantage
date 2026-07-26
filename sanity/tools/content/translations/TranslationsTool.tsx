/**
 * Master Translations tool — phrase-book table with inline ZH edit.
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Spinner,
  Stack,
  Tab,
  TabList,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {useClient} from 'sanity'
import {
  PHRASE_CATEGORIES,
  PHRASE_INVENTORY_DOCS_QUERY,
  PHRASE_INVENTORY_PHRASES_QUERY,
  buildPhraseTableRows,
  classifyPhraseUsage,
  collectAllLiveEnHits,
  creditLabelSeedPairs,
  interfaceCodeRows,
  liveEnSet,
  seedPhraseDoc,
  type PhraseCategoryId,
  type PhraseDocRow,
  type PhraseTableRow,
} from '@phrase-book'

import {savePhraseZh} from '../../../components/locale-pair/phrase-book-studio'

type StatusFilter = 'all' | 'missing' | 'present'

export function TranslationsTool() {
  const toast = useToast()
  const studioClient = useClient({apiVersion: '2025-02-19'})
  const client = useMemo(
    () => studioClient.withConfig({perspective: 'previewDrafts'}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [category, setCategory] = useState<PhraseCategoryId | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<PhraseTableRow[]>([])
  const [unusedCount, setUnusedCount] = useState(0)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [query, setQuery] = useState('')
  const [seeded, setSeeded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [docs, phrasesRaw] = await Promise.all([
        client.fetch<Array<Record<string, unknown>>>(PHRASE_INVENTORY_DOCS_QUERY),
        client.fetch<PhraseDocRow[]>(PHRASE_INVENTORY_PHRASES_QUERY),
      ])

      const phrasesById = new Map<string, PhraseDocRow>()
      for (const row of phrasesRaw) {
        const id = String(row._id ?? '').replace(/^drafts\./, '')
        if (!id) continue
        const existing = phrasesById.get(id)
        if (!existing || String(row._id).startsWith('drafts.')) {
          phrasesById.set(id, {...row, _id: id})
        }
      }
      const phrases = [...phrasesById.values()]

      const hits = collectAllLiveEnHits(docs)
      const live = liveEnSet(hits)
      const usage = classifyPhraseUsage(phrases, live)
      setUnusedCount(usage.unusedCount)

      setRows(
        buildPhraseTableRows({
          hits,
          phrases,
          codeRows: interfaceCodeRows(),
        }),
      )
      setEdits({})
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Could not load translations',
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }, [client, toast])

  // Seed catalog crew role ZH into phrase book once per session (missing keys only).
  // Catalog-only — not the full CREDIT_LABEL_ZH map (avoids unused freeform re-seed).
  useEffect(() => {
    if (seeded) return
    let cancelled = false
    void (async () => {
      try {
        const pairs = creditLabelSeedPairs()
        const existing = await client.fetch<Array<{en?: string}>>(
          `*[_type == "translatedPhrase"]{en}`,
        )
        const have = new Set(
          existing.map((r) => (r.en ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean),
        )
        let created = 0
        for (const pair of pairs) {
          if (have.has(pair.en)) continue
          await client.createOrReplace(seedPhraseDoc(pair.en, pair.zh))
          created += 1
        }
        if (!cancelled) {
          setSeeded(true)
          if (created > 0) {
            toast.push({
              status: 'info',
              title: 'Seeded crew role phrases',
              description: `Added ${created} labels from the credit catalog.`,
            })
            await load()
          }
        }
      } catch {
        if (!cancelled) setSeeded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [client, load, seeded, toast])

  useEffect(() => {
    let cancelled = false
    void load().then(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const missingCount = useMemo(
    () => rows.filter((r) => r.editable && r.status === 'missing').length,
    [rows],
  )

  const statusCounts = useMemo(() => {
    const scoped =
      category === 'all' ? rows : rows.filter((r) => r.category === category)
    return {
      all: scoped.length,
      missing: scoped.filter((r) => r.status === 'missing').length,
      present: scoped.filter((r) => r.status === 'present').length,
    }
  }, [rows, category])

  const visible = useMemo(() => {
    let list = rows
    if (category !== 'all') {
      list = list.filter((r) => r.category === category)
    }
    const q = query.trim().toLowerCase()
    // Search ignores status so translated names (e.g. Govee) are findable.
    if (!q) {
      if (status === 'missing') {
        list = list.filter((r) => r.status === 'missing')
      } else if (status === 'present') {
        list = list.filter((r) => r.status === 'present')
      }
    } else {
      list = list.filter((r) => {
        const hay = `${r.en}\n${r.zh}\n${r.codePath ?? ''}\n${r.category}`.toLowerCase()
        return hay.includes(q)
      })
    }
    return list
  }, [rows, category, status, query])

  const saveRow = useCallback(
    async (row: PhraseTableRow) => {
      if (!row.editable) return
      const next = edits[row.id] ?? row.zh
      setSavingId(row.id)
      try {
        const result = await savePhraseZh(client, row.en, next)
        if (result.status === 'skipped') {
          toast.push({
            status: 'warning',
            title: 'Could not save',
            description: result.reason,
          })
          return
        }
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  zh: next.trim(),
                  phraseId: result.id,
                  status: next.trim() ? 'present' : 'missing',
                }
              : r,
          ),
        )
        setEdits((prev) => {
          const copy = {...prev}
          delete copy[row.id]
          return copy
        })
        toast.push({
          status: 'success',
          title: result.status === 'cleared' ? 'Cleared phrase' : 'Saved site-wide',
        })
      } catch (error) {
        toast.push({
          status: 'error',
          title: 'Save failed',
          description: error instanceof Error ? error.message : String(error),
        })
      } finally {
        setSavingId(null)
      }
    },
    [client, edits, toast],
  )

  const purgeUnused = useCallback(async () => {
    if (unusedCount <= 0) return
    setPurging(true)
    try {
      const [docs, phrasesRaw] = await Promise.all([
        client.fetch<Array<Record<string, unknown>>>(PHRASE_INVENTORY_DOCS_QUERY),
        client.fetch<PhraseDocRow[]>(PHRASE_INVENTORY_PHRASES_QUERY),
      ])
      const phrasesById = new Map<string, PhraseDocRow>()
      for (const row of phrasesRaw) {
        const id = String(row._id ?? '').replace(/^drafts\./, '')
        if (!id) continue
        if (!phrasesById.has(id) || String(row._id).startsWith('drafts.')) {
          phrasesById.set(id, {...row, _id: id})
        }
      }
      const hits = collectAllLiveEnHits(docs)
      const report = classifyPhraseUsage([...phrasesById.values()], liveEnSet(hits))
      const BATCH = 25
      for (let i = 0; i < report.unused.length; i += BATCH) {
        const chunk = report.unused.slice(i, i + BATCH)
        const tx = client.transaction()
        for (const row of chunk) {
          const id = row._id.replace(/^drafts\./, '')
          tx.delete(id)
          tx.delete(`drafts.${id}`)
        }
        await tx.commit({visibility: 'async'})
      }
      toast.push({
        status: 'success',
        title: 'Purged unused phrases',
        description: `Deleted ${report.unused.length} unused entries.`,
      })
      await load()
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Purge failed',
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setPurging(false)
    }
  }, [client, load, toast, unusedCount])

  return (
    <Flex direction="column" style={{height: '100%', minHeight: 0}}>
      <Card borderBottom padding={3} style={{flexShrink: 0}}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2} style={{minWidth: 0, flex: '1 1 280px'}}>
            <Flex align="center" gap={2} wrap="wrap">
              <Text size={2} weight="semibold">
                Translations
              </Text>
              {missingCount > 0 ? (
                <Badge tone="caution" fontSize={0}>
                  {missingCount} missing
                </Badge>
              ) : rows.length > 0 ? (
                <Badge tone="positive" fontSize={0}>
                  Caught up
                </Badge>
              ) : null}
            </Flex>
            <Text size={1} muted>
              Global EN→ZH phrase book. Translate once; reused site-wide. Code UI
              rows are read-only. Click Save to apply Chinese edits.
            </Text>
          </Stack>
          <Flex align="center" gap={2} wrap="wrap">
            <Box style={{minWidth: 200, flex: '1 1 200px', maxWidth: 320}}>
              <TextInput
                fontSize={1}
                placeholder="Search EN or ZH…"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </Box>
            {unusedCount > 0 ? (
              <Button
                mode="ghost"
                tone="caution"
                text={`Purge unused (${unusedCount})`}
                fontSize={1}
                onClick={() => void purgeUnused()}
                disabled={purging || loading}
              />
            ) : null}
            <Button
              mode="ghost"
              text="Refresh"
              fontSize={1}
              onClick={() => void load()}
              disabled={loading}
            />
          </Flex>
        </Flex>
      </Card>

      <Card borderBottom padding={2} paddingX={3} style={{flexShrink: 0}}>
        <Flex gap={3} wrap="wrap" align="center">
          <Text size={1} muted>
            Status
          </Text>
          <TabList space={1}>
            {(
              [
                ['all', 'All', statusCounts.all],
                ['missing', 'Missing', statusCounts.missing],
                ['present', 'Translated', statusCounts.present],
              ] as const
            ).map(([id, label, count]) => (
              <Tab
                key={id}
                id={`status-${id}`}
                aria-controls="translations-panel"
                label={`${label} (${count})`}
                selected={status === id}
                onClick={() => setStatus(id)}
              />
            ))}
          </TabList>
          {(status !== 'all' || category !== 'all' || query) && (
            <Button
              mode="bleed"
              text="Clear filters"
              fontSize={1}
              onClick={() => {
                setStatus('all')
                setCategory('all')
                setQuery('')
              }}
            />
          )}
        </Flex>
      </Card>

      <Card borderBottom padding={2} paddingX={3} style={{flexShrink: 0, overflowX: 'auto'}}>
        <TabList space={1}>
          {(
            [
              {id: 'all' as const, title: 'All categories'},
              ...PHRASE_CATEGORIES,
            ] as Array<{id: PhraseCategoryId | 'all'; title: string}>
          ).map((c) => (
            <Tab
              key={c.id}
              id={`cat-${c.id}`}
              aria-controls="translations-panel"
              label={c.title}
              selected={category === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </TabList>
      </Card>

      <Box flex={1} padding={3} style={{overflow: 'auto', minHeight: 0}} id="translations-panel">
        {loading && rows.length === 0 ? (
          <Flex align="center" justify="center" padding={6} gap={3}>
            <Spinner />
            <Text size={1}>Loading phrases…</Text>
          </Flex>
        ) : (
          <Stack space={3}>
            <Flex align="center" gap={2} wrap="wrap">
              <Text size={1} muted>
                {visible.length}
                {query.trim() ? ' matching' : ''} row
                {visible.length === 1 ? '' : 's'}
              </Text>
              {query.trim() && status !== 'all' ? (
                <Text size={1} muted>
                  (search includes Missing + Translated)
                </Text>
              ) : null}
              {loading ? <Spinner /> : null}
            </Flex>

            <Card border radius={2} overflow="hidden">
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(160px, 1.2fr) minmax(180px, 1.4fr) 64px 120px 72px',
                  gap: 0,
                  background: 'var(--card-muted-bg-color)',
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--card-border-color)',
                }}
              >
                <Text size={0} weight="semibold" muted>
                  English
                </Text>
                <Text size={0} weight="semibold" muted>
                  Chinese
                </Text>
                <Text size={0} weight="semibold" muted>
                  Uses
                </Text>
                <Text size={0} weight="semibold" muted>
                  Category
                </Text>
                <Text size={0} weight="semibold" muted>
                  {' '}
                </Text>
              </Box>

              {visible.length === 0 ? (
                <Box padding={4}>
                  <Stack space={2}>
                    <Text size={1} muted>
                      No phrases match these filters.
                    </Text>
                    {status === 'missing' &&
                    !query.trim() &&
                    statusCounts.present > 0 ? (
                      <Text size={1} muted>
                        {statusCounts.present} already translated in this
                        category — switch to Translated or All (or search by
                        name).
                      </Text>
                    ) : null}
                  </Stack>
                </Box>
              ) : (
                visible.map((row) => {
                  const catTitle =
                    PHRASE_CATEGORIES.find((c) => c.id === row.category)?.title ??
                    row.category
                  const dirty = edits[row.id] !== undefined && edits[row.id] !== row.zh
                  return (
                    <Box
                      key={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(160px, 1.2fr) minmax(180px, 1.4fr) 64px 120px 72px',
                        gap: 8,
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--card-border-color)',
                        alignItems: 'center',
                      }}
                    >
                      <Text size={1} style={{wordBreak: 'break-word'}}>
                        {row.en}
                        {!row.editable ? (
                          <Text as="span" size={0} muted>
                            {' '}
                            (code)
                          </Text>
                        ) : null}
                      </Text>
                      <Box>
                        {row.editable ? (
                          <TextInput
                            fontSize={1}
                            value={edits[row.id] ?? row.zh}
                            placeholder="Add Chinese…"
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [row.id]: e.currentTarget.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (dirty) void saveRow(row)
                              }
                            }}
                            disabled={savingId === row.id}
                          />
                        ) : (
                          <Text size={1} muted style={{wordBreak: 'break-word'}}>
                            {row.zh || '—'}
                          </Text>
                        )}
                      </Box>
                      <Text size={1} muted>
                        {row.useCount || '—'}
                      </Text>
                      <Text size={0} muted>
                        {catTitle}
                      </Text>
                      <Flex gap={1} justify="flex-end">
                        {row.editable ? (
                          <Button
                            mode="bleed"
                            text="Save"
                            fontSize={0}
                            padding={2}
                            disabled={!dirty || savingId === row.id}
                            onClick={() => void saveRow(row)}
                          />
                        ) : null}
                      </Flex>
                    </Box>
                  )
                })
              )}
            </Card>
          </Stack>
        )}
      </Box>
    </Flex>
  )
}
