/**
 * Build role- and department-scoped name catalogs from crew credit rows.
 */

import {buildNameCatalog, type CrewDepartmentKey, type NameCatalogEntry} from '@crew-credits'

export interface CreditRowForCatalog {
  department?: CrewDepartmentKey
  roleKey?: string
  role?: string
  isCustomRole?: boolean
  people?: Array<{name?: string; url?: string; linkTitle?: string}>
}

export interface RoleCatalogIndexes {
  roleCatalogByKey: Map<string, NameCatalogEntry[]>
  deptCatalogByKey: Map<CrewDepartmentKey, NameCatalogEntry[]>
}

export function buildRoleCatalogIndexes(
  credits: CreditRowForCatalog[],
): RoleCatalogIndexes {
  const peopleByRole = new Map<string, Array<{name?: string; url?: string; linkTitle?: string}>>()
  const peopleByDept = new Map<
    CrewDepartmentKey,
    Array<{name?: string; url?: string; linkTitle?: string}>
  >()

  for (const credit of credits) {
    const people = credit.people ?? []
    if (!people.length) continue

    if (credit.roleKey && !credit.isCustomRole) {
      const bucket = peopleByRole.get(credit.roleKey) ?? []
      bucket.push(...people)
      peopleByRole.set(credit.roleKey, bucket)
    }

    if (credit.department) {
      const bucket = peopleByDept.get(credit.department) ?? []
      bucket.push(...people)
      peopleByDept.set(credit.department, bucket)
    }
  }

  const roleCatalogByKey = new Map<string, NameCatalogEntry[]>()
  for (const [roleKey, people] of peopleByRole) {
    roleCatalogByKey.set(roleKey, buildNameCatalog(people))
  }

  const deptCatalogByKey = new Map<CrewDepartmentKey, NameCatalogEntry[]>()
  for (const [department, people] of peopleByDept) {
    deptCatalogByKey.set(department, buildNameCatalog(people))
  }

  return {roleCatalogByKey, deptCatalogByKey}
}
