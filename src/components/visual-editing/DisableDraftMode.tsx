'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()

  // Inside the Presentation Tool the Studio controls draft mode — hide the button.
  if (isPresentationTool) return null

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-gray-900 px-4 py-2 text-sm text-white"
    >
      Disable Draft Mode
    </a>
  )
}
