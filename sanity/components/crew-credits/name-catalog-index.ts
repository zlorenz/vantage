/**
 * Build role- and department-scoped name catalogs from crew credit rows.
 */

import {
  buildNameCatalogFromCredits,
  type CrewDepartmentKey,
  type NameCatalogEntry,
} from '@crew-credits'

export interface CreditRowForCatalog {
  department?: CrewDepartmentKey
  roleKey?: string
  role?: string
  isCustomRole?: boolean
  people?: Array<{
    name?: string
    url?: string
    linkTitle?: string
    identity?: {_ref?: string}
  }>
}

export interface RoleCatalogIndexes {
  roleCatalogByKey: Map<string, NameCatalogEntry[]>
  deptCatalogByKey: Map<CrewDepartmentKey, NameCatalogEntry[]>
}

export function buildRoleCatalogIndexes(
  credits: CreditRowForCatalog[],
): RoleCatalogIndexes {
  const creditsByRole = new Map<string, CreditRowForCatalog[]>()
  const creditsByDept = new Map<CrewDepartmentKey, CreditRowForCatalog[]>()

  for (const credit of credits) {
    if (credit.roleKey && !credit.isCustomRole) {
      const bucket = creditsByRole.get(credit.roleKey) ?? []
      bucket.push(credit)
      creditsByRole.set(credit.roleKey, bucket)
    }

    if (credit.department) {
      const bucket = creditsByDept.get(credit.department) ?? []
      bucket.push(credit)
      creditsByDept.set(credit.department, bucket)
    }
  }

  const roleCatalogByKey = new Map<string, NameCatalogEntry[]>()
  for (const [roleKey, roleCredits] of creditsByRole) {
    roleCatalogByKey.set(roleKey, buildNameCatalogFromCredits(roleCredits))
  }

  const deptCatalogByKey = new Map<CrewDepartmentKey, NameCatalogEntry[]>()
  for (const [department, deptCredits] of creditsByDept) {
    deptCatalogByKey.set(department, buildNameCatalogFromCredits(deptCredits))
  }

  return {roleCatalogByKey, deptCatalogByKey}
}
