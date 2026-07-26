import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from 'react'
import {
  Box,
  Card,
  Flex,
  Popover,
  Stack,
  Text,
  useClickOutsideEvent,
  useMediaIndex,
} from '@sanity/ui'
import {ChevronDownIcon, ChevronRightIcon} from '@sanity/icons'
import {useRouter} from 'sanity/router'
import {DocumentTable} from './DocumentTable'
import {DocumentEditor} from './DocumentEditor'
import {TranslationsTool} from './translations/TranslationsTool'
import {
  NAV_ITEMS,
  defaultLeafId,
  findLeaf,
  type ContentGroup,
  type ContentLeaf,
} from './sections'

/**
 * Match Sanity Studio’s 900px theme breakpoint (`studioTheme.media[2]`).
 * useMediaIndex ranges: 0 &lt;360, 1 &lt;600, 2 &lt;900, 3 &lt;1200, …
 * so `mediaIndex < 3` ⇔ viewport width &lt; 900px.
 */
/** Only hover-expand on true pointer devices (not sticky touch “hover”). */
const HOVER_EXPAND_MQ = '(hover: hover) and (pointer: fine)'

const NAV_FULL_WIDTH = 240
const NAV_RAIL_WIDTH = 52
/** Require a sustained hover before expanding the compact rail (avoids accidental popouts). */
const HOVER_ENTER_MS = 450
const HOVER_LEAVE_MS = 160

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const sync = () => setMatches(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [query])

  return matches
}

function groupContains(group: ContentGroup, leafId: string): boolean {
  return group.children.some((child) => child.id === leafId)
}

const navButtonStyle = (opts: {
  compact?: boolean
  indented?: boolean
  active?: boolean
}): CSSProperties => ({
  all: 'unset',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: opts.compact ? 'center' : 'flex-start',
  gap: 10,
  width: '100%',
  boxSizing: 'border-box',
  padding: opts.compact
    ? '10px 0'
    : opts.indented
      ? '8px 12px 8px 28px'
      : '10px 12px',
  borderRadius: 6,
  background: opts.active ? 'var(--card-pressed-bg-color)' : 'transparent',
  color: 'inherit',
})

function CompactIcon({Icon}: {Icon: ComponentType}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        // Icons are em-based; bump size without widening the rail.
        fontSize: 22,
        lineHeight: 1,
      }}
    >
      <Icon />
    </span>
  )
}

function NavLeafButton({
  item,
  active,
  indented,
  compact,
  onSelect,
}: {
  item: ContentLeaf
  active: boolean
  indented?: boolean
  /** Icon-only rail: center icon, native tooltip for the label. */
  compact?: boolean
  onSelect: (id: string) => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      title={item.title}
      aria-label={item.title}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(item.id)}
      style={navButtonStyle({compact, indented, active})}
    >
      {compact ? <CompactIcon Icon={Icon} /> : <Icon />}
      {compact ? null : (
        <Text
          size={1}
          weight={active ? 'semibold' : 'regular'}
          style={{color: 'inherit'}}
        >
          {item.title}
        </Text>
      )}
    </button>
  )
}

function NavGroup({
  group,
  activeId,
  compact,
  /** Wide desktop: keep the active section’s group open. */
  autoExpandActive,
  /** Touch rail (no hover-expand): tap parent → child list in a popover. */
  flyoutOnTap,
  onSelect,
  /** Pointer rail: tapping a group forces the overlay open + accordion. */
  onRequestExpand,
}: {
  group: ContentGroup
  activeId: string
  compact?: boolean
  autoExpandActive?: boolean
  flyoutOnTap?: boolean
  onSelect: (id: string) => void
  onRequestExpand?: () => void
}) {
  const containsActive = groupContains(group, activeId)
  const [open, setOpen] = useState(Boolean(autoExpandActive && containsActive))
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const Icon = group.icon

  useEffect(() => {
    if (autoExpandActive && containsActive) setOpen(true)
  }, [autoExpandActive, containsActive])

  useEffect(() => {
    if (!flyoutOnTap) setFlyoutOpen(false)
  }, [flyoutOnTap])

  useClickOutsideEvent(
    flyoutOpen ? () => setFlyoutOpen(false) : false,
    () => [flyoutRef.current, triggerRef.current],
  )

  // Only reveal children in the labeled accordion — never in the icon rail —
  // so top-level icons keep the same vertical slots when the rail expands.
  const showAccordionChildren = !compact && (open || Boolean(autoExpandActive && containsActive))

  const onParentClick = () => {
    if (flyoutOnTap) {
      setFlyoutOpen((prev) => !prev)
      return
    }
    if (compact) {
      onRequestExpand?.()
      setOpen(true)
      return
    }
    setOpen((prev) => !prev)
  }

  const parentButton = (
    <button
      ref={triggerRef}
      type="button"
      title={group.title}
      aria-label={group.title}
      aria-expanded={flyoutOnTap ? flyoutOpen : showAccordionChildren}
      aria-current={containsActive ? 'true' : undefined}
      onClick={onParentClick}
      style={navButtonStyle({
        compact,
        // Highlight the parent while its children aren’t visible (rail / closed accordion).
        active: containsActive && !showAccordionChildren,
      })}
    >
      {compact ? <CompactIcon Icon={Icon} /> : <Icon />}
      {compact ? null : (
        <>
          <Text size={1} weight="semibold" style={{flex: 1}}>
            {group.title}
          </Text>
          {showAccordionChildren ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </>
      )}
    </button>
  )

  const childList = (inFlyout: boolean) =>
    group.children.map((child) => (
      <NavLeafButton
        key={child.id}
        item={child}
        active={activeId === child.id}
        indented={!inFlyout}
        onSelect={(id) => {
          if (inFlyout) setFlyoutOpen(false)
          onSelect(id)
        }}
      />
    ))

  const body = (
    <Stack space={1}>
      {parentButton}
      {showAccordionChildren ? childList(false) : null}
    </Stack>
  )

  if (!flyoutOnTap) return body

  return (
    <Popover
      open={flyoutOpen}
      portal
      placement="right-start"
      fallbackPlacements={['right', 'left-start', 'bottom-start']}
      content={
        <Card radius={2} shadow={3} padding={2} style={{minWidth: 180}}>
          <Box ref={flyoutRef}>
            <Stack space={1}>
              <Box padding={2} paddingBottom={1}>
                <Text size={1} weight="semibold">
                  {group.title}
                </Text>
              </Box>
              {childList(true)}
            </Stack>
          </Box>
        </Card>
      }
    >
      {body}
    </Popover>
  )
}

function ContentNav({
  activeId,
  compactCapable,
  onSelect,
}: {
  activeId: string
  compactCapable: boolean
  onSelect: (id: string) => void
}) {
  const canHoverExpand = useMediaQuery(HOVER_EXPAND_MQ)
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearEnterTimer = useCallback(() => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current)
      enterTimer.current = null
    }
  }, [])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
  }, [])

  const expandNow = useCallback(() => {
    if (!compactCapable || !canHoverExpand) return
    clearEnterTimer()
    clearLeaveTimer()
    setHoverExpanded(true)
  }, [canHoverExpand, clearEnterTimer, clearLeaveTimer, compactCapable])

  const onNavEnter = useCallback(() => {
    if (!compactCapable || !canHoverExpand) return
    clearLeaveTimer()
    if (hoverExpanded || enterTimer.current) return
    enterTimer.current = setTimeout(() => {
      setHoverExpanded(true)
      enterTimer.current = null
    }, HOVER_ENTER_MS)
  }, [canHoverExpand, clearLeaveTimer, compactCapable, hoverExpanded])

  const onNavLeave = useCallback(() => {
    if (!compactCapable || !canHoverExpand) return
    clearEnterTimer()
    clearLeaveTimer()
    leaveTimer.current = setTimeout(() => {
      setHoverExpanded(false)
      leaveTimer.current = null
    }, HOVER_LEAVE_MS)
  }, [canHoverExpand, clearEnterTimer, clearLeaveTimer, compactCapable])

  useEffect(() => {
    if (!compactCapable) {
      clearEnterTimer()
      setHoverExpanded(false)
    }
  }, [clearEnterTimer, compactCapable])

  useEffect(
    () => () => {
      clearEnterTimer()
      clearLeaveTimer()
    },
    [clearEnterTimer, clearLeaveTimer],
  )

  // Wide pane: full labeled nav that pushes content.
  // Compact: same top-level structure as an icon rail; hover expands as overlay.
  const showFullNav = !compactCapable || (canHoverExpand && hoverExpanded)
  const overlay = compactCapable && showFullNav
  const compact = !showFullNav
  // Touch / coarse pointer: no hover-expand — groups open via popover instead.
  const flyoutOnTap = compactCapable && !canHoverExpand && compact
  // Only auto-open active groups on the always-wide desktop nav (not hover overlay),
  // so expanding the rail doesn’t shove top-level icons down.
  const autoExpandActive = !compactCapable

  const navBody = (
    <Stack space={2}>
      {NAV_ITEMS.map((item) =>
        item.kind === 'group' ? (
          <NavGroup
            key={item.id}
            group={item}
            activeId={activeId}
            compact={compact}
            autoExpandActive={autoExpandActive}
            flyoutOnTap={flyoutOnTap}
            onSelect={onSelect}
            onRequestExpand={expandNow}
          />
        ) : (
          <NavLeafButton
            key={item.id}
            item={item}
            active={activeId === item.id}
            compact={compact}
            onSelect={onSelect}
          />
        ),
      )}
    </Stack>
  )

  // Desktop / wide: same flex-sibling Card as before (no wrapper, no z-index).
  if (!compactCapable) {
    return (
      <Card
        borderRight
        padding={3}
        style={{
          width: NAV_FULL_WIDTH,
          flexShrink: 0,
          overflowY: 'auto',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {navBody}
      </Card>
    )
  }

  return (
    <Box
      style={{
        width: NAV_RAIL_WIDTH,
        flexShrink: 0,
        position: 'relative',
        height: '100%',
      }}
    >
      <Card
        borderRight
        shadow={overlay ? 3 : undefined}
        onMouseEnter={onNavEnter}
        onMouseLeave={onNavLeave}
        style={{
          position: overlay ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          width: showFullNav ? NAV_FULL_WIDTH : NAV_RAIL_WIDTH,
          // Elevate only while overlaying — never above the editor on desktop.
          zIndex: overlay ? 20 : undefined,
          overflowY: 'auto',
          height: '100%',
          boxSizing: 'border-box',
          // Keep vertical padding stable so icons don’t jump on expand.
          padding: showFullNav ? '8px 12px' : '8px 8px',
          transition: 'width 120ms ease',
        }}
      >
        {navBody}
      </Card>
    </Box>
  )
}

function newDocumentId(documentType: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  switch (documentType) {
    case 'portfolioEntry':
      return `portfolio-${suffix}`
    case 'blogPost':
      return `blogPost-${suffix}`
    case 'page':
      return `page-${suffix}`
    case 'videoFormat':
      return `videoFormat-${suffix}`
    case 'industry':
      return `industry-${suffix}`
    case 'market':
      return `market-${suffix}`
    case 'creditIdentity':
      return `ci_${suffix}${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    case 'category':
      return `category-${suffix}`
    case 'platform':
      return `platform-${suffix}`
    default:
      return suffix
  }
}

export function ContentTool() {
  // Section + open document live in the router (URL) — like the Structure
  // tool — so reloading the page restores what the user was viewing.
  const router = useRouter()
  const routerState = router.state as {section?: string; documentId?: string}
  // Same 900px threshold as Studio theme media[2] (mediaIndex < 3 ⇒ width < 900).
  const compactCapable = useMediaIndex() < 3

  const section = useMemo(
    () => findLeaf(routerState.section ?? '') ?? findLeaf(defaultLeafId())!,
    [routerState.section],
  )
  const activeId = section.id

  // Titles aren't encoded in the URL; cache them for nicer editor headers
  // during the session. After a reload the editor falls back to the doc title.
  const [titleCache, setTitleCache] = useState<Record<string, string>>({})

  const editTarget = routerState.documentId
    ? {
        documentId: routerState.documentId,
        documentType: section.documentType,
        title: titleCache[routerState.documentId],
      }
    : null

  const selectSection = useCallback(
    (id: string) => {
      router.navigate({section: id})
    },
    [router],
  )

  const openDocument = useCallback(
    (documentId: string, _documentType: string, title?: string) => {
      if (title) setTitleCache((prev) => ({...prev, [documentId]: title}))
      router.navigate({section: activeId, documentId})
    },
    [router, activeId],
  )

  const closeDocument = useCallback(() => {
    router.navigate({section: activeId})
  }, [router, activeId])

  const createDocument = useCallback(() => {
    if (section.canCreate === false) return
    if (section.singletonId) {
      openDocument(section.singletonId, section.documentType, section.title)
      return
    }
    openDocument(newDocumentId(section.documentType), section.documentType, section.createLabel)
  }, [openDocument, section])

  return (
    <Flex style={{height: '100%', minHeight: 0}}>
      <ContentNav
        activeId={activeId}
        compactCapable={compactCapable}
        onSelect={selectSection}
      />

      <Box flex={1} style={{minWidth: 0, height: '100%', overflow: 'hidden'}}>
        {editTarget ? (
          <DocumentEditor
            key={editTarget.documentId}
            documentId={editTarget.documentId}
            documentType={editTarget.documentType}
            title={editTarget.title}
            onBack={closeDocument}
          />
        ) : section.customView === 'translations' ? (
          <TranslationsTool />
        ) : (
          <DocumentTable
            section={section}
            onOpenDocument={openDocument}
            onCreateDocument={createDocument}
          />
        )}
      </Box>
    </Flex>
  )
}
