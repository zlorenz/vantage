import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

import {
  buildCandidateQuery,
  PROPAGATION_DOC_TYPES,
} from '../../shared/phrase-book/propagation-paths'
import {
  computeTitleZhAfterPatches,
  groupPatchesByDoc,
  planPhrasePropagation,
  PROPAGATION_CHUNK_SIZE,
  type PropagationPatch,
} from '../../shared/phrase-book/propagate'

type PhraseEventData = {
  _id?: string
  en?: string
  beforeZh?: string | null
  afterZh?: string | null
}

function isDryRun(): boolean {
  const v = process.env.DRY_RUN
  return v === 'true' || v === '1' || v === 'yes'
}

function chunkEntries<T>(entries: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < entries.length; i += size) {
    out.push(entries.slice(i, i + size))
  }
  return out
}

export const handler = documentEventHandler<PhraseEventData>(
  async ({context, event}) => {
    const data = event.data ?? {}
    const phraseId = data._id ?? '(unknown)'
    const beforeZh = data.beforeZh
    const afterZh = data.afterZh
    const phraseEn = data.en

    if (beforeZh == null || afterZh == null) {
      console.log(
        JSON.stringify({
          ok: true,
          skipped: 'missing-before-or-after-zh',
          phraseId,
          beforeZh,
          afterZh,
        }),
      )
      return
    }

    if (beforeZh === afterZh) {
      console.log(
        JSON.stringify({
          ok: true,
          skipped: 'zh-unchanged',
          phraseId,
          zh: beforeZh,
        }),
      )
      return
    }

    if (!phraseEn) {
      console.log(
        JSON.stringify({
          ok: true,
          skipped: 'missing-en',
          phraseId,
        }),
      )
      return
    }

    const dryRun = isDryRun()
    const client = createClient({
      ...context.clientOptions,
      apiVersion: '2025-05-08',
      useCdn: false,
    })

    const query = buildCandidateQuery()
    const candidates = await client.fetch<Array<Record<string, unknown>>>(
      query,
      {oldZh: beforeZh, types: PROPAGATION_DOC_TYPES},
    )

    const plan = planPhrasePropagation(candidates, {
      phraseId,
      phraseEn,
      oldZh: beforeZh,
      newZh: afterZh,
    })

    // Recompute titleZh for portfolio entries whose display-part ZH changed.
    const titlePatches: PropagationPatch[] = []
    if (plan.titleRecomputeIds.length > 0) {
      const byId = new Map(
        candidates.map((d) => [String(d._id), d] as const),
      )
      for (const docId of plan.titleRecomputeIds) {
        const doc = byId.get(docId)
        if (!doc) continue
        const docPatches = plan.patches.filter((p) => p.docId === docId)
        const titleZh = computeTitleZhAfterPatches(doc, docPatches)
        if (titleZh == null) continue
        const current = typeof doc.titleZh === 'string' ? doc.titleZh : ''
        if (current === titleZh) continue
        titlePatches.push({
          docId,
          docType: 'portfolioEntry',
          fieldPath: 'titleZh',
          setPath: 'titleZh',
          newValue: titleZh,
        })
      }
    }

    const allPatches = [...plan.patches, ...titlePatches]
    const byDoc = groupPatchesByDoc(allPatches)
    const docEntries = [...byDoc.entries()]

    const summary = {
      ok: true,
      dryRun,
      phraseId,
      phraseEn,
      oldZh: beforeZh,
      newZh: afterZh,
      candidateDocs: candidates.length,
      patched: allPatches.map((p) => ({
        docId: p.docId,
        fieldPath: p.fieldPath,
      })),
      patchedFieldCount: allPatches.length,
      patchedDocCount: docEntries.length,
      enMismatchSkips: plan.skips.map((s) => ({
        docId: s.docId,
        fieldPath: s.fieldPath,
        expectedEn: s.expectedEn,
        actualEn: s.actualEn,
      })),
      titleZhRecomputed: titlePatches.map((p) => p.docId),
    }

    console.log(JSON.stringify(summary, null, 2))

    if (dryRun) {
      console.log(
        `[phrase-propagate] DRY_RUN — skipped commit for ${docEntries.length} doc(s)`,
      )
      return
    }

    if (docEntries.length === 0) {
      return
    }

    for (const chunk of chunkEntries(docEntries, PROPAGATION_CHUNK_SIZE)) {
      const tx = client.transaction()
      for (const [docId, set] of chunk) {
        tx.patch(docId, {set})
      }
      await tx.commit({visibility: 'async'})
    }

    console.log(
      `[phrase-propagate] committed patches for ${docEntries.length} doc(s)`,
    )
  },
)
