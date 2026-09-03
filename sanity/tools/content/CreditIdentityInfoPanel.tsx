/**
 * Read-only creditIdentity usage panel for the Crew Members document page.
 *
 * Intentionally uses MERGE_REFERENCE_SCAN_QUERY / scanMergeReferences
 * (identity-ref-only hits). This differs from the Crew Members table "Credits"
 * / Roles column, which use resolveUsageForIdentities and also count
 * display-name fallback matches plus the production_designer → art_director
 * alias. Do not "fix" this panel to match table counts.
 */

import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {
  CREW_DEPARTMENTS,
  getDepartmentLabel,
  scanMergeReferences,
  type CrewDepartmentKey,
  type MergeReferenceHit,
} from '@crew-credits'
import {studioRoleLabel} from './crew-member-labels'

type DeptProjectRow = {
  publishedId: string
  title: string
  isHidden: boolean
  roleLabels: string[]
}

type DeptGroup = {
  department: CrewDepartmentKey | 'unknown'
  label: string
  projects: DeptProjectRow[]
}

function roleLabelForMatch(roleKey: string | undefined, role: string): string {
  if (roleKey) return studioRoleLabel(roleKey, role)
  return role?.trim() || 'Credit'
}

function buildDeptGroups(hits: MergeReferenceHit[]): {
  projectCount: number
  groups: DeptGroup[]
} {
  const live = hits.filter((hit) => !hit.isTrashed)
  const projectCount = new Set(live.map((hit) => hit.publishedId)).size

  const byDept = new Map<
    string,
    {
      department: CrewDepartmentKey | 'unknown'
      projects: Map<string, DeptProjectRow>
    }
  >()

  for (const hit of live) {
    for (const match of hit.matches) {
      const department = (match.department as CrewDepartmentKey | undefined) ?? 'unknown'
      const deptKey = department
      let deptEntry = byDept.get(deptKey)
      if (!deptEntry) {
        deptEntry = {department, projects: new Map()}
        byDept.set(deptKey, deptEntry)
      }
      let project = deptEntry.projects.get(hit.publishedId)
      if (!project) {
        project = {
          publishedId: hit.publishedId,
          title: hit.title,
          isHidden: hit.isHidden,
          roleLabels: [],
        }
        deptEntry.projects.set(hit.publishedId, project)
      } else if (hit.isHidden) {
        project.isHidden = true
      }
      const label = roleLabelForMatch(match.roleKey, match.role)
      if (!project.roleLabels.includes(label)) {
        project.roleLabels.push(label)
      }
    }
  }

  const catalogOrder = new Map(
    CREW_DEPARTMENTS.map((dept, index) => [dept.key, index] as const),
  )

  const groups: DeptGroup[] = [...byDept.values()]
    .map((entry) => ({
      department: entry.department,
      label:
        entry.department === 'unknown'
          ? 'Other'
          : getDepartmentLabel(entry.department),
      projects: [...entry.projects.values()].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {sensitivity: 'base'}),
      ),
    }))
    .sort((a, b) => {
      const ai =
        a.department === 'unknown' ? 999 : (catalogOrder.get(a.department) ?? 998)
      const bi =
        b.department === 'unknown' ? 999 : (catalogOrder.get(b.department) ?? 998)
      return ai - bi
    })

  return {projectCount, groups}
}

export function CreditIdentityInfoPanel({
  identityId,
}: {
  identityId: string
}) {
  const studioClient = useClient({apiVersion: '2025-02-19'})
  const client = useMemo(
    () => studioClient.withConfig({perspective: 'raw'}),
    [studioClient],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hits, setHits] = useState<MergeReferenceHit[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    scanMergeReferences(client, identityId)
      .then((next) => {
        if (!cancelled) setHits(next)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load credits')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client, identityId])

  const {projectCount, groups} = useMemo(() => buildDeptGroups(hits), [hits])

  return (
    <Card padding={4} radius={2} shadow={1} border>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Credits
          </Text>
          <Text size={1} muted>
            Portfolios linked to this identity via crew credit refs. Read-only —
            edit credits on the portfolio entry.
          </Text>
        </Stack>

        {loading ? (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1} muted>
              Loading credits…
            </Text>
          </Flex>
        ) : null}

        {error ? (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}

        {!loading && !error ? (
          <Stack space={4}>
            <Text size={1}>
              <strong>Credits:</strong> {projectCount}{' '}
              {projectCount === 1 ? 'project' : 'projects'}
            </Text>

            {groups.length === 0 ? (
              <Text size={1} muted>
                No portfolio credits linked to this identity yet.
              </Text>
            ) : (
              groups.map((group) => (
                <Stack key={String(group.department)} space={3}>
                  <Text size={1} weight="semibold">
                    {group.label}
                  </Text>
                  <Stack space={3}>
                    {group.projects.map((project) => (
                      <Box key={`${group.department}-${project.publishedId}`}>
                        <Stack space={1}>
                          <Text size={1}>
                            {project.title}
                            {project.isHidden ? (
                              <Text as="span" size={1} muted>
                                {' '}
                                (hidden)
                              </Text>
                            ) : null}
                          </Text>
                          <Text size={0} muted>
                            {project.roleLabels.join(', ')}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              ))
            )}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
