/**
 * BodyImageEditDialog — Title / Alt text / Description aligned with Media library.
 *
 * Writes asset metadata (title, altText, description) and mirrors alt + caption
 * onto the Portable Text image block for the frontend.
 */

import {Box, Button, Dialog, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  PatchEvent,
  set,
  unset,
  useClient,
  useFormCallbacks,
  type Path,
} from 'sanity'

type AssetFields = {
  url?: string
  title?: string
  altText?: string
  description?: string
  originalFilename?: string
}

type Props = {
  assetId: string
  blockPath: Path
  blockAlt?: string
  blockCaption?: string
  initialAsset?: AssetFields | null
  onClose: () => void
  onSaved: () => void
}

function emptyToUndef(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function BodyImageEditDialog({
  assetId,
  blockPath,
  blockAlt,
  blockCaption,
  initialAsset,
  onClose,
  onSaved,
}: Props) {
  const client = useClient({apiVersion: '2025-01-01'})
  const {onChange} = useFormCallbacks()

  const [title, setTitle] = useState('')
  const [altText, setAltText] = useState('')
  const [description, setDescription] = useState('')
  const [filename, setFilename] = useState<string | undefined>()
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const apply = (data: AssetFields | null | undefined) => {
      if (cancelled || !data) return
      setTitle(data.title ?? '')
      setAltText(data.altText || blockAlt || '')
      setDescription(data.description || blockCaption || '')
      setFilename(data.originalFilename)
      setPreviewUrl(data.url)
    }

    if (initialAsset) {
      apply(initialAsset)
    }

    client
      .fetch<AssetFields>(
        `*[_id == $id][0]{url, title, altText, description, originalFilename}`,
        {id: assetId},
      )
      .then((data) => apply(data))
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load asset details')
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetId, blockAlt, blockCaption, client, initialAsset])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    const nextTitle = emptyToUndef(title)
    const nextAlt = emptyToUndef(altText)
    const nextDescription = emptyToUndef(description)

    try {
      const assetPatch = client.patch(assetId)
      if (nextTitle) assetPatch.set({title: nextTitle})
      else assetPatch.unset(['title'])
      if (nextAlt) assetPatch.set({altText: nextAlt})
      else assetPatch.unset(['altText'])
      if (nextDescription) assetPatch.set({description: nextDescription})
      else assetPatch.unset(['description'])
      await assetPatch.commit()

      const patches = [
        nextAlt ? set(nextAlt, [...blockPath, 'alt']) : unset([...blockPath, 'alt']),
        nextDescription
          ? set(nextDescription, [...blockPath, 'caption'])
          : unset([...blockPath, 'caption']),
      ]
      onChange(PatchEvent.from(patches))
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save image details')
      setSaving(false)
    }
  }, [altText, assetId, blockPath, client, description, onChange, onSaved, title])

  return (
    <Dialog
      id="vp-body-image-edit"
      header="Image details"
      width={1}
      onClose={onClose}
      zOffset={1200}
      // Keep focus compose scroll stable when dialog takes focus
      __unstable_autoFocus={false}
      footer={
        <Box padding={3}>
          <Flex gap={2} justify="flex-end">
            <Button mode="ghost" text="Cancel" onClick={onClose} disabled={saving} />
            <Button text="Save" tone="positive" onClick={handleSave} disabled={saving} />
          </Flex>
        </Box>
      }
    >
      <Box padding={4}>
        <Flex gap={4} align="flex-start" wrap="wrap">
          <Box style={{flex: '1 1 220px', minWidth: 180, maxWidth: 320}}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  background: 'var(--card-muted-bg-color)',
                }}
              />
            ) : null}
            <Stack space={2} marginTop={3}>
              {filename ? (
                <Text size={1} muted>
                  Filename: {filename}
                </Text>
              ) : null}
            </Stack>
          </Box>

          <Box style={{flex: '1 1 280px', minWidth: 240}}>
            <Stack space={4}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Title
                </Text>
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.currentTarget.value)}
                  placeholder="Optional title in Media library"
                />
              </Stack>

              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Alt text
                </Text>
                <TextInput
                  value={altText}
                  onChange={(e) => setAltText(e.currentTarget.value)}
                  placeholder="Describe the image for accessibility"
                />
              </Stack>

              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Description
                </Text>
                <Text size={0} muted>
                  Used as the on-site caption when present.
                </Text>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Optional caption / description"
                  rows={4}
                />
              </Stack>

              {error ? (
                <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
                  {error}
                </Text>
              ) : null}
            </Stack>
          </Box>
        </Flex>
      </Box>
    </Dialog>
  )
}
