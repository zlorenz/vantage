import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineCliConfig} from 'sanity/cli'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const sharedCrewCredits = path.resolve(rootDir, '../shared/crew-credits')
const sharedDisplayTitles = path.resolve(rootDir, '../shared/display-titles')
const sharedPhraseBook = path.resolve(rootDir, '../shared/phrase-book')
const sharedAiTranslation = path.resolve(rootDir, '../shared/ai-translation')
const sharedVideoUrl = path.resolve(rootDir, '../shared/video-url')
const sharedClientLogos = path.resolve(rootDir, '../shared/client-logos/index.ts')
const sharedTrashRetention = path.resolve(rootDir, '../shared/trash-retention')
const sharedStudioOverlayZ = path.resolve(rootDir, '../shared/studio-overlay-z')

function mergeViteAliases(existing, extra) {
  const asArray = Array.isArray(existing)
    ? [...existing]
    : existing && typeof existing === 'object'
      ? Object.entries(existing).map(([find, replacement]) => ({find, replacement}))
      : []
  for (const [find, replacement] of Object.entries(extra)) {
    const idx = asArray.findIndex((entry) => entry.find === find)
    if (idx >= 0) asArray[idx] = {find, replacement}
    else asArray.push({find, replacement})
  }
  return asArray
}

export default defineCliConfig({
  api: {
    projectId: '7oesp86l',
    dataset: 'production'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
  /**
   * Query + schema TypeGen for the Next app.
   * Prefer sanity-typegen.json for CLI 6.x (`npx sanity typegen generate` from sanity/).
   * This block mirrors that config for newer CLI versions that read typegen from defineCliConfig.
   */
  typegen: {
    schema: './schema.json',
    path: '../src/**/*.{ts,tsx}',
    // Emit under src/ so `declare module '@sanity/client'` augments the same
    // package instance the Next app imports (root node_modules), not studio's.
    generates: '../src/sanity/sanity.types.ts',
    overloadClientMethods: true,
  },
  vite: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: mergeViteAliases(config.resolve?.alias, {
        '@crew-credits': sharedCrewCredits,
        '@display-titles': sharedDisplayTitles,
        '@phrase-book': sharedPhraseBook,
        '@ai-translation': sharedAiTranslation,
        '@video-url': sharedVideoUrl,
        '@client-logos': sharedClientLogos,
        '@trash-retention': sharedTrashRetention,
        '@studio-overlay-z': sharedStudioOverlayZ,
      }),
    },
    server: {
      ...config.server,
      fs: {
        ...config.server?.fs,
        allow: [
          ...new Set([
            ...(config.server?.fs?.allow ?? []),
            rootDir,
            path.resolve(rootDir, '..'),
          ]),
        ],
      },
    },
  }),
})
