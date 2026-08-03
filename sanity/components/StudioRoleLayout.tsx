/**
 * Studio layout wrapper — stamps `data-studio-role` on <html> so CSS can
 * gate chrome that isn’t reachable via schema/role callbacks (e.g. Presentation
 * locations banner).
 *
 * Also consumed by sanity/patches/sanity-plugin-media+6.0.2.patch to lock
 * rename/delete of mediaTag-external-upload to Admin. If this attribute name
 * or values (`admin` | `editor` | `translator`) change, update that patch.
 */

import {useEffect} from 'react'
import {useCurrentUser} from 'sanity'

import {getStudioRole} from '../lib/studio-roles'

type LayoutProps = {
  renderDefault: (props: LayoutProps) => React.JSX.Element
}

export function StudioRoleLayout(props: LayoutProps) {
  const role = getStudioRole(useCurrentUser())

  useEffect(() => {
    document.documentElement.dataset.studioRole = role
    return () => {
      delete document.documentElement.dataset.studioRole
    }
  }, [role])

  return props.renderDefault(props)
}
