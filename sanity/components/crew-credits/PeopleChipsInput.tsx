/**
 * PeopleChipsInput — YouTube-tag-style chip editor for crewPerson arrays.
 *
 * Typing comma-separated names converts each segment into a pill (on comma,
 * Enter, or blur). Each pill has an X to remove it. Clicking a pill opens a
 * popover to edit the name and attach an optional link — no HTML needed.
 *
 * While typing, a debounced autocomplete dropdown suggests existing names
 * from the site-wide catalog (prioritizing the current crew role).
 */

import {CloseIcon, LinkIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Popover,
  Stack,
  Text,
  TextInput,
  useClickOutsideEvent,
} from '@sanity/ui'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import {createPortal} from 'react-dom'

import {
  evaluateIdentityLinkConfidence,
  formatMatchReasons,
  isAutoLinkConfidence,
  isFilterCreditRoleKey,
  searchNameSuggestions,
  type CrewDepartmentKey,
  type CrewPersonValue,
  type NameCatalogEntry,
  type NameSuggestion,
} from '@crew-credits'

import {FieldLabel} from '../FieldLabel'

import {newArrayKey} from './keys'
import {
  enrichPersonWithLinkMemory,
  type KnownPersonLink,
} from './link-memory'
import {identityRef, type CreditIdentityDoc} from './sync-credit-identities'

const SUGGEST_DEBOUNCE_MS = 200

type GatedNameSuggestion = NameSuggestion & {
  reviewFlagged?: boolean
  blockedIdentityId?: string
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function suggestionMeta(suggestion: NameSuggestion, reviewFlagged?: boolean): string {
  const parts = [`${suggestion.count} use${suggestion.count === 1 ? '' : 's'}`]
  if (reviewFlagged) {
    parts.push('possible match — confirm before linking')
  } else if (suggestion.reasons?.length) {
    parts.push(formatMatchReasons(suggestion.reasons))
  }
  return parts.join(' · ')
}

function PersonPill(props: {
  person: CrewPersonValue
  /** Default URL from creditIdentity when person.url is empty. */
  identityUrl?: string
  readOnly?: boolean
  onUpdate: (patch: {
    name: string
    url?: string
    linkTitle?: string
    identity?: CrewPersonValue['identity']
    /** True when the URL field changed (including cleared). */
    urlChanged?: boolean
  }) => void
  onRenameApplied?: (rename: {
    fromName: string
    toName: string
    identityId?: string
  }) => void
  onRemove: () => void
}) {
  const {person, identityUrl, readOnly, onUpdate, onRenameApplied, onRemove} = props
  const effectiveUrl = person.url?.trim() || identityUrl?.trim() || ''
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState(person.name)
  const [draftUrl, setDraftUrl] = useState(effectiveUrl)
  const [draftLinkTitle, setDraftLinkTitle] = useState(person.linkTitle ?? '')
  const [urlError, setUrlError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLDivElement | null>(null)

  const openEditor = useCallback(() => {
    if (readOnly) return
    setDraftName(person.name)
    setDraftUrl(person.url?.trim() || identityUrl?.trim() || '')
    setDraftLinkTitle(person.linkTitle ?? '')
    setUrlError(null)
    setOpen(true)
  }, [identityUrl, person.linkTitle, person.name, person.url, readOnly])

  const buildPatch = useCallback(() => {
    const name = draftName.trim()
    const url = draftUrl.trim()
    const linkTitle = draftLinkTitle.trim()
    if (!name) return null
    if (url && !isValidHttpUrl(url)) {
      setUrlError('Enter a full URL starting with http:// or https://')
      return null
    }
    const prevUrl = person.url?.trim() || identityUrl?.trim() || ''
    const patch: {
      name: string
      url?: string
      linkTitle?: string
      identity?: CrewPersonValue['identity']
      urlChanged?: boolean
    } = {name}
    if (url) patch.url = url
    if (url && linkTitle && linkTitle.toLowerCase() !== name.toLowerCase()) {
      patch.linkTitle = linkTitle
    }
    if (person.identity?._ref) patch.identity = person.identity
    if (url !== prevUrl) patch.urlChanged = true
    return patch
  }, [draftLinkTitle, draftName, draftUrl, identityUrl, person.identity, person.url])

  const save = useCallback(() => {
    const patch = buildPatch()
    if (!patch) {
      if (!draftName.trim()) {
        onRemove()
        setOpen(false)
      }
      return
    }
    onUpdate(patch)
    setOpen(false)
  }, [buildPatch, draftName, onRemove, onUpdate])

  const saveAndRenameEverywhere = useCallback(() => {
    const patch = buildPatch()
    if (!patch) {
      if (!draftName.trim()) {
        onRemove()
        setOpen(false)
      }
      return
    }
    const fromName = person.name.trim()
    onUpdate(patch)
    if (patch.name !== fromName) {
      onRenameApplied?.({
        fromName,
        toName: patch.name,
        ...(person.identity?._ref ? {identityId: person.identity._ref} : {}),
      })
    }
    setOpen(false)
  }, [buildPatch, draftName, onRenameApplied, onRemove, onUpdate, person.identity, person.name])

  useClickOutsideEvent(
    () => setOpen(false),
    () => [popoverRef.current, pillRef.current],
  )

  const onEditorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        save()
      }
      if (event.key === 'Escape') {
        setOpen(false)
      }
    },
    [save],
  )

  return (
    <Popover
      open={open}
      portal
      placement="bottom-start"
      content={
        <Box ref={popoverRef} padding={3} style={{minWidth: 280}}>
          <Stack space={3}>
            <Stack space={2}>
              <FieldLabel>Name</FieldLabel>
              <TextInput
                value={draftName}
                onChange={(event) => setDraftName(event.currentTarget.value)}
                onKeyDown={onEditorKeyDown}
              />
            </Stack>
            <Stack space={2}>
              <FieldLabel optional>Link</FieldLabel>
              <TextInput
                value={draftUrl}
                placeholder="https://example.com"
                onChange={(event) => {
                  setDraftUrl(event.currentTarget.value)
                  setUrlError(null)
                }}
                onKeyDown={onEditorKeyDown}
              />
              {urlError ? (
                <Text size={0} style={{color: 'var(--card-badge-critical-fg-color, #f03e2f)'}}>
                  {urlError}
                </Text>
              ) : null}
            </Stack>
            {draftUrl.trim() ? (
              <Stack space={2}>
                <FieldLabel optional>Link tooltip</FieldLabel>
                <TextInput
                  value={draftLinkTitle}
                  placeholder="Shown on hover when different from the name"
                  onChange={(event) => setDraftLinkTitle(event.currentTarget.value)}
                  onKeyDown={onEditorKeyDown}
                />
              </Stack>
            ) : null}
            <Flex gap={2} justify="flex-end" wrap="wrap">
              <Button
                text="Remove"
                mode="bleed"
                tone="critical"
                fontSize={1}
                onClick={() => {
                  onRemove()
                  setOpen(false)
                }}
              />
              <Button text="Cancel" mode="ghost" fontSize={1} onClick={() => setOpen(false)} />
              {draftName.trim() !== person.name.trim() ? (
                <Button
                  text="Save & rename everywhere"
                  mode="ghost"
                  tone="caution"
                  fontSize={1}
                  onClick={saveAndRenameEverywhere}
                />
              ) : null}
              <Button text="Save" tone="primary" fontSize={1} onClick={save} />
            </Flex>
          </Stack>
        </Box>
      }
    >
      <Card
        ref={pillRef}
        tone={effectiveUrl ? 'primary' : 'transparent'}
        border
        radius={6}
        paddingLeft={2}
        paddingRight={1}
        paddingY={1}
      >
        <Flex align="center" gap={1}>
          <Box
            as="button"
            onClick={openEditor}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: readOnly ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'inherit',
            }}
            title={
              person.identity?._ref
                ? `Identity ${person.identity._ref}${effectiveUrl ? ` · Linked: ${effectiveUrl}` : ''}`
                : effectiveUrl
                  ? `Linked: ${effectiveUrl}`
                  : 'Click to edit / add link'
            }
          >
            {effectiveUrl ? <LinkIcon /> : null}
            <Text size={1}>{person.name}</Text>
          </Box>
          <Button
            icon={CloseIcon}
            mode="bleed"
            padding={1}
            fontSize={0}
            disabled={Boolean(readOnly)}
            onClick={onRemove}
            aria-label={`Remove ${person.name}`}
          />
        </Flex>
      </Card>
    </Popover>
  )
}

function SuggestionDropdown(props: {
  anchorRef: React.RefObject<HTMLInputElement | null>
  suggestions: GatedNameSuggestion[]
  highlightedIndex: number
  loading?: boolean
  onSelect: (suggestion: GatedNameSuggestion) => void
  onHighlight: (index: number) => void
}) {
  const {anchorRef, suggestions, highlightedIndex, loading, onSelect, onHighlight} = props
  const [position, setPosition] = useState<{top: number; left: number; width: number} | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const update = () => {
      const rect = anchor.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 240),
      })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchorRef, suggestions.length, loading])

  if (!position || (!suggestions.length && !loading)) return null

  return createPortal(
    <Card
      border
      radius={2}
      shadow={2}
      padding={1}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 10000,
        maxHeight: 280,
        overflowY: 'auto',
      }}
      role="listbox"
    >
      {loading ? (
        <Box padding={2}>
          <Text size={1} muted>
            Loading names…
          </Text>
        </Box>
      ) : (
        <Stack space={1}>
          {suggestions.map((suggestion, index) => (
            <Box
              key={suggestion.name}
              as="button"
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(index)}
              onClick={() => onSelect(suggestion)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background:
                  suggestion.reviewFlagged
                    ? 'var(--card-badge-caution-bg-color, rgba(255, 193, 7, 0.12))'
                    : index === highlightedIndex
                      ? 'var(--card-link-fg-color, rgba(0,0,0,0.08))'
                      : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '6px 8px',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              <Flex align="center" gap={2}>
                {suggestion.url ? <LinkIcon /> : null}
                <Stack space={1}>
                  <Text size={1} weight="medium">
                    {suggestion.name}
                  </Text>
                  <Text size={0} muted>
                    {suggestionMeta(suggestion, suggestion.reviewFlagged)}
                    {suggestion.inRole ? ' · this role' : ''}
                  </Text>
                </Stack>
              </Flex>
            </Box>
          ))}
        </Stack>
      )}
    </Card>,
    document.body,
  )
}

export function PeopleChipsInput(props: {
  people: CrewPersonValue[]
  readOnly?: boolean
  placeholder?: string
  /** When set for a filter role, new people get identity refs from suggestions / ensure. */
  roleKey?: string
  linkMemory?: Map<string, KnownPersonLink>
  nameCatalog?: NameCatalogEntry[]
  roleCatalog?: NameCatalogEntry[]
  catalogReady?: boolean
  onCommit: (people: CrewPersonValue[]) => void
  /** Fired when a person link is set, changed, or cleared. */
  onLinkApplied?: (link: {
    name: string
    url: string
    linkTitle?: string
    identityId?: string
  }) => void
  /** Fired when a rename should propagate to other portfolio entries. */
  onRenameApplied?: (rename: {
    fromName: string
    toName: string
    identityId?: string
  }) => void
  /** creditIdentity._id → default url (for chips that inherit from identity). */
  identityUrlById?: ReadonlyMap<string, string>
  /** Department of the credit row — enables confidence-gated identity linking. */
  slotDepartment?: CrewDepartmentKey
  identityDepartmentsById?: ReadonlyMap<string, ReadonlySet<CrewDepartmentKey>>
  creditIdentities?: readonly CreditIdentityDoc[]
  onIdentityLinkReviewSkipped?: (info: {
    slotName: string
    candidateName: string
    candidateId: string
  }) => void
}) {
  const {
    people,
    readOnly,
    placeholder,
    roleKey,
    linkMemory,
    nameCatalog,
    roleCatalog,
    catalogReady = true,
    onCommit,
    onLinkApplied,
    onRenameApplied,
    identityUrlById,
    slotDepartment,
    identityDepartmentsById,
    creditIdentities,
    onIdentityLinkReviewSkipped,
  } = props
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<GatedNameSuggestion[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectingRef = useRef(false)

  const linkIdentities = isFilterCreditRoleKey(roleKey)

  const gateSuggestionIdentity = useCallback(
    (query: string, suggestion: NameSuggestion): GatedNameSuggestion => {
      if (
        !linkIdentities ||
        !suggestion.identityId ||
        !slotDepartment ||
        !identityDepartmentsById ||
        !creditIdentities?.length
      ) {
        return suggestion
      }

      const confidence = evaluateIdentityLinkConfidence(
        query.trim() || suggestion.name,
        suggestion.identityId,
        creditIdentities,
        {slotDepartment, identityDepartmentsById},
      )
      if (confidence && !isAutoLinkConfidence(confidence)) {
        return {
          ...suggestion,
          identityId: undefined,
          reviewFlagged: true,
          blockedIdentityId: suggestion.identityId,
        }
      }
      return suggestion
    },
    [creditIdentities, identityDepartmentsById, linkIdentities, slotDepartment],
  )

  const existingNames = useMemo(
    () => people.map((person) => person.name.trim()),
    [people],
  )

  const excludeNames = useMemo(() => existingNames, [existingNames])

  const existingNameKeys = useMemo(
    () => new Set(existingNames.map((name) => name.toLowerCase())),
    [existingNames],
  )

  const buildPerson = useCallback(
    (
      name: string,
      opts?: {url?: string; linkTitle?: string; identityId?: string},
    ): CrewPersonValue => {
      let person: CrewPersonValue = {_type: 'crewPerson', _key: newArrayKey(), name}
      if (opts?.url) {
        person = {...person, url: opts.url}
        if (opts.linkTitle) person.linkTitle = opts.linkTitle
      }
      if (linkIdentities && opts?.identityId) {
        person = {...person, identity: identityRef(opts.identityId)}
      }
      return linkMemory?.size ? enrichPersonWithLinkMemory(person, linkMemory) : person
    },
    [linkIdentities, linkMemory],
  )

  const addPerson = useCallback(
    (person: CrewPersonValue) => {
      const key = person.name.trim().toLowerCase()
      if (!key || existingNameKeys.has(key)) return
      onCommit([...people, person])
    },
    [existingNameKeys, onCommit, people],
  )

  const addNames = useCallback(
    (raw: string) => {
      const names = raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
      if (!names.length) return

      const additions: CrewPersonValue[] = []
      const seen = new Set(existingNameKeys)
      for (const name of names) {
        const key = name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        additions.push(buildPerson(name))
      }
      if (additions.length) {
        onCommit([...people, ...additions])
      }
    },
    [buildPerson, existingNameKeys, onCommit, people],
  )

  const selectSuggestion = useCallback(
    (suggestion: GatedNameSuggestion) => {
      selectingRef.current = true
      const typedName = draft.trim()

      if (suggestion.reviewFlagged && suggestion.blockedIdentityId) {
        onIdentityLinkReviewSkipped?.({
          slotName: typedName || suggestion.name,
          candidateName: suggestion.name,
          candidateId: suggestion.blockedIdentityId,
        })
      }

      const person = buildPerson(suggestion.name, {
        url: suggestion.url,
        linkTitle: suggestion.linkTitle,
        identityId: suggestion.identityId,
      })
      addPerson(person)
      setDraft('')
      setSuggestions([])
      setHighlightedIndex(-1)
      setMenuOpen(false)
      requestAnimationFrame(() => {
        selectingRef.current = false
        inputRef.current?.focus()
      })
    },
    [addPerson, buildPerson, draft, onIdentityLinkReviewSkipped],
  )

  useEffect(() => {
    if (readOnly || !catalogReady || !nameCatalog?.length) {
      setSuggestions([])
      setMenuOpen(false)
      return
    }

    const trimmed = draft.trim()
    if (trimmed.length < 2 || trimmed.includes(',')) {
      setSuggestions([])
      setMenuOpen(false)
      setHighlightedIndex(-1)
      return
    }

    const timer = window.setTimeout(() => {
      const next = searchNameSuggestions(trimmed, {
        siteCatalog: nameCatalog,
        roleCatalog,
        excludeNames,
      }).map((suggestion) => gateSuggestionIdentity(trimmed, suggestion))
      setSuggestions(next)
      setHighlightedIndex(next.length ? 0 : -1)
      setMenuOpen(next.length > 0)
    }, SUGGEST_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [catalogReady, draft, excludeNames, gateSuggestionIdentity, nameCatalog, readOnly, roleCatalog])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setHighlightedIndex(-1)
  }, [])

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.currentTarget.value
      if (!text.includes(',')) {
        setDraft(text)
        return
      }
      closeMenu()
      const segments = text.split(',')
      const remainder = segments.pop() ?? ''
      addNames(segments.join(','))
      setDraft(remainder.trimStart())
    },
    [addNames, closeMenu],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (menuOpen && suggestions.length) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setHighlightedIndex((index) => (index + 1) % suggestions.length)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setHighlightedIndex((index) =>
            index <= 0 ? suggestions.length - 1 : index - 1,
          )
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          closeMenu()
          return
        }
        if (event.key === 'Enter' && highlightedIndex >= 0) {
          event.preventDefault()
          const suggestion = suggestions[highlightedIndex]
          if (suggestion) selectSuggestion(suggestion)
          return
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        closeMenu()
        if (draft.trim()) {
          addNames(draft)
          setDraft('')
        }
        return
      }
      if (event.key === 'Backspace' && !draft && people.length) {
        onCommit(people.slice(0, -1))
      }
    },
    [
      addNames,
      closeMenu,
      draft,
      highlightedIndex,
      menuOpen,
      onCommit,
      people,
      selectSuggestion,
      suggestions,
    ],
  )

  const onBlur = useCallback(() => {
    if (selectingRef.current) return
    closeMenu()
    if (draft.trim()) {
      addNames(draft)
      setDraft('')
    }
  }, [addNames, closeMenu, draft])

  const updatePerson = useCallback(
    (
      target: CrewPersonValue,
      patch: {
        name: string
        url?: string
        linkTitle?: string
        identity?: CrewPersonValue['identity']
        urlChanged?: boolean
      },
    ) => {
      onCommit(
        people.map((person) => {
          if (person !== target) return person
          const next: CrewPersonValue = {
            _type: 'crewPerson',
            _key: person._key || newArrayKey(),
            name: patch.name,
          }
          const identity = patch.identity ?? person.identity
          if (identity?._ref) next.identity = identity
          // Identity-linked people: keep url off the credit when possible so
          // identity->url is the source of truth. Still stash locally when set
          // so this chip shows the link icon immediately.
          if (patch.url) {
            next.url = patch.url
            if (patch.linkTitle) next.linkTitle = patch.linkTitle
          } else if (!identity?._ref && person.linkTitle) {
            // cleared url on unlinked person — drop linkTitle too
          } else if (!identity?._ref && patch.linkTitle) {
            next.linkTitle = patch.linkTitle
          }
          return next
        }),
      )
      if (patch.urlChanged) {
        onLinkApplied?.({
          name: patch.name,
          url: patch.url ?? '',
          ...(patch.linkTitle ? {linkTitle: patch.linkTitle} : {}),
          ...(target.identity?._ref || patch.identity?._ref
            ? {identityId: (patch.identity ?? target.identity)?._ref}
            : {}),
        })
      }
    },
    [onCommit, onLinkApplied, people],
  )

  const removePerson = useCallback(
    (target: CrewPersonValue) => {
      onCommit(people.filter((person) => person !== target))
    },
    [onCommit, people],
  )

  const showLoading = !catalogReady && draft.trim().length >= 2

  return (
    <Box style={{position: 'relative'}}>
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
          {people.map((person, index) => (
          <PersonPill
            key={person._key ?? `${person.name}-${index}`}
            person={person}
            identityUrl={
              person.identity?._ref
                ? identityUrlById?.get(person.identity._ref)
                : undefined
            }
            readOnly={readOnly}
            onUpdate={(patch) => updatePerson(person, patch)}
            onRenameApplied={onRenameApplied}
            onRemove={() => removePerson(person)}
          />
          ))}
          <input
            ref={inputRef}
            value={draft}
            readOnly={readOnly}
            placeholder={people.length ? '' : (placeholder ?? 'Type names, comma separated')}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onFocus={() => {
              if (suggestions.length) setMenuOpen(true)
            }}
            aria-autocomplete="list"
            aria-expanded={menuOpen || showLoading}
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
      {menuOpen || showLoading ? (
        <SuggestionDropdown
          anchorRef={inputRef}
          suggestions={suggestions}
          highlightedIndex={highlightedIndex}
          loading={showLoading}
          onSelect={selectSuggestion}
          onHighlight={setHighlightedIndex}
        />
      ) : null}
    </Box>
  )
}
