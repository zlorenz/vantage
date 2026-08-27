import {useCallback, useEffect, useMemo, useState} from 'react'
import {set, type ArrayOfObjectsInputProps, type Reference, useClient} from 'sanity'
import {Box, Checkbox, Flex, Spinner, Stack, Text} from '@sanity/ui'

import {isKeyVisualVideoFormatId} from '@video-formats'

type TaxonomyDoc = {
  _id: string
  title: string
  parentId?: string
}

type OrderedOption = TaxonomyDoc & {depth: number}

type RefValue = Reference & {_key: string}

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function getRefType(schemaType: ArrayOfObjectsInputProps['schemaType']): string | undefined {
  const member = schemaType.of?.[0]
  if (!member) return undefined

  const to = (member as {to?: {name: string}[]}).to
  return to?.[0]?.name
}

function sortByTitle(a: TaxonomyDoc, b: TaxonomyDoc): number {
  return a.title.localeCompare(b.title, undefined, {sensitivity: 'base'})
}

function orderTaxonomyOptions(docs: TaxonomyDoc[]): OrderedOption[] {
  const childrenByParent = new Map<string, TaxonomyDoc[]>()
  const roots: TaxonomyDoc[] = []

  for (const doc of docs) {
    if (doc.parentId) {
      const siblings = childrenByParent.get(doc.parentId) ?? []
      siblings.push(doc)
      childrenByParent.set(doc.parentId, siblings)
      continue
    }
    roots.push(doc)
  }

  roots.sort(sortByTitle)
  for (const children of childrenByParent.values()) {
    children.sort(sortByTitle)
  }

  const ordered: OrderedOption[] = []
  const included = new Set<string>()

  for (const root of roots) {
    ordered.push({...root, depth: 0})
    included.add(root._id)

    for (const child of childrenByParent.get(root._id) ?? []) {
      ordered.push({...child, depth: 1})
      included.add(child._id)
    }
  }

  // Orphans (parent missing or parent not in list) — keep editable.
  const orphans = docs.filter((doc) => !included.has(doc._id)).sort(sortByTitle)
  for (const orphan of orphans) {
    ordered.push({...orphan, depth: orphan.parentId ? 1 : 0})
  }

  return ordered
}

export function TaxonomyCheckboxInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange, readOnly, schemaType} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const refType = getRefType(schemaType)
  const hierarchical = refType === 'industry'

  const [options, setOptions] = useState<TaxonomyDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!refType) {
      setError('Unknown taxonomy type')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const projection = hierarchical
      ? `{ _id, title, "parentId": parent._ref }`
      : `{ _id, title }`

    client
      .fetch<TaxonomyDoc[]>(
        `*[_type == $type] | order(title asc) ${projection}`,
        {type: refType},
      )
      .then((docs) => {
        if (!cancelled) {
          // Key Visual videoFormat is system-managed (key-visual-tag Function) —
          // never offer it as a manual checkbox on portfolioEntry.videoFormats.
          const visible =
            refType === 'videoFormat'
              ? docs.filter((doc) => !isKeyVisualVideoFormatId(doc._id))
              : docs
          setOptions(visible)
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [client, hierarchical, refType])

  const orderedOptions = useMemo(
    () => (hierarchical ? orderTaxonomyOptions(options) : options.map((doc) => ({...doc, depth: 0}))),
    [hierarchical, options],
  )

  const selectedIds = useMemo(
    () => new Set((value as RefValue[] | undefined)?.map((item) => item._ref) ?? []),
    [value],
  )

  const toggle = useCallback(
    (docId: string, checked: boolean) => {
      if (readOnly) return
      // Defense in depth — system-managed Key Visual format is not toggleable.
      if (refType === 'videoFormat' && isKeyVisualVideoFormatId(docId)) return

      const current = (value as RefValue[] | undefined) ?? []

      if (checked) {
        if (selectedIds.has(docId)) return
        onChange(
          set([
            ...current,
            {_type: 'reference', _ref: docId, _key: newKey()},
          ]),
        )
        return
      }

      onChange(set(current.filter((item) => item._ref !== docId)))
    },
    [onChange, readOnly, refType, selectedIds, value],
  )

  if (loading) {
    return (
      <Flex align="center" gap={2} paddingY={2}>
        <Spinner />
        <Text size={1} muted>
          Loading…
        </Text>
      </Flex>
    )
  }

  if (error) {
    return (
      <Text size={1} muted>
        {error}
      </Text>
    )
  }

  if (!orderedOptions.length) {
    return (
      <Text size={1} muted>
        No options yet — add taxonomy documents first.
      </Text>
    )
  }

  return (
    <Stack space={2} style={{width: '100%', minWidth: 0}}>
      {orderedOptions.map((option) => {
        const checked = selectedIds.has(option._id)
        const inputId = `taxonomy-${schemaType.name}-${option._id}`

        return (
          <Flex
            key={option._id}
            align="center"
            gap={2}
            style={{
              width: '100%',
              paddingLeft: option.depth > 0 ? '1.25rem' : undefined,
            }}
          >
            <Box style={{flexShrink: 0}}>
              <Checkbox
                id={inputId}
                checked={checked}
                disabled={Boolean(readOnly)}
                onChange={(event) => toggle(option._id, event.currentTarget.checked)}
              />
            </Box>
            <Box flex={1} style={{minWidth: 0}}>
              <Text
                as="label"
                htmlFor={inputId}
                size={1}
                muted={option.depth > 0}
                style={{
                  cursor: readOnly ? 'default' : 'pointer',
                  display: 'block',
                }}
              >
                {option.title}
              </Text>
            </Box>
          </Flex>
        )
      })}
    </Stack>
  )
}
