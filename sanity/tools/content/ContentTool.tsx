import {useCallback, useMemo, useState} from 'react'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ChevronDownIcon, ChevronRightIcon} from '@sanity/icons'
import {useRouter} from 'sanity/router'
import {DocumentTable} from './DocumentTable'
import {DocumentEditor} from './DocumentEditor'
import {
  NAV_ITEMS,
  defaultLeafId,
  findLeaf,
  type ContentGroup,
  type ContentLeaf,
} from './sections'

function groupContains(group: ContentGroup, leafId: string): boolean {
  return group.children.some((child) => child.id === leafId)
}

function NavLeafButton({
  item,
  active,
  indented,
  onSelect,
}: {
  item: ContentLeaf
  active: boolean
  indented?: boolean
  onSelect: (id: string) => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        padding: indented ? '8px 12px 8px 28px' : '10px 12px',
        borderRadius: 6,
        background: active ? 'var(--card-pressed-bg-color)' : 'transparent',
        color: 'inherit',
      }}
    >
      <Icon />
      <Text
        size={1}
        weight={active ? 'semibold' : 'regular'}
        style={{color: 'inherit'}}
      >
        {item.title}
      </Text>
    </button>
  )
}

function NavGroup({
  group,
  activeId,
  onSelect,
}: {
  group: ContentGroup
  activeId: string
  onSelect: (id: string) => void
}) {
  const containsActive = groupContains(group, activeId)
  const [open, setOpen] = useState(containsActive)
  const Icon = group.icon
  const expanded = open || containsActive

  return (
    <Stack space={1}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          borderRadius: 6,
        }}
      >
        <Icon />
        <Text size={1} weight="semibold" style={{flex: 1}}>
          {group.title}
        </Text>
        {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
      </button>
      {expanded
        ? group.children.map((child) => (
            <NavLeafButton
              key={child.id}
              item={child}
              active={activeId === child.id}
              indented
              onSelect={onSelect}
            />
          ))
        : null}
    </Stack>
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
    case 'client':
      return `client-${suffix}`
    case 'crewMember':
      return `crew-${suffix}`
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
      <Card
        borderRight
        padding={3}
        style={{
          width: 240,
          flexShrink: 0,
          overflowY: 'auto',
          height: '100%',
        }}
      >
        <Stack space={3}>
          <Box paddingX={2} paddingBottom={2}>
            <Text size={1} weight="bold" muted>
              Browse
            </Text>
          </Box>
          <Stack space={2}>
            {NAV_ITEMS.map((item) =>
              item.kind === 'group' ? (
                <NavGroup
                  key={item.id}
                  group={item}
                  activeId={activeId}
                  onSelect={selectSection}
                />
              ) : (
                <NavLeafButton
                  key={item.id}
                  item={item}
                  active={activeId === item.id}
                  onSelect={selectSection}
                />
              ),
            )}
          </Stack>
        </Stack>
      </Card>

      <Box flex={1} style={{minWidth: 0, height: '100%', overflow: 'hidden'}}>
        {editTarget ? (
          <DocumentEditor
            key={editTarget.documentId}
            documentId={editTarget.documentId}
            documentType={editTarget.documentType}
            title={editTarget.title}
            onBack={closeDocument}
          />
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
