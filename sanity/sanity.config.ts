import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {VantageLogoIcon} from './components/VantageLogoIcon'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {resolve} from './presentation/resolve'
import {contentTool} from './tools/content'
import {getFrontEndUrl, mergeDocumentSnapshot, type FrontEndDocument} from './tools/content/front-end-url'
import './studio.css'

export default defineConfig({
  name: 'default',
  title: 'Vantage Pictures Website',
  icon: VantageLogoIcon,

  projectId: '7oesp86l',
  dataset: 'production',

  // Scheduled Drafts is the current replacement for the deprecated
  // Scheduled Publishing plugin. It is backed by single-document releases.
  scheduledDrafts: {
    enabled: true,
  },

  plugins: [
    structureTool({structure}),
    presentationTool({
      resolve,
      previewUrl: {
        origin: 'http://localhost:3000',
        previewMode: {enable: '/api/draft-mode/enable'},
      },
    }),
    media(),
    visionTool(),
  ],

  tools: (prev) => [contentTool, ...prev.filter((tool) => tool.name !== 'content')],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Orphaned WP taxonomy mirrors — keep schema types for historical docs,
    // but do not offer Create in the global + menu.
    newDocumentOptions: (prev) =>
      prev.filter((t) => t.templateId !== 'client' && t.templateId !== 'crewMember'),
    productionUrl: async (prev, {document}) => {
      const url = getFrontEndUrl(
        document._type,
        mergeDocumentSnapshot(document as FrontEndDocument),
      )
      return url ?? prev
    },
  },
})
