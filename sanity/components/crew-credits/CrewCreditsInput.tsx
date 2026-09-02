/**
 * Custom input for portfolioEntry.crewCredits.
 *
 * Renders the structured credits array as a WordPress-style form:
 * department tabs, every standard role always visible as a comma-separated
 * text field, plus an Additional Credits row editor per department.
 * Also provides CSV template download / upload / preview / apply.
 *
 * Underlying storage stays the structured crewCredit array, so the CSV
 * importer, frontend rendering, and migration are unaffected.
 */

import {AddIcon, DownloadIcon, TrashIcon, UploadIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {set, unset, useClient, useFormValue, type ArrayOfObjectsInputProps, type ObjectItem} from 'sanity'

import {
  CREW_DEPARTMENTS,
  CREW_DEPARTMENT_BY_KEY,
  CREW_ROLE_BY_KEY,
  buildIdentityDepartmentUsageFromCredits,
  findIdentityByNameWithConfidence,
  getDepartmentLabel,
  isAutoLinkConfidence,
  normalizeCreditToken,
  resolveStandardRole,
  type CrewCreditValue,
  type CrewDepartmentKey,
  type CrewPersonValue,
  type CrewRoleDefinition,
  type NameCatalogEntry,
  buildNameCatalogFromCredits,
  mergeNameCatalogs,
} from '@crew-credits'

import {
  buildRejectedRowsCsv,
  mapCrewCreditsCsvRows,
  type MappedPreviewRow,
} from './csv-map'
import {mergeCrewCredits, sortCrewCredits, type CrewCreditsImportMode} from './csv-merge'
import {parseCrewCreditsCsv} from './csv-parse'
import {downloadCrewCreditsCsvTemplate, downloadTextFile} from './csv-template'
import {newArrayKey} from './keys'
import {
  buildLinkMemory,
  mergeLinkMemories,
  normalizePersonName,
  propagatePersonLinkAcrossPortfolio,
  propagatePersonRenameAcrossPortfolio,
  type KnownPersonLink,
} from './link-memory'
import {
  collapseSameNamePeopleInField,
  confirmNameDuplicate,
  countPendingDuplicates,
  duplicateAlertLabel,
  skipNameDuplicate,
} from './name-duplicates'
import {buildRoleCatalogIndexes, type RoleCatalogIndexes} from './name-catalog-index'
import {PeopleChipsInput} from './PeopleChipsInput'
import {PreviewPeopleChips} from './PreviewPeopleChips'
import {preparePreviewPeople} from './preview-people'
import {
  attachRoleSuggestions,
  confirmRoleSuggestion,
  countPendingRoleSuggestions,
  roleSuggestionLabel,
  skipRoleSuggestion,
} from './role-suggestions'
import {
  identityRef,
  isStudioIdentityLinkedRoleKey,
  newCreditIdentityDoc,
  type CreditIdentityDoc,
} from './sync-credit-identities'
import {FieldLabel} from '../FieldLabel'

type CrewCreditItem = ObjectItem & CrewCreditValue

interface PendingCustomRow {
  id: string
  role: string
  people: CrewPersonValue[]
}

/** Recompute preview row status after role/department/custom toggles. Preserves roleKey while custom for undo. */
function recomputePreviewRow(row: MappedPreviewRow): MappedPreviewRow {
  const department = row.department as CrewDepartmentKey | ''
  const roleLabel = row.roleLabel.trim()

  if (!row.people.length) {
    return {...row, status: 'invalid', error: 'At least one name is required'}
  }

  if (row.isCustomRole) {
    if (!department) {
      return {
        ...row,
        isCustomRole: true,
        status: 'invalid',
        error: 'Custom roles require a department',
      }
    }
    if (!roleLabel) {
      return {
        ...row,
        isCustomRole: true,
        status: 'invalid',
        error: 'Role label is required',
      }
    }
    return {
      ...row,
      department,
      roleLabel,
      isCustomRole: true,
      status: 'custom',
      error: undefined,
    }
  }

  if (row.roleKey && CREW_ROLE_BY_KEY.has(row.roleKey)) {
    const resolved = CREW_ROLE_BY_KEY.get(row.roleKey)!
    if (department && resolved.departmentKey !== department) {
      const fromLabel = resolveStandardRole(roleLabel || row.roleRaw, {
        department: department || null,
      })
      if (fromLabel && fromLabel.departmentKey === department) {
        return {
          ...row,
          department,
          roleKey: fromLabel.role.key,
          roleLabel: fromLabel.role.label,
          isCustomRole: false,
          status: row.warning ? 'warning' : 'mapped',
          error: undefined,
        }
      }
      return {
        ...row,
        department,
        roleKey: undefined,
        isCustomRole: false,
        status: 'invalid',
        error: 'Select a standard role',
      }
    }
    return {
      ...row,
      department: department || resolved.departmentKey,
      roleKey: resolved.role.key,
      roleLabel: roleLabel || resolved.role.label,
      isCustomRole: false,
      status: row.warning ? 'warning' : 'mapped',
      error: undefined,
    }
  }

  const fromLabel = resolveStandardRole(roleLabel || row.roleRaw, {
    department: department || null,
  })
  if (fromLabel && (!department || fromLabel.departmentKey === department)) {
    return {
      ...row,
      department: department || fromLabel.departmentKey,
      roleKey: fromLabel.role.key,
      roleLabel: fromLabel.role.label,
      isCustomRole: false,
      status: row.warning ? 'warning' : 'mapped',
      error: undefined,
    }
  }

  return {
    ...row,
    isCustomRole: false,
    roleKey: undefined,
    status: 'invalid',
    error: 'Select a standard role',
  }
}

/** Text input that keeps a local draft while typing and commits on blur/Enter. */
function CommitTextInput(props: {
  value: string
  readOnly?: boolean
  placeholder?: string
  onCommit: (next: string) => void
}) {
  const {value, readOnly, placeholder, onCommit} = props
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = useCallback(() => {
    if (draft !== value) onCommit(draft)
  }, [draft, value, onCommit])

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }, [])

  return (
    <TextInput
      value={draft}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  )
}

export function CrewCreditsInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange, readOnly} = props
  const toast = useToast()
  const client = useClient({apiVersion: '2024-01-01'})
  const documentId = useFormValue(['_id']) as string | undefined
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeDept, setActiveDept] = useState<CrewDepartmentKey>('production')
  const [dragging, setDragging] = useState(false)
  const dragDepthRef = useRef(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewRows, setPreviewRows] = useState<MappedPreviewRow[]>([])
  const [importMode, setImportMode] = useState<CrewCreditsImportMode>('fill')
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [pendingRows, setPendingRows] = useState<Record<string, PendingCustomRow[]>>({})
  const [siteLinkMemory, setSiteLinkMemory] = useState<Map<string, KnownPersonLink>>(
    () => new Map(),
  )
  const [siteNameCatalog, setSiteNameCatalog] = useState<NameCatalogEntry[]>([])
  const [identityUrlById, setIdentityUrlById] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [creditIdentities, setCreditIdentities] = useState<CreditIdentityDoc[]>([])
  const [identityDepartmentsById, setIdentityDepartmentsById] = useState<
    Map<string, Set<CrewDepartmentKey>>
  >(() => new Map())
  const [roleCatalogIndexes, setRoleCatalogIndexes] = useState<RoleCatalogIndexes>(() => ({
    roleCatalogByKey: new Map(),
    deptCatalogByKey: new Map(),
  }))
  const [catalogReady, setCatalogReady] = useState(false)
  const propagatingRef = useRef(false)

  const credits = useMemo(() => (value as CrewCreditItem[] | undefined) ?? [], [value])

  const documentLinkMemory = useMemo(
    () => buildLinkMemory(credits as CrewCreditValue[]),
    [credits],
  )

  const combinedLinkMemory = useMemo(
    () => mergeLinkMemories(siteLinkMemory, documentLinkMemory),
    [documentLinkMemory, siteLinkMemory],
  )

  const handlePersonLinkApplied = useCallback(
    async (link: {
      name: string
      url: string
      linkTitle?: string
      identityId?: string
    }) => {
      if (propagatingRef.current || readOnly) return
      propagatingRef.current = true
      try {
        const result = await propagatePersonLinkAcrossPortfolio(client, link, {
          excludeDocumentId: documentId,
        })
        if (link.identityId) {
          setIdentityUrlById((prev) => {
            const next = new Map(prev)
            if (link.url.trim()) next.set(link.identityId!, link.url.trim())
            else next.delete(link.identityId!)
            return next
          })
          setSiteNameCatalog((prev) =>
            prev.map((entry) =>
              entry.identityId === link.identityId
                ? {
                    ...entry,
                    ...(link.url.trim()
                      ? {url: link.url.trim()}
                      : {url: undefined}),
                  }
                : entry,
            ),
          )
        }
        setSiteLinkMemory((prev) => {
          const next = new Map(prev)
          const key = normalizePersonName(link.name)
          if (link.url.trim()) {
            next.set(key, {
              url: link.url.trim(),
              ...(link.linkTitle ? {linkTitle: link.linkTitle} : {}),
            })
          } else {
            next.delete(key)
          }
          return next
        })
        if (result.viaIdentity) {
          toast.push({
            status: 'success',
            title: link.url.trim() ? 'Link saved on crew member' : 'Link cleared on crew member',
            description: link.url.trim()
              ? `Updated once for “${link.name}” — all credits using this identity inherit it.`
              : `Cleared the default link for “${link.name}”.`,
          })
        } else if (result.documentsUpdated > 0) {
          toast.push({
            status: 'success',
            title: 'Link synced across portfolio',
            description: `Updated “${link.name}” on ${result.documentsUpdated} other portfolio ${result.documentsUpdated === 1 ? 'entry' : 'entries'} (${result.peopleUpdated} credit ${result.peopleUpdated === 1 ? 'slot' : 'slots'}).`,
          })
        }
      } catch (error) {
        toast.push({
          status: 'warning',
          title: 'Could not save link',
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        propagatingRef.current = false
      }
    },
    [client, documentId, readOnly, toast],
  )

  const handlePersonRenameApplied = useCallback(
    async (rename: {fromName: string; toName: string; identityId?: string}) => {
      if (propagatingRef.current || readOnly) return
      if (rename.fromName.trim() === rename.toName.trim()) return
      propagatingRef.current = true
      try {
        const result = await propagatePersonRenameAcrossPortfolio(client, rename, {
          excludeDocumentId: documentId,
        })
        const fromKey = normalizePersonName(rename.fromName)
        setSiteNameCatalog((prev) =>
          prev.map((entry) => {
            if (rename.identityId && entry.identityId === rename.identityId) {
              return {...entry, name: rename.toName.trim()}
            }
            if (!rename.identityId && normalizePersonName(entry.name) === fromKey) {
              return {...entry, name: rename.toName.trim()}
            }
            return entry
          }),
        )
        setSiteLinkMemory((prev) => {
          const known = prev.get(fromKey)
          if (!known) return prev
          const next = new Map(prev)
          next.delete(fromKey)
          next.set(normalizePersonName(rename.toName), known)
          return next
        })
        if (result.documentsUpdated > 0) {
          toast.push({
            status: 'success',
            title: 'Name renamed across portfolio',
            description: `Updated “${rename.fromName}” → “${rename.toName}” on ${result.documentsUpdated} other portfolio ${result.documentsUpdated === 1 ? 'entry' : 'entries'} (${result.peopleUpdated} credit ${result.peopleUpdated === 1 ? 'slot' : 'slots'}).`,
          })
        }
      } catch (error) {
        toast.push({
          status: 'warning',
          title: 'Could not rename on other pages',
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        propagatingRef.current = false
      }
    },
    [client, documentId, readOnly, toast],
  )

  const handleIdentityLinkReviewSkipped = useCallback(
    (info: {slotName: string; candidateName: string; candidateId: string}) => {
      toast.push({
        status: 'warning',
        title: 'Possible identity match — not linked',
        description: `“${info.slotName}” looks similar to existing “${info.candidateName}” in another department. Added without an identity link — confirm manually if they are the same person.`,
      })
    },
    [toast],
  )

  // Load site-wide name catalog + credit identities + link memory once.
  useEffect(() => {
    let cancelled = false
    Promise.all([
      client.fetch<
        {
          crewCredits?: {
            department?: CrewDepartmentKey
            roleKey?: string
            role?: string
            isCustomRole?: boolean
            people?: {
              name?: string
              url?: string
              linkTitle?: string
              identity?: {_ref?: string}
            }[]
          }[]
        }[]
      >(
        `*[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
          crewCredits[]{
            department,
            roleKey,
            role,
            isCustomRole,
            people[]{ name, url, linkTitle, identity }
          }
        }`,
      ),
      client.fetch<CreditIdentityDoc[]>(
        `*[_type == "creditIdentity"]{ _id, name, url }`,
      ),
    ])
      .then(([docs, identities]) => {
        if (cancelled) return
        const creditRows = (docs ?? []).flatMap((doc) => doc.crewCredits ?? [])
        const people = creditRows.flatMap((credit) => credit.people ?? [])
        const fromCredits = buildNameCatalogFromCredits(creditRows)
        const fromIdentities: NameCatalogEntry[] = (identities ?? []).map((doc) => ({
          name: doc.name,
          count: 1,
          identityId: doc._id,
          ...(doc.url ? {url: doc.url} : {}),
        }))
        const urlMap = new Map<string, string>()
        for (const doc of identities ?? []) {
          if (doc.url?.trim()) urlMap.set(doc._id, doc.url.trim())
        }
        setIdentityUrlById(urlMap)
        setCreditIdentities(identities ?? [])
        setIdentityDepartmentsById(
          buildIdentityDepartmentUsageFromCredits(
            (docs ?? []).map((doc) => ({
              crewCredits: (doc.crewCredits ?? []) as CrewCreditValue[],
            })),
          ),
        )
        setSiteNameCatalog(mergeNameCatalogs(fromIdentities, fromCredits))
        setRoleCatalogIndexes(buildRoleCatalogIndexes(creditRows))
        setSiteLinkMemory(
          buildLinkMemory(
            people
              .filter((person) => person.url?.trim())
              .map((person) => ({
                _type: 'crewPerson' as const,
                name: person.name ?? '',
                ...(person.url ? {url: person.url} : {}),
                ...(person.linkTitle ? {linkTitle: person.linkTitle} : {}),
                ...(person.identity?._ref
                  ? {identity: {_type: 'reference' as const, _ref: person.identity._ref}}
                  : {}),
              })),
          ),
        )
        setCatalogReady(true)
      })
      .catch(() => {
        // Non-fatal — import still works without site-wide memory.
        if (!cancelled) setCatalogReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const nameCatalog = useMemo(() => {
    const documentRows = (credits as CrewCreditValue[]).map((credit) => ({
      roleKey: credit.roleKey,
      role: credit.role,
      isCustomRole: credit.isCustomRole,
      people: credit.people ?? [],
    }))
    if (!documentRows.some((row) => row.people.length)) {
      return siteNameCatalog
    }
    return mergeNameCatalogs(
      siteNameCatalog,
      buildNameCatalogFromCredits(documentRows),
    )
  }, [credits, siteNameCatalog])
  const commitCredits = useCallback(
    (next: CrewCreditValue[]) => {
      if (!next.length) {
        onChange(unset())
        return
      }
      onChange(set(sortCrewCredits(next)))
    },
    [onChange],
  )

  // --- standard role fields --------------------------------------------------

  const findStandard = useCallback(
    (dept: CrewDepartmentKey, roleKey: string) =>
      credits.find(
        (credit) =>
          credit.department === dept && !credit.isCustomRole && credit.roleKey === roleKey,
      ),
    [credits],
  )

  const ensureIdentitiesOnPeople = useCallback(
    async (
      people: CrewPersonValue[],
      slotDepartment: CrewDepartmentKey,
    ): Promise<CrewPersonValue[]> => {
      if (!people.length) return people
      const existing = await client.fetch<CreditIdentityDoc[]>(
        `*[_type == "creditIdentity"]{ _id, name, url }`,
      )
      const known = [...(existing ?? [])]
      const pendingByName = new Map<string, string>()
      const next: CrewPersonValue[] = []
      const reviewSkipped: Array<{slotName: string; candidateName: string}> = []

      const linkContext = {
        slotDepartment,
        identityDepartmentsById,
      }

      for (const person of people) {
        if (person.identity?._ref || !person.name?.trim()) {
          next.push(person)
          continue
        }
        const name = person.name.trim()
        const key = normalizeCreditToken(name)
        const match = findIdentityByNameWithConfidence(name, known, linkContext)

        if (match && isAutoLinkConfidence(match.confidence)) {
          next.push({
            ...person,
            identity: identityRef(match.identity._id),
            name: match.identity.name,
          })
          continue
        }

        if (match?.confidence === 'review') {
          reviewSkipped.push({slotName: name, candidateName: match.identity.name})
          next.push(person)
          continue
        }

        const pending = pendingByName.get(key)
        if (pending) {
          next.push({...person, identity: identityRef(pending)})
          continue
        }

        const doc = newCreditIdentityDoc(name, {url: person.url})
        await client.createIfNotExists(doc)
        known.push({_id: doc._id, name: doc.name, url: doc.url})
        pendingByName.set(key, doc._id)
        next.push({...person, identity: identityRef(doc._id)})
        setSiteNameCatalog((prev) =>
          mergeNameCatalogs(prev, [
            {
              name: doc.name,
              count: 1,
              identityId: doc._id,
              ...(doc.url ? {url: doc.url} : {}),
            },
          ]),
        )
      }

      if (reviewSkipped.length) {
        const summary = reviewSkipped
          .map(
            (row) =>
              `“${row.slotName}” (similar to existing “${row.candidateName}” in another department)`,
          )
          .join('; ')
        toast.push({
          status: 'warning',
          title: 'Identity link needs review',
          description: `${summary} — saved without linking. Confirm manually if they are the same person.`,
        })
      }

      return next
    },
    [client, identityDepartmentsById, toast],
  )

  const commitStandardPeople = useCallback(
    async (dept: CrewDepartmentKey, role: CrewRoleDefinition, people: CrewPersonValue[]) => {
      const existing = findStandard(dept, role.key)
      const next = credits.filter((credit) => credit !== existing)

      let linkedPeople = people
      if (people.length && isStudioIdentityLinkedRoleKey(role.key)) {
        try {
          linkedPeople = await ensureIdentitiesOnPeople(people, dept)
        } catch (error) {
          toast.push({
            status: 'warning',
            title: 'Could not link credit identities',
            description: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      if (linkedPeople.length) {
        next.push({
          _type: 'crewCredit',
          _key: existing?._key || newArrayKey(),
          department: dept,
          roleKey: role.key,
          role: role.label,
          isCustomRole: false,
          people: linkedPeople,
        })
      }

      commitCredits(next)
    },
    [commitCredits, credits, ensureIdentitiesOnPeople, findStandard, toast],
  )

  // --- custom (additional) rows ----------------------------------------------

  const customRowsFor = useCallback(
    (dept: CrewDepartmentKey) =>
      credits.filter(
        (credit) => credit.department === dept && (credit.isCustomRole || !credit.roleKey),
      ),
    [credits],
  )

  const commitCustomRow = useCallback(
    (item: CrewCreditItem, patch: {role?: string; people?: CrewPersonValue[]}) => {
      const role = (patch.role ?? item.role).trim()
      const people = patch.people ?? item.people ?? []

      const next = credits.filter((credit) => credit !== item)
      if (role || people.length) {
        next.push({
          ...item,
          role,
          isCustomRole: true,
          roleKey: undefined,
          people,
        })
      }
      commitCredits(next)
    },
    [commitCredits, credits],
  )

  const removeCustomRow = useCallback(
    (item: CrewCreditItem) => {
      commitCredits(credits.filter((credit) => credit !== item))
    },
    [commitCredits, credits],
  )

  const addPendingRow = useCallback((dept: CrewDepartmentKey) => {
    setPendingRows((prev) => ({
      ...prev,
      [dept]: [...(prev[dept] ?? []), {id: newArrayKey(), role: '', people: []}],
    }))
  }, [])

  const updatePendingRow = useCallback(
    (dept: CrewDepartmentKey, id: string, patch: {role?: string; people?: CrewPersonValue[]}) => {
      setPendingRows((prev) => {
        const rows = prev[dept] ?? []
        const nextRows = rows.map((row) => (row.id === id ? {...row, ...patch} : row))
        const target = nextRows.find((row) => row.id === id)

        // Promote to a real credit once both role and at least one name exist.
        if (target && target.role.trim() && target.people.length) {
          commitCredits([
            ...credits,
            {
              _type: 'crewCredit',
              _key: newArrayKey(),
              department: dept,
              role: target.role.trim(),
              isCustomRole: true,
              people: target.people,
            },
          ])
          return {...prev, [dept]: nextRows.filter((row) => row.id !== id)}
        }

        return {...prev, [dept]: nextRows}
      })
    },
    [commitCredits, credits],
  )

  const removePendingRow = useCallback((dept: CrewDepartmentKey, id: string) => {
    setPendingRows((prev) => ({
      ...prev,
      [dept]: (prev[dept] ?? []).filter((row) => row.id !== id),
    }))
  }, [])

  // --- CSV import -------------------------------------------------------------

  const stats = useMemo(() => {
    const blocking = previewRows.filter((row) => row.status === 'invalid').length
    const mapped = previewRows.filter(
      (row) => row.status === 'mapped' || row.status === 'warning',
    ).length
    const custom = previewRows.filter((row) => row.status === 'custom').length
    const warnings = previewRows.filter((row) => row.warning).length
    const duplicates = countPendingDuplicates(previewRows)
    const roleSuggestions = countPendingRoleSuggestions(previewRows)
    return {blocking, mapped, custom, warnings, duplicates, roleSuggestions}
  }, [previewRows])

  const applyDisabled =
    readOnly ||
    stats.blocking > 0 ||
    stats.duplicates > 0 ||
    stats.roleSuggestions > 0 ||
    previewRows.length === 0 ||
    (importMode === 'replace' && !confirmReplace)

  const ingestFile = useCallback(
    async (file: File) => {
      if (readOnly) return
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.push({status: 'error', title: 'Please upload a .csv file'})
        return
      }

      const text = await file.text()
      const parsed = parseCrewCreditsCsv(text)
      if (parsed.errors.length) {
        setParseErrors(parsed.errors)
        setPreviewRows([])
        setDialogOpen(true)
        return
      }

      const mapped = mapCrewCreditsCsvRows(parsed.rows, credits as CrewCreditValue[])
      const linkMemory = mergeLinkMemories(siteLinkMemory, documentLinkMemory)
      const withPeople = mapped.previewRows.map((row) => ({
        ...row,
        people: preparePreviewPeople(row.people, nameCatalog, linkMemory),
      }))
      setParseErrors([])
      setPreviewRows(attachRoleSuggestions(withPeople))
      setImportMode('fill')
      setConfirmReplace(false)
      setDialogOpen(true)
    },
    [credits, documentLinkMemory, nameCatalog, readOnly, siteLinkMemory, toast],
  )

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) void ingestFile(file)
    },
    [ingestFile],
  )

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragDepthRef.current = 0
      setDragging(false)
      const file = event.dataTransfer.files?.[0]
      if (file) void ingestFile(file)
    },
    [ingestFile],
  )

  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current += 1
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setDragging(false)
    }
  }, [])

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const updateRow = useCallback(
    (id: string, patch: Partial<MappedPreviewRow>) => {
      setPreviewRows((rows) =>
        attachRoleSuggestions(
          rows.map((row) => {
            if (row.id !== id) return row

            let next: MappedPreviewRow = {...row, ...patch}

            if (
              patch.roleLabel !== undefined ||
              patch.department !== undefined ||
              patch.isCustomRole !== undefined ||
              patch.roleKey !== undefined
            ) {
              next = recomputePreviewRow(next)
            } else if (!next.people.length && next.status !== 'invalid') {
              next = {...next, status: 'invalid', error: 'At least one name is required'}
            }

            if (patch.people !== undefined) {
              const linkMemory = mergeLinkMemories(siteLinkMemory, documentLinkMemory)
              next = {
                ...next,
                people: preparePreviewPeople(next.people, nameCatalog, linkMemory),
              }
            }

            return next
          }),
        ),
      )
    },
    [documentLinkMemory, nameCatalog, siteLinkMemory],
  )

  const resolveDuplicate = useCallback(
    (rowId: string, personIndex: number, action: 'confirm' | 'skip') => {
      let rename: {fromName: string; toName: string} | null = null

      setPreviewRows((rows) =>
        rows.map((row) => {
          if (row.id !== rowId) return row
          const people = row.people.map((person, index) => {
            if (index !== personIndex) return person
            if (action === 'confirm') {
              const alert = person.duplicate
              if (alert?.candidate) {
                rename = {
                  fromName: alert.originalName || person.name,
                  toName: alert.candidate,
                }
              }
              return confirmNameDuplicate(person)
            }
            return skipNameDuplicate(person)
          })
          return {
            ...row,
            people:
              action === 'confirm' ? collapseSameNamePeopleInField(people) : people,
          }
        }),
      )

      if (rename) {
        void handlePersonRenameApplied(rename)
      }
    },
    [handlePersonRenameApplied],
  )

  const resolveRoleSuggestion = useCallback((rowId: string, action: 'confirm' | 'skip') => {
    setPreviewRows((rows) =>
      attachRoleSuggestions(
        rows.map((row) => {
          if (row.id !== rowId) return row
          return action === 'confirm' ? confirmRoleSuggestion(row) : skipRoleSuggestion(row)
        }),
      ),
    )
  }, [])
  const applyImport = useCallback(() => {
    if (applyDisabled) return
    // Document links win over site-wide memory for the same name.
    const linkMemory = mergeLinkMemories(siteLinkMemory, documentLinkMemory)
    const result = mergeCrewCredits(
      credits as CrewCreditValue[],
      previewRows,
      importMode,
      linkMemory,
    )
    commitCredits(result.credits)
    setDialogOpen(false)
    setPreviewRows([])
    const linkNote =
      result.linksEnriched > 0
        ? ` Auto-linked ${result.linksEnriched} known name${result.linksEnriched === 1 ? '' : 's'}.`
        : ''
    toast.push({
      status: 'success',
      title: 'Crew credits updated in draft',
      description: `Added ${result.added}, updated ${result.updated}, preserved ${result.skippedPreserved}.${linkNote} Save/publish when ready.`,
    })
  }, [
    applyDisabled,
    commitCredits,
    credits,
    documentLinkMemory,
    importMode,
    previewRows,
    siteLinkMemory,
    toast,
  ])

  const clearAll = useCallback(() => {
    if (readOnly) return
    if (
      !window.confirm(
        'Clear all crew credits from this draft? This does not publish until you save.',
      )
    ) {
      return
    }
    commitCredits([])
    setPendingRows({})
  }, [commitCredits, readOnly])

  // --- render ------------------------------------------------------------------

  return (
    <Stack space={4}>
      <Card
        padding={3}
        radius={2}
        shadow={1}
        tone={dragging ? 'primary' : 'transparent'}
        border
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Flex align="center" gap={2} wrap="wrap">
          <Button
            icon={DownloadIcon}
            text="Download template"
            mode="ghost"
            fontSize={1}
            onClick={() => downloadCrewCreditsCsvTemplate()}
          />
          <Button
            icon={UploadIcon}
            text="Upload CSV"
            tone="primary"
            fontSize={1}
            disabled={Boolean(readOnly)}
            onClick={() => fileInputRef.current?.click()}
          />
          <Button
            icon={TrashIcon}
            text="Clear all"
            mode="bleed"
            tone="critical"
            fontSize={1}
            disabled={Boolean(readOnly) || !credits.length}
            onClick={clearAll}
          />
          <Text size={1} muted>
            Upload or drag a CSV here to preview and fill the fields below. Links are managed in
            Studio — known names (e.g. Vantage Pictures, Govee) auto-link on import.
          </Text>
        </Flex>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onFileChange}
        />
      </Card>

      <TabList space={1}>
        {CREW_DEPARTMENTS.map((dept) => (
          <Tab
            key={dept.key}
            id={`crew-dept-tab-${dept.key}`}
            aria-controls={`crew-dept-panel-${dept.key}`}
            label={dept.label}
            selected={activeDept === dept.key}
            onClick={() => setActiveDept(dept.key)}
          />
        ))}
      </TabList>

      {CREW_DEPARTMENTS.map((dept) => {
        const customRows = customRowsFor(dept.key)
        const pending = pendingRows[dept.key] ?? []

        return (
          <TabPanel
            key={dept.key}
            id={`crew-dept-panel-${dept.key}`}
            aria-labelledby={`crew-dept-tab-${dept.key}`}
            hidden={activeDept !== dept.key}
          >
            <Stack space={4}>
              <Grid columns={[1, 1, 2]} gap={3}>
                {dept.roles.map((role) => {
                  const existing = findStandard(dept.key, role.key)
                  return (
                    <Stack key={role.key} space={2}>
                      <Text size={1} weight="semibold">
                        {role.label}
                      </Text>
                      <PeopleChipsInput
                        people={existing?.people ?? []}
                        readOnly={Boolean(readOnly)}
                        roleKey={role.key}
                        linkMemory={combinedLinkMemory}
                        nameCatalog={nameCatalog}
                        roleCatalog={roleCatalogIndexes.roleCatalogByKey.get(role.key)}
                        catalogReady={catalogReady}
                        identityUrlById={identityUrlById}
                        {...(isStudioIdentityLinkedRoleKey(role.key)
                          ? {
                              slotDepartment: dept.key,
                              identityDepartmentsById,
                              creditIdentities,
                              onIdentityLinkReviewSkipped: handleIdentityLinkReviewSkipped,
                            }
                          : {})}
                        onCommit={(people) => {
                          void commitStandardPeople(dept.key, role, people)
                        }}
                        onLinkApplied={handlePersonLinkApplied}
                        onRenameApplied={handlePersonRenameApplied}
                      />
                    </Stack>
                  )
                })}
              </Grid>

              <Stack space={3}>
                <Text size={1} weight="semibold">
                  Additional {dept.label} Credits
                </Text>

                {!customRows.length && !pending.length ? (
                  <Text size={1} muted>
                    No custom roles yet.
                  </Text>
                ) : null}

                {customRows.map((item) => (
                  <Flex key={item._key} gap={2} align="flex-end">
                    <Box flex={1}>
                      <Stack space={2}>
                        <Text size={0} muted>
                          Role
                        </Text>
                        <CommitTextInput
                          value={item.role}
                          readOnly={Boolean(readOnly)}
                          placeholder="e.g. Runner"
                          onCommit={(role) => commitCustomRow(item, {role})}
                        />
                      </Stack>
                    </Box>
                    <Box flex={2}>
                      <Stack space={2}>
                        <Text size={0} muted>
                          Names
                        </Text>
                        <PeopleChipsInput
                          people={item.people ?? []}
                          readOnly={Boolean(readOnly)}
                          linkMemory={combinedLinkMemory}
                          nameCatalog={nameCatalog}
                          roleCatalog={roleCatalogIndexes.deptCatalogByKey.get(dept.key)}
                          catalogReady={catalogReady}
                          identityUrlById={identityUrlById}
                          onCommit={(people) => commitCustomRow(item, {people})}
                          onLinkApplied={handlePersonLinkApplied}
                          onRenameApplied={handlePersonRenameApplied}
                        />
                      </Stack>
                    </Box>
                    <Button
                      icon={TrashIcon}
                      mode="bleed"
                      tone="critical"
                      disabled={Boolean(readOnly)}
                      onClick={() => removeCustomRow(item)}
                    />
                  </Flex>
                ))}

                {pending.map((row) => (
                  <Flex key={row.id} gap={2} align="flex-end">
                    <Box flex={1}>
                      <Stack space={2}>
                        <Text size={0} muted>
                          Role
                        </Text>
                        <CommitTextInput
                          value={row.role}
                          readOnly={Boolean(readOnly)}
                          placeholder="e.g. Runner"
                          onCommit={(role) => updatePendingRow(dept.key, row.id, {role})}
                        />
                      </Stack>
                    </Box>
                    <Box flex={2}>
                      <Stack space={2}>
                        <Text size={0} muted>
                          Names
                        </Text>
                        <PeopleChipsInput
                          people={row.people}
                          readOnly={Boolean(readOnly)}
                          linkMemory={combinedLinkMemory}
                          nameCatalog={nameCatalog}
                          roleCatalog={roleCatalogIndexes.deptCatalogByKey.get(dept.key)}
                          catalogReady={catalogReady}
                          identityUrlById={identityUrlById}
                          onCommit={(people) => updatePendingRow(dept.key, row.id, {people})}
                          onLinkApplied={handlePersonLinkApplied}
                          onRenameApplied={handlePersonRenameApplied}
                        />
                      </Stack>
                    </Box>
                    <Button
                      icon={TrashIcon}
                      mode="bleed"
                      tone="critical"
                      onClick={() => removePendingRow(dept.key, row.id)}
                    />
                  </Flex>
                ))}

                <Box>
                  <Button
                    icon={AddIcon}
                    text="Add Row"
                    mode="ghost"
                    fontSize={1}
                    disabled={Boolean(readOnly)}
                    onClick={() => addPendingRow(dept.key)}
                  />
                </Box>
              </Stack>
            </Stack>
          </TabPanel>
        )
      })}

      {dialogOpen ? (
        <Dialog
          id="crew-credits-csv-preview"
          header="CSV Import Preview"
          width={2}
          onClose={() => setDialogOpen(false)}
        >
          <Box padding={4}>
            <Stack space={4}>
              {parseErrors.length ? (
                <Card padding={3} radius={2} tone="critical">
                  <Stack space={2}>
                    {parseErrors.map((error) => (
                      <Text key={error} size={1}>
                        {error}
                      </Text>
                    ))}
                  </Stack>
                </Card>
              ) : (
                <>
                  <Flex gap={3} wrap="wrap">
                    <PreviewStatText count={stats.mapped} tone="positive">
                      Mapped: {stats.mapped}
                    </PreviewStatText>
                    <PreviewStatText count={stats.custom} tone="positive">
                      Custom: {stats.custom}
                    </PreviewStatText>
                    <PreviewStatText count={stats.warnings} tone="caution">
                      Warnings: {stats.warnings}
                    </PreviewStatText>
                    <PreviewStatText count={stats.duplicates} tone="caution">
                      Duplicates: {stats.duplicates}
                    </PreviewStatText>
                    <PreviewStatText count={stats.roleSuggestions} tone="caution">
                      Role variants: {stats.roleSuggestions}
                    </PreviewStatText>
                    <PreviewStatText count={stats.blocking} tone="critical">
                      Errors: {stats.blocking}
                    </PreviewStatText>
                  </Flex>

                  <Stack space={3}>
                    <Text size={1} weight="semibold">
                      Import mode
                    </Text>
                    <Select
                      value={importMode}
                      onChange={(event) => {
                        setImportMode(event.currentTarget.value as CrewCreditsImportMode)
                        setConfirmReplace(false)
                      }}
                    >
                      <option value="fill">Fill empty (preserve existing roles)</option>
                      <option value="replace">Overwrite matching roles</option>
                    </Select>
                    <Text size={0} muted>
                      {importMode === 'fill'
                        ? 'Only fills roles that are empty on this entry. Existing names are kept; new CSV roles are added.'
                        : 'For roles that exist on this entry and appear in the CSV, names are replaced with CSV values. Roles not in the CSV are unchanged.'}
                    </Text>
                    {importMode === 'replace' ? (
                      <Flex align="center" gap={2}>
                        <Checkbox
                          id="confirm-replace-credits"
                          checked={confirmReplace}
                          onChange={(event) => setConfirmReplace(event.currentTarget.checked)}
                        />
                        <Text as="label" htmlFor="confirm-replace-credits" size={1}>
                          I understand CSV names will overwrite existing names for matching roles
                        </Text>
                      </Flex>
                    ) : null}
                  </Stack>

                  <PreviewSection
                    title="Import preview"
                    rows={previewRows.filter(
                      (row) =>
                        row.status === 'mapped' ||
                        row.status === 'warning' ||
                        row.status === 'custom',
                    )}
                    nameCatalog={nameCatalog}
                    linkMemory={combinedLinkMemory}
                    onChange={updateRow}
                    onResolveDuplicate={resolveDuplicate}
                    onResolveRoleSuggestion={resolveRoleSuggestion}
                  />
                  <PreviewSection
                    title="Errors"
                    rows={previewRows.filter((row) => row.status === 'invalid')}
                    nameCatalog={nameCatalog}
                    linkMemory={combinedLinkMemory}
                    onChange={updateRow}
                    onResolveDuplicate={resolveDuplicate}
                    onResolveRoleSuggestion={resolveRoleSuggestion}
                    tone="critical"
                  />
                </>
              )}

              <Flex justify="space-between" gap={2} wrap="wrap">
                <Flex gap={2}>
                  <Button
                    text="Download rejected rows"
                    mode="ghost"
                    disabled={!stats.blocking}
                    onClick={() =>
                      downloadTextFile(
                        'crew-credits-rejected.csv',
                        buildRejectedRowsCsv(previewRows),
                      )
                    }
                  />
                </Flex>
                <Flex gap={2}>
                  <Button text="Cancel" mode="ghost" onClick={() => setDialogOpen(false)} />
                  <Button
                    text="Apply to draft"
                    tone="primary"
                    disabled={applyDisabled || Boolean(parseErrors.length)}
                    onClick={applyImport}
                  />
                </Flex>
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </Stack>
  )
}

function PreviewStatText(props: {
  count: number
  tone?: 'positive' | 'caution' | 'critical'
  children: ReactNode
}) {
  const {count, tone, children} = props
  const color =
    count > 0 && tone
      ? {
          positive: 'var(--card-badge-positive-fg-color, #3ecf8e)',
          caution: 'var(--card-badge-caution-fg-color, #f5a623)',
          critical: 'var(--card-badge-critical-fg-color, #f03e3e)',
        }[tone]
      : undefined

  return (
    <Text size={1} weight={tone === 'critical' && count > 0 ? 'semibold' : undefined} style={{color}}>
      {children}
    </Text>
  )
}

function PreviewRowPanel(props: {
  row: MappedPreviewRow
  sectionTone?: 'critical' | 'default'
  children: ReactNode
}) {
  const {row, sectionTone, children} = props
  const isInvalid = sectionTone === 'critical' || row.status === 'invalid'
  const isWarning = Boolean(row.warning) && !isInvalid

  if (isInvalid) {
    return (
      <Card padding={3} radius={2} border shadow={1} tone="critical">
        {children}
      </Card>
    )
  }

  if (isWarning) {
    return (
      <Card padding={3} radius={2} border shadow={1} tone="caution">
        {children}
      </Card>
    )
  }

  // Darker panel shell only — fields keep default input styling from the dialog.
  return (
    <Box
      padding={3}
      style={{
        backgroundColor: 'var(--card-code-bg-color)',
        border: '1px solid var(--card-border-color)',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.24)',
      }}
    >
      {children}
    </Box>
  )
}

function PreviewSection(props: {
  title: string
  rows: MappedPreviewRow[]
  nameCatalog: NameCatalogEntry[]
  linkMemory: Map<string, KnownPersonLink>
  onChange: (id: string, patch: Partial<MappedPreviewRow>) => void
  onResolveDuplicate: (rowId: string, personIndex: number, action: 'confirm' | 'skip') => void
  onResolveRoleSuggestion: (rowId: string, action: 'confirm' | 'skip') => void
  tone?: 'critical' | 'default'
}) {
  const {
    title,
    rows,
    nameCatalog,
    linkMemory,
    onChange,
    onResolveDuplicate,
    onResolveRoleSuggestion,
    tone,
  } = props
  if (!rows.length) return null

  return (
    <Stack space={3}>
      <Text size={1} weight="semibold">
        {title} ({rows.length})
      </Text>
      {rows.map((row) => {
        const existingNames = row.existingPeople.map((person) => person.name).join(', ')
        const existingUrls = row.existingPeople.map((person) => person.url?.trim() ?? '')
        const hasExistingUrls = existingUrls.some(Boolean)
        const roleAlert = row.roleSuggestion

        return (
        <PreviewRowPanel key={row.id} row={row} sectionTone={tone}>
          <Stack space={3}>
            {row.error || row.warning ? (
              <Text
                size={1}
                weight="medium"
                style={{
                  color: row.error
                    ? 'var(--card-badge-critical-fg-color, #f03e3e)'
                    : 'var(--card-badge-caution-fg-color, #f5a623)',
                }}
              >
                {row.error ?? row.warning}
              </Text>
            ) : null}
            {roleAlert?.status === 'pending' ? (
              <Card padding={2} radius={2} tone="caution" border>
                <Stack space={2}>
                  <Text size={1}>{roleSuggestionLabel(roleAlert)}</Text>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      text="Confirm merge"
                      tone="caution"
                      fontSize={1}
                      onClick={() => onResolveRoleSuggestion(row.id, 'confirm')}
                    />
                    <Button
                      text="Skip"
                      mode="ghost"
                      fontSize={1}
                      onClick={() => onResolveRoleSuggestion(row.id, 'skip')}
                    />
                  </Flex>
                </Stack>
              </Card>
            ) : null}
            {roleAlert?.status === 'skipped' ? (
              <Text size={0} muted>
                Skipped role merge for {roleAlert.originalRole}
              </Text>
            ) : null}
            {roleAlert?.status === 'confirmed' ? (
              <Text size={0} muted>
                Merged role to “{roleAlert.label}”
              </Text>
            ) : null}
            <Flex gap={2} wrap="wrap">
              <Box flex={1} style={{minWidth: 140}}>
                <Stack space={2}>
                  <FieldLabel>Department</FieldLabel>
                  <Select
                    value={row.department}
                    onChange={(event) =>
                      onChange(row.id, {
                        department: event.currentTarget.value as CrewDepartmentKey | '',
                      })
                    }
                  >
                    <option value="">Select…</option>
                    {CREW_DEPARTMENTS.map((dept) => (
                      <option key={dept.key} value={dept.key}>
                        {dept.label}
                      </option>
                    ))}
                  </Select>
                </Stack>
              </Box>
              <Box flex={1} style={{minWidth: 160}}>
                <Stack space={2}>
                  <FieldLabel>Role</FieldLabel>
                  {row.isCustomRole ? (
                    <TextInput
                      value={row.roleLabel}
                      onChange={(event) =>
                        onChange(row.id, {
                          roleLabel: event.currentTarget.value,
                        })
                      }
                    />
                  ) : (
                    <Select
                      value={row.roleKey ?? ''}
                      disabled={!row.department}
                      onChange={(event) => {
                        const roleKey = event.currentTarget.value
                        const resolved = CREW_ROLE_BY_KEY.get(roleKey)
                        onChange(row.id, {
                          roleKey,
                          roleLabel: resolved?.role.label ?? row.roleLabel,
                          department: resolved?.departmentKey ?? row.department,
                          isCustomRole: false,
                        })
                      }}
                    >
                      <option value="">{row.department ? 'Select…' : 'Select department first'}</option>
                      {(row.department
                        ? CREW_DEPARTMENT_BY_KEY[row.department as CrewDepartmentKey]?.roles
                        : []
                      )?.map((role) => (
                        <option key={role.key} value={role.key}>
                          {role.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Stack>
              </Box>
            </Flex>
            <Stack space={2}>
              <PreviewPeopleChips
                people={row.people}
                nameCatalog={nameCatalog}
                linkMemory={linkMemory}
                onChange={(people) => onChange(row.id, {people})}
              />
              {existingNames ? (
                <Text size={0} muted>
                  Current names: {existingNames}
                  {hasExistingUrls ? ` · URLs: ${existingUrls.filter(Boolean).join(', ')}` : ''}
                </Text>
              ) : null}
              {row.people.map((person, personIndex) => {
                const alert = person.duplicate
                if (!alert) return null
                if (alert.status === 'skipped') {
                  return (
                    <Text key={`${row.id}-dup-${personIndex}`} size={0} muted>
                      Skipped merge for {alert.originalName}
                    </Text>
                  )
                }
                if (alert.status === 'confirmed') {
                  return (
                    <Text key={`${row.id}-dup-${personIndex}`} size={0} muted>
                      Merged to “{alert.candidate}”
                      {person.url ? ` · ${person.url}` : ''}
                    </Text>
                  )
                }
                return (
                  <Card
                    key={`${row.id}-dup-${personIndex}`}
                    padding={2}
                    radius={2}
                    tone="caution"
                    border
                  >
                    <Stack space={2}>
                      <Text size={1}>{duplicateAlertLabel(alert)}</Text>
                      <Flex gap={2}>
                        <Button
                          text="Confirm merge"
                          tone="caution"
                          fontSize={1}
                          onClick={() => onResolveDuplicate(row.id, personIndex, 'confirm')}
                        />
                        <Text size={0} muted>
                          Renames matching credits on other portfolio entries.
                        </Text>
                        <Button
                          text="Skip"
                          mode="ghost"
                          fontSize={1}
                          onClick={() => onResolveDuplicate(row.id, personIndex, 'skip')}
                        />
                      </Flex>
                    </Stack>
                  </Card>
                )
              })}
            </Stack>
            <Flex align="center" gap={2}>
              <Checkbox
                id={`custom-${row.id}`}
                checked={row.isCustomRole}
                onChange={(event) =>
                  onChange(row.id, {
                    isCustomRole: event.currentTarget.checked,
                  })
                }
              />
              <Text as="label" htmlFor={`custom-${row.id}`} size={1}>
                Treat as custom role
              </Text>
            </Flex>
          </Stack>
        </PreviewRowPanel>
        )
      })}
    </Stack>
  )
}
