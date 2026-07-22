import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineCliConfig} from 'sanity/cli'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const sharedCrewCredits = path.resolve(rootDir, '../shared/crew-credits')

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
  vite: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@crew-credits': sharedCrewCredits,
      },
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
