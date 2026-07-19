import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {contentTool} from './tools/content'

export default defineConfig({
  name: 'default',
  title: 'Vantage Pictures Website',

  projectId: '7oesp86l',
  dataset: 'production',

  // Scheduled Drafts is the current replacement for the deprecated
  // Scheduled Publishing plugin. It is backed by single-document releases.
  scheduledDrafts: {
    enabled: true,
  },

  plugins: [structureTool({structure}), media(), visionTool()],

  tools: (prev) => [contentTool, ...prev.filter((tool) => tool.name !== 'content')],

  schema: {
    types: schemaTypes,
  },
})
