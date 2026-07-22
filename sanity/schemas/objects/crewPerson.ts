/**
 * crewPerson — One credited person or company with an optional URL.
 */

import {defineField, defineType} from 'sanity'

export const crewPerson = defineType({
  name: 'crewPerson',
  title: 'Crew Person',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Optional profile or company link (http/https only).',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'linkTitle',
      title: 'Link tooltip',
      type: 'string',
      description:
        'Optional hover text for the link. Leave blank to use the name. WordPress titles like "Brand | Company tagline" go here.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'url'},
  },
})
