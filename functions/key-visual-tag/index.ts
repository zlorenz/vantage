import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

import {tagAssetAsKeyVisual} from '../../shared/media-tags/index'

type KeyVisualTagEventData = {
  _id?: string
  beforeRefs?: Array<string | null | undefined> | null
  afterRefs?: Array<string | null | undefined> | null
}

function isDryRun(): boolean {
  const v = process.env.DRY_RUN
  return v === 'true' || v === '1' || v === 'yes'
}

function normalizeRefs(
  refs: Array<string | null | undefined> | null | undefined,
): string[] {
  return (refs ?? []).filter((ref): ref is string => typeof ref === 'string' && ref.length > 0)
}

function diffNewRefs(beforeRefs: string[], afterRefs: string[]): string[] {
  const before = new Set(beforeRefs)
  return afterRefs.filter((ref) => !before.has(ref))
}

export const handler = documentEventHandler<KeyVisualTagEventData>(
  async ({context, event}) => {
    const data = event.data ?? {}
    const docId = data._id ?? '(unknown)'
    const beforeRefs = normalizeRefs(data.beforeRefs)
    const afterRefs = normalizeRefs(data.afterRefs)
    const newRefs = diffNewRefs(beforeRefs, afterRefs)

    const dryRun = isDryRun()
    const summary = {
      ok: true,
      dryRun,
      docId,
      beforeRefCount: beforeRefs.length,
      afterRefCount: afterRefs.length,
      newRefs,
      newRefCount: newRefs.length,
      skipped: newRefs.length === 0 ? 'no-new-refs' : undefined,
    }

    console.log(JSON.stringify(summary, null, 2))

    if (newRefs.length === 0) {
      return
    }

    if (dryRun) {
      console.log(
        `[key-visual-tag] DRY_RUN — skipped tagging ${newRefs.length} asset(s) for ${docId}`,
      )
      return
    }

    const client = createClient({
      ...context.clientOptions,
      apiVersion: '2025-05-08',
      useCdn: false,
    })

    await Promise.all(newRefs.map((assetId) => tagAssetAsKeyVisual(client, assetId)))

    console.log(
      `[key-visual-tag] tagged ${newRefs.length} asset(s) for ${docId}`,
    )
  },
)
