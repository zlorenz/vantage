/**
 * translatedPhrase — Exact EN→ZH string for the shared phrase book.
 * Whole-field match only (not mid-sentence).
 */

import {defineField, defineType} from 'sanity'

import {normalizePhraseKey, phraseDocumentId} from '@phrase-book'

export const translatedPhrase = defineType({
  name: 'translatedPhrase',
  title: 'Phrase',
  type: 'document',

  fields: [
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          const en = normalizePhraseKey(value)
          if (!en) return 'English is required'
          const client = context.getClient({apiVersion: '2025-02-19'})
          const id = phraseDocumentId(en)
          const docId = context.document?._id?.replace(/^drafts\./, '')
          if (docId && docId !== id) {
            // Allow editing en on an existing doc, but warn if another phrase owns this key
          }
          const existing = await client.fetch<{_id: string} | null>(
            `*[_type == "translatedPhrase" && en == $en && !(_id in [$id, $draftId])][0]{_id}`,
            {
              en,
              id,
              draftId: `drafts.${id}`,
            },
          )
          if (existing) return `A phrase for “${en}” already exists`
          return true
        }),
    }),
    defineField({
      name: 'zh',
      title: 'Chinese',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
      description: 'Optional translator notes (not shown on the site).',
    }),
  ],

  preview: {
    select: {title: 'en', subtitle: 'zh'},
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled phrase',
        subtitle: subtitle ? `→ ${subtitle}` : undefined,
      }
    },
  },
})
