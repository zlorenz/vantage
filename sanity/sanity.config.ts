import {defineConfig, type AssetSource} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {elevatedMediaAssetSource} from './components/ElevatedMediaAssetSource'
import {VantageLogoIcon} from './components/VantageLogoIcon'
import {StudioRoleLayout} from './components/StudioRoleLayout'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {resolve} from './presentation/resolve'
import {getStudioRole} from './lib/studio-roles'
import {contentTool} from './tools/content'
import {
  getFrontEndUrl,
  getSiteBaseUrl,
  mergeDocumentSnapshot,
  type FrontEndDocument,
} from './tools/content/front-end-url'
import './studio.css'

/**
 * Field asset-source menu tweaks:
 * - Raise Media overlay above Content tool form (ElevatedMediaAssetSource).
 * - Relabel native dataset source — default title is the Studio title and reads poorly in this menu.
 */
function customizeAssetSources(prev: AssetSource[]): AssetSource[] {
  return prev.map((source) => {
    if (source.name === elevatedMediaAssetSource.name) return elevatedMediaAssetSource
    if (source.name === 'sanity-default') return {...source, title: 'Browse Dataset'}
    return source
  })
}

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

  studio: {
    components: {
      layout: StudioRoleLayout,
    },
  },

  plugins: [
    structureTool({structure}),
    presentationTool({
      resolve,
      previewUrl: {
        origin: getSiteBaseUrl(),
        previewMode: {enable: '/api/draft-mode/enable'},
      },
    }),
    // Shared Media library for editors + admins. creditLine.enabled surfaces the
    // Credit field so campaign-brief uploads can show their auto-label.
    // No excludeSources — browser uploads do not set asset.source.name.
    media({
      creditLine: {
        enabled: true,
      },
    }),
    visionTool(),
  ],

  form: {
    image: {assetSources: customizeAssetSources},
    file: {assetSources: customizeAssetSources},
  },

  tools: (prev, context) => {
    const role = getStudioRole(context.currentUser)
    const withoutDuplicateContent = prev.filter((tool) => tool.name !== 'content')
    const visible =
      role === 'admin'
        ? withoutDuplicateContent
        : withoutDuplicateContent.filter((tool) => {
            if (tool.name === 'structure' || tool.name === 'vision') return false
            // Media library: editors keep it; translators do not.
            if (role === 'translator' && tool.name === 'media') return false
            return true
          })
    return [contentTool, ...visible]
  },

  schema: {
    types: schemaTypes,
  },

  document: {
    // Orphaned WP taxonomy mirrors — keep schema types for historical docs,
    // but do not offer Create in the global + menu.
    newDocumentOptions: (prev) =>
      prev.filter(
        (t) =>
          t.templateId !== 'client' &&
          t.templateId !== 'crewMember' &&
          t.templateId !== 'siteSettings' &&
          t.templateId !== 'homeRedesign' &&
          t.templateId !== 'trashRecord' &&
          t.templateId !== 'campaignBriefAttachment',
      ),
    productionUrl: async (prev, {document}) => {
      const url = getFrontEndUrl(
        document._type,
        mergeDocumentSnapshot(document as FrontEndDocument),
      )
      return url ?? prev
    },
  },
})
