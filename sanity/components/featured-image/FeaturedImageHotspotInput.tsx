/**
 * FeaturedImageHotspotInput — stock ImageInput (upload/replace/delete) plus a
 * custom dual-aspect focal-point editor for portfolio featured images.
 *
 * Writes standard Sanity hotspot/crop so urlForImage() consumers stay unchanged.
 */

import {Box, Card, Stack, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useClient, type ObjectInputProps} from 'sanity'

type ImageFieldValue = {
  _type?: 'image'
  asset?: {_type?: 'reference'; _ref?: string}
  hotspot?: {
    _type?: string
    x?: number
    y?: number
    height?: number
    width?: number
  }
  crop?: {
    _type?: string
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

type AssetPreview = {
  url?: string
  metadata?: {
    dimensions?: {
      width?: number
      height?: number
      aspectRatio?: number
    }
  }
}

function assetIdFromValue(value: unknown): string | null {
  const ref = (value as ImageFieldValue | undefined)?.asset?._ref
  return typeof ref === 'string' && ref ? ref : null
}

export function FeaturedImageHotspotInput(props: ObjectInputProps) {
  const {value, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const assetId = assetIdFromValue(value)

  const [asset, setAsset] = useState<AssetPreview | null>(null)

  useEffect(() => {
    if (!assetId) {
      setAsset(null)
      return
    }
    let cancelled = false
    client
      .fetch<AssetPreview>(
        `*[_id == $id][0]{url, metadata{dimensions{width, height, aspectRatio}}}`,
        {id: assetId},
      )
      .then((data) => {
        if (!cancelled) setAsset(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setAsset(null)
      })
    return () => {
      cancelled = true
    }
  }, [assetId, client])

  return (
    <Stack space={3}>
      {renderDefault(props)}
      {assetId ? (
        <Card padding={3} radius={2} shadow={1} tone="transparent" border>
          <Stack space={2}>
            <Text size={1} muted>
              Focal point guides (4:5 work carousel + 16:9 homepage) — coming next.
            </Text>
            {asset?.url ? (
              <Box>
                <img
                  src={asset.url}
                  alt=""
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    verticalAlign: 'top',
                  }}
                />
              </Box>
            ) : null}
          </Stack>
        </Card>
      ) : null}
    </Stack>
  )
}
