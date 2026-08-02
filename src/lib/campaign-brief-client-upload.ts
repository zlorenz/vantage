/**
 * Browser → Sanity direct file upload for campaign brief attachments.
 *
 * Uses NEXT_PUBLIC_SANITY_UPLOAD_TOKEN (Editor-role, CORS-restricted).
 * Never import SANITY_API_WRITE_TOKEN here — that token is server-only.
 */

import type {BriefAttachmentMeta} from '@/lib/campaign-brief-attachments'

/** Same apiVersion as getSanityWriteClient() for asset API consistency. */
const SANITY_ASSETS_API_VERSION = '2025-02-19'

type SanityAssetUploadResponse = {
  _id?: string
  url?: string
  originalFilename?: string
  size?: number
  document?: {
    _id?: string
    url?: string
    originalFilename?: string
    size?: number
  }
}

function getUploadConfig(): {projectId: string; dataset: string; token: string} {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? ''
  const token = process.env.NEXT_PUBLIC_SANITY_UPLOAD_TOKEN ?? ''
  if (!projectId || !dataset || !token) {
    throw new Error('Sanity browser upload is not configured.')
  }
  return {projectId, dataset, token}
}

/**
 * Upload one File directly to Sanity's assets API.
 * Throws on HTTP / missing-field failures (caller surfaces inline error).
 */
export async function uploadBriefFileToSanity(file: File): Promise<BriefAttachmentMeta> {
  const {projectId, dataset, token} = getUploadConfig()
  const endpoint =
    `https://${projectId}.api.sanity.io/v${SANITY_ASSETS_API_VERSION}` +
    `/assets/files/${dataset}?filename=${encodeURIComponent(file.name)}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Sanity upload failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    )
  }

  const json = (await response.json()) as SanityAssetUploadResponse
  const doc = json.document ?? json
  const assetId = doc._id
  const cdnUrl = doc.url
  if (!assetId || !cdnUrl) {
    throw new Error('Sanity upload response missing asset id or CDN URL.')
  }

  return {
    filename: doc.originalFilename || file.name,
    assetId,
    cdnUrl,
    size: typeof doc.size === 'number' ? doc.size : file.size,
  }
}

/** Upload all selected files in parallel. Rejects if any upload fails. */
export async function uploadBriefFilesToSanity(
  files: File[],
): Promise<BriefAttachmentMeta[]> {
  const results = await Promise.allSettled(files.map((file) => uploadBriefFileToSanity(file)))
  const failedIndex = results.findIndex((r) => r.status === 'rejected')
  if (failedIndex >= 0) {
    const reason = (results[failedIndex] as PromiseRejectedResult).reason
    const err = reason instanceof Error ? reason : new Error(String(reason))
    // Tag with filename so the form can surface a precise inline message.
    err.message = `${files[failedIndex]?.name ?? 'file'}::${err.message}`
    throw err
  }
  return results.map((r) => (r as PromiseFulfilledResult<BriefAttachmentMeta>).value)
}
