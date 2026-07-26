/**
 * brandLogoItem — Homepage brand grid cell (id from shared logo registry).
 *
 * Editors pick among curated registry ids only. Adding a new mark requires a
 * code change (SVG in /public/logos/ + entry in shared/client-logos) and a
 * Studio redeploy — not a Studio-only upload.
 */

import {defineField, defineType} from 'sanity'

import {CLIENT_LOGO_BY_ID, CLIENT_LOGOS, isClientLogoId, type ClientLogoId} from '../../../shared/client-logos'

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
      description:
        'Pick from the curated SVG registry. To add a new brand mark, add the SVG under /public/logos/ and an entry in shared/client-logos, then redeploy Studio.',
      options: {list: LOGO_OPTIONS},
      validation: (rule) =>
        rule.required().custom((value) => {
          if (value == null || value === '') return true
          if (typeof value !== 'string' || !isClientLogoId(value)) {
            return `Unknown logo id “${value}”. Use a registry id from shared/client-logos.`
          }
          return true
        }),
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
