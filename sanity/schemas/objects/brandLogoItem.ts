/**
 * brandLogoItem — Homepage brand grid cell (id from shared logo registry).
 */

import {defineField, defineType} from 'sanity'

import {CLIENT_LOGO_BY_ID, CLIENT_LOGOS, type ClientLogoId} from '../../../shared/client-logos'

const LOGO_OPTIONS = CLIENT_LOGOS.map((logo) => {
  if (logo.id.endsWith('-horizontal')) {
    return {title: `${logo.name} (horizontal)`, value: logo.id}
  }
  if (logo.id.endsWith('-vertical')) {
    return {title: `${logo.name} (vertical)`, value: logo.id}
  }
  return {title: logo.name, value: logo.id}
})

export const brandLogoItem = defineType({
  name: 'brandLogoItem',
  title: 'Brand Logo',
  type: 'object',

  fields: [
    defineField({
      name: 'logoId',
      title: 'Logo',
      type: 'string',
      options: {list: LOGO_OPTIONS},
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {logoId: 'logoId'},
    prepare({logoId}: {logoId?: string}) {
      const logo = logoId ? CLIENT_LOGO_BY_ID[logoId as ClientLogoId] : undefined
      return {
        title: logo?.name ?? logoId ?? 'Brand logo',
        subtitle: logoId,
      }
    },
  },
})
