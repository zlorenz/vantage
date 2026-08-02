/**
 * Elevate sanity-plugin-media's asset-source overlay above the Content tool form.
 *
 * FormBuilderTool portals to document.body but uses ambient useLayer() z-index.
 * Inside our custom Content tool that ambient layer is too low, so title/excerpt
 * fields paint through the Media grid. Same class of bug as ExpandedLayer vs
 * Content tool — fixed the same way as BodyPortableTextInput focus mode.
 *
 * Only wraps the image/file field asset source. The top-nav Media tool uses a
 * different component and is unchanged.
 */

import {Layer, Portal} from '@sanity/ui'
import {mediaAssetSource} from 'sanity-plugin-media'
import type {AssetSourceComponentProps} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'

const MediaBrowser = mediaAssetSource.component

export function ElevatedMediaAssetSource(props: AssetSourceComponentProps) {
  return (
    <Portal>
      <Layer zOffset={STUDIO_OVERLAY_Z}>
        <MediaBrowser {...props} />
      </Layer>
    </Portal>
  )
}

export const elevatedMediaAssetSource = {
  ...mediaAssetSource,
  component: ElevatedMediaAssetSource,
}
