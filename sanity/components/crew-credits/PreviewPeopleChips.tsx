/**
 * Lightweight name chips for CSV import preview.
 * Known names (catalog / link memory) use primary tone + link icon when URL known;
 * new names use a bordered transparent pill.
 */

import {CloseIcon, LinkIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Popover, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState, type KeyboardEvent} from 'react'

import {findExactNameInCatalog, type NameCatalogEntry} from '@crew-credits'

import {FieldLabel} from '../FieldLabel'
import type {PreviewPerson} from './csv-map'
import type {KnownPersonLink} from './link-memory'
import {isKnownPreviewPerson} from './preview-people'

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function PreviewPersonPill(props: {
  person: PreviewPerson
  known: boolean
  knownMeta?: string
  onUpdate: (patch: {name: string; url?: string; linkTitle?: string}) => void
  onRemove: () => void
}) {
  const {person, known, knownMeta, onUpdate, onRemove} = props
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState(person.name)
  const [draftUrl, setDraftUrl] = useState(person.url ?? '')
  const [draftLinkTitle, setDraftLinkTitle] = useState(person.linkTitle ?? '')
  const [urlError, setUrlError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      setDraftName(person.name)
      setDraftUrl(person.url ?? '')
      setDraftLinkTitle(person.linkTitle ?? '')
      setUrlError(null)
    }
  }, [open, person.linkTitle, person.name, person.url])

  const save = useCallback(() => {
    const name = draftName.trim()
    if (!name) return
    const url = draftUrl.trim()
    if (url && !isValidHttpUrl(url)) {
      setUrlError('Enter a valid http(s) URL')
      return
    }
    onUpdate({
      name,
      ...(url ? {url} : {}),
      ...(draftLinkTitle.trim() ? {linkTitle: draftLinkTitle.trim()} : {}),
    })
    setOpen(false)
  }, [draftLinkTitle, draftName, draftUrl, onUpdate])

  const hasUrl = Boolean(person.url?.trim())
  const tone = known ? 'primary' : 'transparent'
  const title = known
    ? [knownMeta ?? 'Known name', hasUrl ? `Linked: ${person.url}` : null].filter(Boolean).join(' · ')
    : hasUrl
      ? `New name · Linked: ${person.url}`
      : 'New name — click to edit / add link'

  return (
    <Popover
      open={open}
      portal
      placement="bottom-start"
      content={
        <Box ref={popoverRef} padding={3} style={{minWidth: 260}}>
          <Stack space={3}>
            <Stack space={2}>
              <FieldLabel>Name</FieldLabel>
              <TextInput value={draftName} onChange={(e) => setDraftName(e.currentTarget.value)} />
            </Stack>
            <Stack space={2}>
              <FieldLabel optional>URL</FieldLabel>
              <TextInput
                value={draftUrl}
                onChange={(e) => {
                  setDraftUrl(e.currentTarget.value)
                  setUrlError(null)
                }}
              />
              {urlError ? (
                <Text size={0} style={{color: 'var(--card-badge-critical-fg-color, #f03e3e)'}}>
                  {urlError}
                </Text>
              ) : null}
            </Stack>
            <Stack space={2}>
              <FieldLabel optional>Link title</FieldLabel>
              <TextInput
                value={draftLinkTitle}
                onChange={(e) => setDraftLinkTitle(e.currentTarget.value)}
              />
            </Stack>
            <Flex gap={2} justify="flex-end">
              <Button text="Cancel" mode="ghost" fontSize={1} onClick={() => setOpen(false)} />
              <Button text="Save" tone="primary" fontSize={1} onClick={save} />
            </Flex>
          </Stack>
        </Box>
      }
    >
      <Card
        ref={pillRef}
        tone={tone}
        border
        radius={6}
        paddingLeft={2}
        paddingRight={1}
        paddingY={1}
      >
        <Flex align="center" gap={1}>
          <Box
            as="button"
            onClick={() => setOpen(true)}
            title={title}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'inherit',
            }}
          >
            {hasUrl ? <LinkIcon /> : null}
            <Text size={1} weight={known ? 'medium' : undefined}>
              {person.name}
            </Text>
          </Box>
          <Button
            icon={CloseIcon}
            mode="bleed"
            padding={1}
            fontSize={0}
            onClick={onRemove}
            aria-label={`Remove ${person.name}`}
          />
        </Flex>
      </Card>
    </Popover>
  )
}

export function PreviewPeopleChips(props: {
  people: PreviewPerson[]
  nameCatalog: NameCatalogEntry[]
  linkMemory: Map<string, KnownPersonLink>
  onChange: (people: PreviewPerson[]) => void
}) {
  const {people, nameCatalog, linkMemory, onChange} = props
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const commitDraft = useCallback(() => {
    const names = draft
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    if (!names.length) {
      setDraft('')
      return
    }
    onChange([...people, ...names.map((name) => ({name}))])
    setDraft('')
  }, [draft, onChange, people])

  const onDraftKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault()
        commitDraft()
      }
      if (event.key === 'Backspace' && !draft && people.length) {
        onChange(people.slice(0, -1))
      }
    },
    [commitDraft, draft, onChange, people],
  )

  return (
    <Stack space={2}>
      <FieldLabel>Names</FieldLabel>
      <Card
        border
        radius={2}
        padding={2}
        style={{cursor: 'text'}}
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus()
        }}
      >
        <Flex wrap="wrap" gap={2} align="center">
          {people.map((person, index) => {
            const known = isKnownPreviewPerson(person, nameCatalog, linkMemory)
            const exact = findExactNameInCatalog(person.name, nameCatalog)
            const knownMeta = exact
              ? `Known · ${exact.count} use${exact.count === 1 ? '' : 's'}`
              : known
                ? 'Known'
                : undefined
            return (
              <PreviewPersonPill
                key={`${person.name}-${index}`}
                person={person}
                known={known}
                knownMeta={knownMeta}
                onUpdate={(patch) => {
                  const next = [...people]
                  const updated: PreviewPerson = {name: patch.name}
                  if (patch.url?.trim()) updated.url = patch.url.trim()
                  if (patch.linkTitle?.trim()) updated.linkTitle = patch.linkTitle.trim()
                  if (person.duplicate && patch.name === person.name) {
                    updated.duplicate = person.duplicate
                  }
                  next[index] = updated
                  onChange(next)
                }}
                onRemove={() => onChange(people.filter((_, i) => i !== index))}
              />
            )
          })}
          <input
            ref={inputRef}
            value={draft}
            placeholder={people.length ? '' : 'Type names, comma separated'}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={commitDraft}
            onKeyDown={onDraftKeyDown}
            style={{
              flex: 1,
              minWidth: 120,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              font: 'inherit',
              fontSize: 13,
              padding: '4px 2px',
            }}
          />
        </Flex>
      </Card>
      <Text size={0} muted>
        Filled pills are known names; outline pills are new. Link icon = URL on file.
      </Text>
    </Stack>
  )
}

