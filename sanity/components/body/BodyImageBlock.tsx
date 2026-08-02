/**
 * BodyImageBlock — PT image preview with hover edit/delete (Media-aligned metadata).
 *
 * Empty blocks open Sanity's native image form (`children`) in an elevated dialog
 * so upload / Browse Dataset / Media work inside the Content tool. Populated blocks
 * keep custom chrome + BodyImageEditDialog for Media metadata (site falls back to
 * asset altText / description when block alt / caption are empty).
 */

import {EditIcon, ImageIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient, type BlockProps} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'

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
  const {value, focused, selected, readOnly, open, onOpen, onClose, children} = props
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

  // After an asset attaches, close the native select dialog member-open state.
  useEffect(() => {
    if (assetId && open) {
      onClose()
    }
  }, [assetId, open, onClose])

  const openNativePicker = useCallback(() => {
    if (readOnly) return
    preserveBodyFocusScroll(() => onOpen())
  }, [onOpen, readOnly])

  const openEdit = useCallback(() => {
    if (readOnly) return
    if (!assetId) {
      openNativePicker()
      return
    }
    preserveBodyFocusScroll(() => setEditOpen(true))
  }, [assetId, openNativePicker, readOnly])

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

  const closeNativePicker = useCallback(() => {
    preserveBodyFocusScroll(() => onClose())
  }, [onClose])

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
            <Stack space={3}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  No image selected
                </Text>
                <Text size={1} muted>
                  Upload a file or choose from Media / Browse Dataset.
                </Text>
              </Stack>
              {!readOnly ? (
                <Button
                  icon={ImageIcon}
                  text="Select image"
                  tone="primary"
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  style={{alignSelf: 'flex-start'}}
                  onMouseDown={preventFocusSteal}
                  onClick={openNativePicker}
                />
              ) : null}
            </Stack>
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
              aria-label={assetId ? 'Edit image details' : 'Select image'}
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

      {/* Empty + member open: native image form, elevated for Content tool stacking */}
      {!assetId && open ? (
        <Dialog
          id="vp-body-image-select"
          header="Select image"
          width={1}
          onClose={closeNativePicker}
          zOffset={STUDIO_OVERLAY_Z}
          __unstable_autoFocus={false}
        >
          <Box padding={4}>{children}</Box>
        </Dialog>
      ) : null}

      {editOpen && assetId ? (
        <BodyImageEditDialog
          assetId={assetId}
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
          zOffset={STUDIO_OVERLAY_Z}
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
