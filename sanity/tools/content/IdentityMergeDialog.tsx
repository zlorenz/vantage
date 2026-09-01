import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {
  Badge,
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
import {SearchIcon} from '@sanity/icons'
import {
  executeMerge,
  planMerge,
  type ExecuteMergeResult,
  type MergePlan,
  type MergeReferenceHit,
} from '@crew-credits'

type IdentityRow = {
  _id: string
  name: string
  nameZh?: string
  url?: string
}

type MergeSource = {
  _id: string
  name: string
}

type Step = 'picker' | 'preview' | 'executing' | 'done' | 'error'

const IDENTITY_LIST_QUERY = `
  *[_type == "creditIdentity" && !(_id in path("versions.**"))] | order(name asc) {
    _id,
    "name": name,
    nameZh,
    url
  }
`

function variantLabel(variant: MergeReferenceHit['variant']): string {
  switch (variant) {
    case 'draft':
      return 'Draft'
    case 'scheduled':
      return 'Scheduled'
    default:
      return 'Published'
  }
}

function groupReferencesByProject(references: MergeReferenceHit[]) {
  const byPublished = new Map<
    string,
    {title: string; roles: Set<string>; variants: MergeReferenceHit['variant'][]}
  >()
  for (const hit of references) {
    const existing = byPublished.get(hit.publishedId)
    const roles = new Set(existing?.roles ?? [])
    for (const match of hit.matches) {
      roles.add(match.role || match.roleKey || 'Credit')
    }
    const variants = [...(existing?.variants ?? [])]
    if (!variants.includes(hit.variant)) variants.push(hit.variant)
    byPublished.set(hit.publishedId, {
      title: hit.title,
      roles,
      variants,
    })
  }
  return [...byPublished.entries()].sort((a, b) =>
    a[1].title.localeCompare(b[1].title, undefined, {sensitivity: 'base'}),
  )
}

function IdentityField({
  label,
  value,
  highlight,
}: {
  label: string
  value?: string
  highlight?: boolean
}) {
  return (
    <Stack space={2}>
      <Text size={0} muted>
        {label}
      </Text>
      <Text
        size={1}
        weight={highlight ? 'semibold' : 'regular'}
        style={highlight ? {color: 'var(--card-link-color)'} : undefined}
      >
        {value?.trim() || '—'}
        {highlight ? ' (will be added)' : ''}
      </Text>
    </Stack>
  )
}

export function IdentityMergeDialog({
  source,
  onClose,
  onComplete,
}: {
  source: MergeSource
  onClose: () => void
  onComplete: () => void
}) {
  const studioClient = useClient({apiVersion: '2024-01-01'})
  const client = useMemo(
    () => studioClient.withConfig({perspective: 'raw'}),
    [studioClient],
  )
  const [step, setStep] = useState<Step>('picker')
  const [identities, setIdentities] = useState<IdentityRow[]>([])
  const [loadingIdentities, setLoadingIdentities] = useState(true)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState<MergePlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [result, setResult] = useState<ExecuteMergeResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingIdentities(true)
    client
      .fetch<IdentityRow[]>(IDENTITY_LIST_QUERY)
      .then((rows) => {
        if (!cancelled) setIdentities(rows ?? [])
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load identities',
          )
          setStep('error')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingIdentities(false)
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const filteredIdentities = useMemo(() => {
    const q = search.trim().toLowerCase()
    return identities
      .filter((row) => row._id !== source._id)
      .filter((row) => {
        if (!q) return true
        return (
          row.name.toLowerCase().includes(q) ||
          (row.nameZh ?? '').toLowerCase().includes(q)
        )
      })
  }, [identities, search, source._id])

  const selectTarget = useCallback(
    async (targetId: string) => {
      setPlanLoading(true)
      setErrorMessage(null)
      try {
        const nextPlan = await planMerge(client, source._id, targetId)
        setPlan(nextPlan)
        setConfirmName('')
        setStep('preview')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not build merge plan')
        setStep('error')
      } finally {
        setPlanLoading(false)
      }
    },
    [client, source._id],
  )

  const runMerge = useCallback(async () => {
    if (!plan) return
    setStep('executing')
    setErrorMessage(null)
    try {
      const mergeResult = await executeMerge(
        client,
        source._id,
        plan.canonicalId,
        plan,
        {apply: true},
      )
      setResult(mergeResult)
      if (mergeResult.verifiedClean && mergeResult.duplicateDeleted) {
        setStep('done')
        onComplete()
      } else {
        setErrorMessage(mergeResult.error ?? 'Merge verification failed')
        setStep('error')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Merge failed')
      setStep('error')
    }
  }, [client, onComplete, plan, source._id])

  const busy = step === 'executing' || planLoading
  const confirmMatches = confirmName.trim() === source.name.trim()
  const groupedProjects = useMemo(
    () => groupReferencesByProject(plan?.references.filter((hit) => !hit.isTrashed) ?? []),
    [plan],
  )

  const header =
    step === 'picker'
      ? 'Merge into…'
      : step === 'preview'
        ? 'Merge preview'
        : step === 'done'
          ? 'Merge complete'
          : step === 'error'
            ? 'Merge failed'
            : 'Merging identities…'

  return (
    <Dialog
      id="identity-merge-dialog"
      header={header}
      width={2}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <Stack space={4} padding={4}>
        {step === 'picker' ? (
          <>
            <Text size={1}>
              Merge <strong>{source.name}</strong> into a canonical crew member.
              All portfolio credits pointing at the duplicate will be repointed;
              the duplicate document will be deleted.
            </Text>
            <TextInput
              icon={SearchIcon}
              placeholder="Search crew members…"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              disabled={loadingIdentities || planLoading}
            />
            {loadingIdentities || planLoading ? (
              <Flex align="center" gap={2}>
                <Spinner muted />
                <Text size={1} muted>
                  {planLoading ? 'Building preview…' : 'Loading identities…'}
                </Text>
              </Flex>
            ) : (
              <Card border padding={0} style={{maxHeight: 320, overflow: 'auto'}}>
                <Stack space={0}>
                  {filteredIdentities.length === 0 ? (
                    <Box padding={3}>
                      <Text size={1} muted>
                        No matching identities.
                      </Text>
                    </Box>
                  ) : (
                    filteredIdentities.map((row) => (
                      <button
                        key={row._id}
                        type="button"
                        onClick={() => selectTarget(row._id)}
                        style={{
                          all: 'unset',
                          display: 'block',
                          width: '100%',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--card-border-color)',
                        }}
                      >
                        <Stack space={1}>
                          <Text size={1} weight="medium">
                            {row.name}
                          </Text>
                          {row.nameZh ? (
                            <Text size={0} muted>
                              {row.nameZh}
                            </Text>
                          ) : null}
                        </Stack>
                      </button>
                    ))
                  )}
                </Stack>
              </Card>
            )}
          </>
        ) : null}

        {step === 'preview' && plan ? (
          <>
            <Flex gap={3} wrap="wrap">
              <Card flex={1} padding={3} border tone="critical" style={{minWidth: 220}}>
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    Duplicate (will be deleted)
                  </Text>
                  <IdentityField label="Name" value={plan.duplicate.name} />
                  <IdentityField label="Name (中文)" value={plan.duplicate.nameZh} />
                  <IdentityField label="URL" value={plan.duplicate.url} />
                </Stack>
              </Card>
              <Card flex={1} padding={3} border style={{minWidth: 220}}>
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    Canonical (keeps this document)
                  </Text>
                  <IdentityField label="Name" value={plan.canonical.name} />
                  <IdentityField
                    label="Name (中文)"
                    value={plan.canonical.nameZh || plan.fieldDiff.nameZh}
                    highlight={Boolean(plan.fieldDiff.nameZh)}
                  />
                  <IdentityField
                    label="URL"
                    value={plan.canonical.url || plan.fieldDiff.url}
                    highlight={Boolean(plan.fieldDiff.url)}
                  />
                </Stack>
              </Card>
            </Flex>

            <Stack space={3}>
              <Text size={1} weight="semibold">
                Affected projects ({groupedProjects.length})
              </Text>
              {groupedProjects.length === 0 ? (
                <Text size={1} muted>
                  No live portfolio references — only identity fields may be merged.
                </Text>
              ) : (
                <Card border padding={0} style={{maxHeight: 240, overflow: 'auto'}}>
                  <Stack space={0}>
                    {groupedProjects.map(([publishedId, info]) => (
                      <Box
                        key={publishedId}
                        padding={3}
                        style={{borderBottom: '1px solid var(--card-border-color)'}}
                      >
                        <Stack space={2}>
                          <Text size={1} weight="medium">
                            {info.title}
                          </Text>
                          <Flex gap={2} wrap="wrap">
                            {[...info.roles].map((role) => (
                              <Badge key={role} tone="primary" fontSize={0}>
                                {role}
                              </Badge>
                            ))}
                            {info.variants.map((variant) => (
                              <Badge key={variant} tone="default" fontSize={0}>
                                {variantLabel(variant)}
                              </Badge>
                            ))}
                          </Flex>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              )}
              {plan.trashedReferences.length > 0 ? (
                <Text size={1} muted>
                  {plan.trashedReferences.length} trashed portfolio variant
                  {plan.trashedReferences.length === 1 ? '' : 's'} still reference this
                  identity and will be left unchanged (reported only).
                </Text>
              ) : null}
            </Stack>

            <Card padding={3} radius={2} tone="caution">
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  This cannot be undone
                </Text>
                <Text size={1}>
                  {plan.repointActions.length} document variant
                  {plan.repointActions.length === 1 ? '' : 's'} will be updated to point at{' '}
                  <strong>{plan.canonical.name}</strong>, then{' '}
                  <strong>{plan.duplicate.name}</strong> will be permanently deleted.
                </Text>
              </Stack>
            </Card>

            <Stack space={2}>
              <Text size={1}>
                Type <strong>{source.name}</strong> to confirm:
              </Text>
              <TextInput
                value={confirmName}
                onChange={(event) => setConfirmName(event.currentTarget.value)}
                placeholder={source.name}
                disabled={busy}
              />
            </Stack>

            <Flex justify="space-between" gap={2} wrap="wrap">
              <Button
                mode="bleed"
                text="Back"
                disabled={busy}
                onClick={() => {
                  setPlan(null)
                  setStep('picker')
                }}
              />
              <Flex gap={2}>
                <Button mode="bleed" text="Cancel" disabled={busy} onClick={onClose} />
                <Button
                  tone="critical"
                  text="Merge permanently"
                  disabled={busy || !confirmMatches}
                  onClick={runMerge}
                />
              </Flex>
            </Flex>
          </>
        ) : null}

        {step === 'executing' ? (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1}>Repointing credits and verifying references…</Text>
          </Flex>
        ) : null}

        {step === 'done' && result ? (
          <Stack space={3}>
            <Text size={1}>
              Merged successfully. Repointed {result.repointedDocuments} document variant
              {result.repointedDocuments === 1 ? '' : 's'} ({result.repointedPeople} credit
              slot{result.repointedPeople === 1 ? '' : 's'}).
              {result.canonicalFieldsPatched
                ? ' Canonical identity fields were filled in from the duplicate.'
                : ''}{' '}
              <strong>{source.name}</strong> was deleted.
            </Text>
            <Flex justify="flex-end">
              <Button text="Close" onClick={onClose} />
            </Flex>
          </Stack>
        ) : null}

        {step === 'error' ? (
          <Stack space={3}>
            <Card padding={3} radius={2} tone="critical">
              <Text size={1}>{errorMessage ?? 'Something went wrong.'}</Text>
            </Card>
            {result?.stillReferencing?.length ? (
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Documents still referencing the duplicate:
                </Text>
                {result.stillReferencing.map((hit) => (
                  <Text key={hit.documentId} size={1}>
                    {hit.title} ({hit.documentId}) — {hit.matches.length} slot
                    {hit.matches.length === 1 ? '' : 's'}
                  </Text>
                ))}
              </Stack>
            ) : null}
            <Flex justify="flex-end" gap={2}>
              <Button mode="bleed" text="Close" onClick={onClose} />
              {plan ? (
                <Button
                  text="Back to preview"
                  onClick={() => {
                    setErrorMessage(null)
                    setResult(null)
                    setStep('preview')
                  }}
                />
              ) : null}
            </Flex>
          </Stack>
        ) : null}
      </Stack>
    </Dialog>
  )
}
