/**
 * Attach / resolve role-variant suggestions on CSV preview rows.
 */

import {findRoleMatch, type RoleMatch} from '@crew-credits'

import type {MappedPreviewRow, RoleSuggestionAlert, RoleSuggestionStatus} from './csv-map'

function alertFromMatch(
  match: RoleMatch,
  status: RoleSuggestionStatus,
  originalRole: string,
): RoleSuggestionAlert {
  return {
    kind: match.kind,
    confidence: match.confidence,
    label: match.label,
    ...(match.roleKey ? {roleKey: match.roleKey} : {}),
    ...(match.departmentKey ? {departmentKey: match.departmentKey} : {}),
    reason: match.reason,
    status,
    originalRole,
  }
}

/**
 * Attach role suggestions to custom preview rows that near-match a standard
 * (or need custom-label canonicalization that wasn't applied yet).
 * Exact catalog aliases are already mapped and skipped.
 */
export function attachRoleSuggestions(rows: MappedPreviewRow[]): MappedPreviewRow[] {
  return rows.map((row) => {
    const prior = row.roleSuggestion

    if (row.status === 'invalid' || !row.isCustomRole) {
      if (!prior) return row
      const {roleSuggestion: _omit, ...rest} = row
      return rest
    }

    const department = row.department || undefined
    const match = findRoleMatch(row.roleRaw || row.roleLabel, {
      department: department || null,
    })

    if (!match) {
      if (!prior) return row
      const {roleSuggestion: _omit, ...rest} = row
      return rest
    }

    // Custom canonical already applied in csv-map (roleLabel === Boom Op etc.)
    if (match.kind === 'custom_canonical' && match.label === row.roleLabel) {
      if (!prior) return row
      const {roleSuggestion: _omit, ...rest} = row
      return rest
    }

    if (
      prior?.status === 'skipped' &&
      prior.originalRole === (row.roleRaw || row.roleLabel) &&
      prior.label === match.label &&
      prior.roleKey === match.roleKey
    ) {
      return {
        ...row,
        roleSuggestion: alertFromMatch(match, 'skipped', prior.originalRole),
      }
    }

    if (
      prior?.status === 'confirmed' &&
      ((match.kind === 'standard' && row.roleKey === match.roleKey && !row.isCustomRole) ||
        (match.kind === 'custom_canonical' && row.roleLabel === match.label))
    ) {
      return {
        ...row,
        roleSuggestion: alertFromMatch(match, 'confirmed', prior.originalRole),
      }
    }

    return {
      ...row,
      roleSuggestion: alertFromMatch(match, 'pending', row.roleRaw || row.roleLabel),
    }
  })
}

export function confirmRoleSuggestion(row: MappedPreviewRow): MappedPreviewRow {
  const alert = row.roleSuggestion
  if (!alert) return row

  if (alert.kind === 'custom_canonical') {
    return {
      ...row,
      roleLabel: alert.label,
      isCustomRole: true,
      roleKey: undefined,
      status: 'custom',
      error: undefined,
      roleSuggestion: {...alert, status: 'confirmed'},
    }
  }

  return {
    ...row,
    department: alert.departmentKey ?? row.department,
    roleKey: alert.roleKey,
    roleLabel: alert.label,
    isCustomRole: false,
    status: row.warning ? 'warning' : 'mapped',
    error: undefined,
    roleSuggestion: {...alert, status: 'confirmed'},
  }
}

export function skipRoleSuggestion(row: MappedPreviewRow): MappedPreviewRow {
  const alert = row.roleSuggestion
  if (!alert) return row
  return {
    ...row,
    roleSuggestion: {
      ...alert,
      status: 'skipped',
      originalRole: alert.originalRole || row.roleRaw || row.roleLabel,
    },
  }
}

export function countPendingRoleSuggestions(rows: MappedPreviewRow[]): number {
  return rows.filter((row) => row.roleSuggestion?.status === 'pending').length
}

export function roleSuggestionLabel(alert: RoleSuggestionAlert): string {
  const target =
    alert.kind === 'standard' ? `standard “${alert.label}”` : `custom “${alert.label}”`
  return `“${alert.originalRole}” may be ${target} (${alert.reason})`
}
