/**
 * BodyImageBlock — PT image preview with hover edit/delete (Media-aligned metadata).
 */

import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient, type BlockProps} from 'sanity'

import {BodyImageEditDialog} from './BodyImageEditDialog'
import {preserveBodyFocusScroll, preventFocusSteal} from './preserveBodyScroll'

type ImageBlockValue = {
  _type?: string
  _key?: string
  alt?: string
  caption?: string
  asset?: {_ref?: string; _type?: string}
}

type AssetPreview = {
  url?: string
  title?: string
  altText?: string
  description?: string
  originalFilename?: string
}

function assetIdFromValue(value: unknown): string | null {
  const ref = (value as ImageBlockValue | undefined)?.asset?._ref
  return typeof ref === 'string' && ref ? ref : null
}

export function BodyImageBlock(props: BlockProps) {
  const {value, focused, selected, readOnly} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const assetId = assetIdFromValue(value)
  const block = (value ?? {}) as ImageBlockValue

  const [asset, setAsset] = useState<AssetPreview | null>(null)
  const [loading, setLoading] = useState(Boolean(assetId))
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!assetId) {
      setAsset(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    client
      .fetch<AssetPreview>(
        `*[_id == $id][0]{url, title, altText, description, originalFilename}`,
        {id: assetId},
      )
      .then((data) => {
        if (!cancelled) setAsset(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setAsset(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assetId, client])

  const openEdit = useCallback(() => {
    if (readOnly || !assetId) return
    preserveBodyFocusScroll(() => setEditOpen(true))
  }, [assetId, readOnly])

  const closeEdit = useCallback(() => {
    preserveBodyFocusScroll(() => setEditOpen(false))
  }, [])

  const handleSaved = useCallback(() => {
    if (!assetId) {
      closeEdit()
      return
    }
    client
      .fetch<AssetPreview>(
        `*[_id == $id][0]{url, title, altText, description, originalFilename}`,
        {id: assetId},
      )
      .then((data) => setAsset(data ?? null))
      .finally(() => closeEdit())
  }, [assetId, client, closeEdit])

  const openDelete = useCallback(() => {
    if (readOnly) return
    preserveBodyFocusScroll(() => setConfirmDelete(true))
  }, [readOnly])

  const closeDelete = useCallback(() => {
    preserveBodyFocusScroll(() => setConfirmDelete(false))
  }, [])

  const removeBlock = useCallback(() => {
    preserveBodyFocusScroll(() => {
      setConfirmDelete(false)
      props.onRemove()
    })
  }, [props])

  return (
    <>
      <div
        className="vp-body-media-block vp-body-image-block"
        data-focused={focused ? 'true' : undefined}
        data-selected={selected ? 'true' : undefined}
      >
        {loading ? (
          <Flex align="center" justify="center" padding={5}>
            <Spinner />
          </Flex>
        ) : asset?.url ? (
          <img src={asset.url} alt={block.alt || asset.altText || ''} />
        ) : (
          <Card padding={4} tone="caution" radius={0}>
            <Text size={1}>Missing image asset</Text>
          </Card>
        )}

        {!readOnly ? (
          <div className="vp-body-media-actions">
            <Button
              icon={EditIcon}
              mode="ghost"
              tone="default"
              fontSize={1}
              padding={2}
              style={{background: 'var(--card-bg-color)'}}
              aria-label="Edit image details"
              onMouseDown={preventFocusSteal}
              onClick={openEdit}
            />
            <Button
              icon={TrashIcon}
              mode="ghost"
              tone="critical"
              fontSize={1}
              padding={2}
              style={{background: 'var(--card-bg-color)'}}
              aria-label="Remove image"
              onMouseDown={preventFocusSteal}
              onClick={openDelete}
            />
          </div>
        ) : null}
      </div>

      {editOpen && assetId ? (
        <BodyImageEditDialog
          assetId={assetId}
          blockPath={props.path}
          blockAlt={block.alt}
          blockCaption={block.caption}
          initialAsset={asset}
          onClose={closeEdit}
          onSaved={handleSaved}
        />
      ) : null}

      {confirmDelete ? (
        <Dialog
          id="vp-body-image-delete"
          header="Remove image?"
          width={0}
          onClose={closeDelete}
          zOffset={1200}
          __unstable_autoFocus={false}
          footer={
            <Box padding={3}>
              <Flex gap={2} justify="flex-end">
                <Button mode="ghost" text="Cancel" onClick={closeDelete} />
                <Button tone="critical" text="Remove" onClick={removeBlock} />
              </Flex>
            </Box>
          }
        >
          <Box padding={4}>
            <Stack space={3}>
              <Text size={1}>
                This removes the image from the body. The file stays in the Media library.
              </Text>
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </>
  )
}
