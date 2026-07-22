/**
 * crewCredit — One department/role row with structured people.
 *
 * Standard roles use a stable roleKey from the shared catalog.
 * Custom roles set isCustomRole and rely on the free-form role label.
 */

import {defineField, defineType} from 'sanity'

import {CREW_DEPARTMENTS, CREW_ROLE_BY_KEY} from '@crew-credits'

const DEPARTMENT_LIST = CREW_DEPARTMENTS.map((dept) => ({
  title: dept.label,
  value: dept.key,
}))

const ROLE_LIST = CREW_DEPARTMENTS.flatMap((dept) =>
  dept.roles.map((role) => ({
    title: `${dept.label} — ${role.label}`,
    value: role.key,
  })),
)

export const crewCredit = defineType({
  name: 'crewCredit',
  title: 'Crew Credit',
  type: 'object',
  fields: [
    defineField({
      name: 'department',
      title: 'Department',
      type: 'string',
      options: {list: DEPARTMENT_LIST, layout: 'dropdown'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isCustomRole',
      title: 'Custom role',
      type: 'boolean',
      description: 'Enable for uncommon roles that are not in the standard catalog.',
      initialValue: false,
    }),
    defineField({
      name: 'roleKey',
      title: 'Standard role',
      type: 'string',
      options: {list: ROLE_LIST},
      hidden: ({parent}) => Boolean(parent?.isCustomRole),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {isCustomRole?: boolean} | undefined
          if (parent?.isCustomRole) return true
          if (!value) return 'Select a standard role, or mark this as a custom role'
          if (!CREW_ROLE_BY_KEY.has(value)) return 'Unknown standard role'
          return true
        }),
    }),
    defineField({
      name: 'role',
      title: 'Role label',
      type: 'string',
      description: 'Displayed role label. For standard roles this is filled from the catalog.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'people',
      title: 'People',
      type: 'array',
      of: [{type: 'crewPerson'}],
      validation: (rule) => rule.min(1).error('Add at least one person or company'),
    }),
  ],
  preview: {
    select: {
      department: 'department',
      role: 'role',
      isCustomRole: 'isCustomRole',
      people: 'people',
    },
    prepare({department, role, isCustomRole, people}) {
      const names = Array.isArray(people)
        ? people
            .map((person: {name?: string}) => person?.name)
            .filter(Boolean)
            .join(', ')
        : ''
      const deptLabel =
        CREW_DEPARTMENTS.find((d) => d.key === department)?.label ?? department ?? 'Credit'
      return {
        title: `${role || 'Untitled role'}${isCustomRole ? ' (custom)' : ''}`,
        subtitle: `${deptLabel}${names ? ` — ${names}` : ''}`,
      }
    },
  },
})
