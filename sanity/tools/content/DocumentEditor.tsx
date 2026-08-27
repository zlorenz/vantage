import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ComponentProps,
  type ForwardedRef,
  type ReactNode,
} from 'react'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CloseIcon,
  EarthGlobeIcon,
  PublishIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {
  ChangeIndicatorsTracker,
  CopyPasteProvider,
  createPatchChannel,
  DivergencesProvider,
  FormBuilder,
  getPublishedId,
  HoveredFieldProvider,
  IsLastPaneProvider,
  ParseErrorsProvider,
  ReferenceInputOptionsProvider,
  useClient,
  useCopyPaste,
  useCurrentUser,
  useDocumentForm,
  useDocumentOperation,
  useDocumentPresence,
  useEditState,
  useGlobalCopyPasteElementHandler,
  VirtualizerScrollInstanceProvider,
  useSchema,
  type ObjectSchemaType,
  type PatchEvent,
  type Path,
  type SanityDocumentLike,
} from 'sanity'
import {compileDisplayTitles, trimPart} from '@display-titles'
import {
  formatImpactSummary,
  moveToTrash,
  preflightTrash,
  TRASHABLE_TYPES,
  type TrashableType,
} from './document-lifecycle'
import {createPreviewSecret} from '@sanity/preview-url-secret/create-secret'
import {setSecretSearchParams} from '@sanity/preview-url-secret/without-secret-search-params'
import {
  getFrontEndUrl,
  getSiteBaseUrl,
  mergeDocumentSnapshot,
  type FrontEndDocument,
} from './front-end-url'
import {getStudioRole} from '../../lib/studio-roles'

type DisplayTitlePartsDoc = {
  brandName?: string
  productName?: string
  campaignTitle?: string
}

/** Prefer Brand/Product/Campaign compile; fall back to stored title/name. */
function resolveChromeTitle(
  doc: SanityDocumentLike | null | undefined,
  fallback?: string,
): string {
  if (!doc) return fallback || 'Untitled'
  const parts = (doc as {displayTitleParts?: DisplayTitlePartsDoc}).displayTitleParts
  if (parts && trimPart(parts.brandName)) {
    const compiled = compileDisplayTitles({
      brandName: parts.brandName,
      productName: parts.productName,
      campaignTitle: parts.campaignTitle,
    }).documentTitle
    if (trimPart(compiled)) return compiled
  }
  if (typeof doc.title === 'string' && doc.title.trim()) return doc.title
  const name = (doc as {name?: string}).name
  if (typeof name === 'string' && name.trim()) return name
  return fallback || 'Untitled'
}


/**
 * Structure normally supplies this via ReferenceInputOptionsProvider.
 * Without it, reference array items set `forwardedAs` to a component that
 * returns null — so drag handles/menus show but preview labels vanish.
 */
const EditReferenceLink = forwardRef(function EditReferenceLink(
  props: Record<string, unknown> & {children?: ReactNode},
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {
    children,
    documentId: _documentId,
    documentType: _documentType,
    parentRefPath: _parentRefPath,
    template: _template,
    ...rest
  } = props
  return (
    <a ref={ref} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  )
})

type DocumentEditorProps = {
  documentId: string
  documentType: string
  title?: string
  onBack: () => void
}

type FormShellProps = {
  publishedId: string
  documentType: string
  scrollElement: HTMLElement | null
}

function FormShell({
  publishedId,
  documentType,
  scrollElement,
}: FormShellProps) {
  const containerElement = useRef<HTMLDivElement | null>(null)
  const patchChannel = useMemo(() => createPatchChannel(), [])
  const presence = useDocumentPresence(publishedId)
  const {setDocumentMeta} = useCopyPaste()

  const {
    formState,
    onChange,
    onPathOpen,
    onFocus,
    onBlur,
    onSetActiveFieldGroup,
    onSetCollapsedFieldSet,
    onSetCollapsedPath,
    collapsedFieldSets,
    collapsedPaths,
    schemaType,
    value,
    validation,
    focusPath,
    ready,
    hasUpstreamVersion,
    connectionState,
  } = useDocumentForm({
    documentId: publishedId,
    documentType,
  })

  useGlobalCopyPasteElementHandler({
    value: value as SanityDocumentLike | undefined,
    element: scrollElement,
    focusPath,
  })

  useEffect(() => {
    setDocumentMeta({
      documentId: publishedId,
      documentType,
      schemaType: schemaType as ObjectSchemaType,
      onChange: onChange as (event: PatchEvent) => void,
    })
  }, [publishedId, documentType, schemaType, onChange, setDocumentMeta])

  if (!ready || connectionState === 'connecting' || !formState) {
    return (
      <Flex align="center" justify="center" gap={3} padding={6}>
        <Spinner />
        <Text size={1} muted>
          Loading editor…
        </Text>
      </Flex>
    )
  }

  return (
    <ReferenceInputOptionsProvider
      EditReferenceLinkComponent={
        EditReferenceLink as unknown as ComponentProps<
          typeof ReferenceInputOptionsProvider
        >['EditReferenceLinkComponent']
      }
    >
      <HoveredFieldProvider>
        <IsLastPaneProvider isLastPane>
          <ParseErrorsProvider>
            <DivergencesProvider enabled={false}>
              <VirtualizerScrollInstanceProvider
                scrollElement={scrollElement}
                containerElement={containerElement}
              >
                <Box
                  ref={containerElement}
                  padding={4}
                  style={{maxWidth: 1280, margin: '0 auto', width: '100%'}}
                >
                  <ChangeIndicatorsTracker>
                    <FormBuilder
                      __internal_patchChannel={patchChannel}
                      autoFocus
                      changesOpen={false}
                      collapsedFieldSets={collapsedFieldSets}
                      collapsedPaths={collapsedPaths}
                      focusPath={focusPath as Path}
                      focused={formState.focused}
                      groups={formState.groups}
                      hasUpstreamVersion={hasUpstreamVersion}
                      changed={formState.changed}
                      id="root"
                      members={formState.members}
                      onChange={onChange}
                      onFieldGroupSelect={onSetActiveFieldGroup}
                      onPathBlur={onBlur}
                      onPathFocus={onFocus}
                      onPathOpen={onPathOpen}
                      onSetFieldSetCollapsed={onSetCollapsedFieldSet}
                      onSetPathCollapsed={onSetCollapsedPath}
                      presence={presence}
                      readOnly={formState.readOnly}
                      schemaType={schemaType}
                      validation={validation}
                      value={value}
                    />
                  </ChangeIndicatorsTracker>
                </Box>
              </VirtualizerScrollInstanceProvider>
            </DivergencesProvider>
          </ParseErrorsProvider>
        </IsLastPaneProvider>
      </HoveredFieldProvider>
    </ReferenceInputOptionsProvider>
  )
}

export function DocumentEditor({
  documentId,
  documentType,
  title,
  onBack,
}: DocumentEditorProps) {
  const publishedId = getPublishedId(documentId)
  const toast = useToast()
  const currentUser = useCurrentUser()
  const studioClient = useClient({apiVersion: '2025-02-19'})
  const client = useMemo(
    () => studioClient.withConfig({perspective: 'raw'}),
    [studioClient],
  )
  const [busy, setBusy] = useState<
    'publish' | 'unpublish' | 'discard' | 'delete' | 'schedule' | null
  >(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false)
  const [trashImpactText, setTrashImpactText] = useState('')
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false)
  const [viewOnSiteLoading, setViewOnSiteLoading] = useState(false)

  const editState = useEditState(publishedId, documentType)
  const ops = useDocumentOperation(publishedId, documentType)
  const schema = useSchema()
  const supportsTrash = TRASHABLE_TYPES.includes(documentType as TrashableType)
  const role = getStudioRole(currentUser)
  const isAdmin = role === 'admin'
  const isTranslator = role === 'translator'

  // Prefer live compile from displayTitleParts so chrome matches Portfolio Details.
  // Fall back to nav title, then schema type title (singletons like siteSettings
  // have neither a title field nor a list-row cache on deep link / reload).
  const schemaTypeTitle = schema.get(documentType)?.title
  const headerTitle = resolveChromeTitle(
    (editState.draft as SanityDocumentLike | null) ??
      (editState.published as SanityDocumentLike | null),
    title || (typeof schemaTypeTitle === 'string' ? schemaTypeTitle : undefined),
  )

  const canPublish = Boolean(ops.publish?.disabled) === false && Boolean(editState.draft)
  // Only when published exists to revert to — draft-only Discard would delete the doc.
  const canDiscard =
    Boolean(ops.discardChanges?.disabled) === false &&
    Boolean(editState.published) &&
    Boolean(editState.draft)
  // Admin + Editor only (not Translator); only when a published version exists to remove.
  const canUnpublish =
    !isTranslator &&
    Boolean(editState.published) &&
    Boolean(ops.unpublish?.disabled) === false
  // Translator: no Move to Trash. Permanent delete (non-trash types): admin only.
  const canDelete = isTranslator
    ? false
    : supportsTrash
      ? Boolean(editState.draft || editState.published)
      : isAdmin && Boolean(ops.delete?.disabled) === false

  const frontEndUrl = useMemo(
    () =>
      getFrontEndUrl(
        documentType,
        mergeDocumentSnapshot(
          editState.published as FrontEndDocument | undefined,
          editState.draft as FrontEndDocument | undefined,
        ),
        // Translators verify ZH copy — open the Chinese front-end URL.
        {locale: isTranslator ? 'zh' : 'en'},
      ),
    [documentType, editState.draft, editState.published, isTranslator],
  )

  const handlePublish = useCallback(() => {
    setBusy('publish')
    ops.publish.execute()
    toast.push({status: 'success', title: 'Published'})
    setBusy(null)
  }, [ops.publish, toast])

  const handleUnpublish = useCallback(() => {
    if (isTranslator) return
    setBusy('unpublish')
    ops.unpublish.execute()
    toast.push({status: 'success', title: 'Unpublished'})
    setUnpublishConfirmOpen(false)
    setBusy(null)
  }, [isTranslator, ops.unpublish, toast])

  // createPreviewSecret / setSecretSearchParams are @internal / @alpha exports from
  // @sanity/preview-url-secret — the same surface Presentation depends on. A future
  // sanity / next-sanity upgrade could change or remove them without a semver-major
  // bump; check this handler first if "View on site" breaks after an upgrade.
  //
  // Open a blank tab synchronously in the click gesture, then navigate it after
  // minting. `noopener`/`noreferrer` as window.open features make Chromium return
  // null (no controllable reference), so we omit them and clear `opener` instead.
  const handleViewOnSite = useCallback(async () => {
    if (!frontEndUrl || viewOnSiteLoading) return

    // Must run before any await — browsers only treat this as user-initiated then.
    const previewName = `vp-site-preview-${Date.now()}`
    const previewWindow = window.open('about:blank', previewName)
    if (!previewWindow) {
      toast.push({
        status: 'warning',
        title: 'Could not open preview',
        description: 'Allow pop-ups for this site, then try again.',
      })
      return
    }
    try {
      previewWindow.opener = null
    } catch {
      // Some WindowProxies disallow assigning opener; navigation still proceeds.
    }

    setViewOnSiteLoading(true)
    try {
      // Dual @sanity/client majors (7.x under sanity-plugin-media/SDK, 8.x
      // under Studio 6.11) — TS sees them as distinct nominal types even
      // though createPreviewSecret only needs withConfig/patch/transaction/
      // delete, present on both. Remove this cast if @sanity/preview-url-secret
      // ever types createPreviewSecret with its own SanityClientLike (already
      // used elsewhere in that package for validatePreviewUrl).
      const {secret} = await createPreviewSecret(
        client as unknown as Parameters<typeof createPreviewSecret>[0],
        'vantage/content-tool',
        typeof window !== 'undefined' ? window.location.href : '',
        currentUser?.id,
      )

      const frontEnd = new URL(frontEndUrl)
      const redirectTo = `${frontEnd.pathname}${frontEnd.search}${frontEnd.hash}`
      const enableUrl = setSecretSearchParams(
        new URL('/api/draft-mode/enable', `${getSiteBaseUrl()}/`),
        secret,
        redirectTo,
        'drafts',
      ).toString()

      if (previewWindow.location) {
        previewWindow.location.href = enableUrl
      } else {
        // Restricted WindowProxy (no writable location): reuse the named tab.
        window.open(enableUrl, previewName)
      }
    } catch (error) {
      try {
        previewWindow.close()
      } catch {
        // Tab may already be gone.
      }
      toast.push({
        status: 'error',
        title: 'Could not open preview',
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setViewOnSiteLoading(false)
    }
  }, [client, currentUser?.id, frontEndUrl, toast, viewOnSiteLoading])

  const handleDiscard = useCallback(() => {
    setBusy('discard')
    ops.discardChanges.execute()
    toast.push({status: 'info', title: 'Discarded draft changes'})
    setBusy(null)
  }, [ops.discardChanges, toast])

  const openTrashConfirm = useCallback(async () => {
    if (!supportsTrash || isTranslator) return
    setBusy('delete')
    try {
      const [item] = await preflightTrash(client, [publishedId])
      setTrashImpactText(
        item?.impacts?.length
          ? formatImpactSummary(item.impacts)
          : 'No inbound references found.',
      )
      setTrashConfirmOpen(true)
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Could not prepare Move to Trash',
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setBusy(null)
    }
  }, [client, isTranslator, publishedId, supportsTrash, toast])

  const handleMoveToTrash = useCallback(async () => {
    if (isTranslator) return
    setBusy('delete')
    try {
      const actor =
        currentUser?.name || currentUser?.email || currentUser?.id || 'Studio user'
      const [result] = await moveToTrash(client, [publishedId], actor)
      if (!result?.ok) {
        throw new Error(result?.error || 'Move to Trash failed')
      }
      toast.push({status: 'success', title: 'Moved to Trash'})
      setTrashConfirmOpen(false)
      onBack()
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Could not move to Trash',
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setBusy(null)
    }
  }, [client, currentUser, isTranslator, onBack, publishedId, toast])

  const handleDelete = useCallback(() => {
    if (supportsTrash) {
      if (isTranslator) return
      void openTrashConfirm()
      return
    }
    if (!isAdmin) return
    if (!window.confirm('Delete this document permanently?')) return
    setBusy('delete')
    ops.delete.execute()
    toast.push({status: 'success', title: 'Deleted'})
    setBusy(null)
    onBack()
  }, [
    isAdmin,
    isTranslator,
    onBack,
    openTrashConfirm,
    ops.delete,
    supportsTrash,
    toast,
  ])

  const handleSchedule = useCallback(async () => {
    const publishAt = new Date(scheduleAt)
    if (!scheduleAt || Number.isNaN(publishAt.getTime())) {
      toast.push({status: 'warning', title: 'Choose a valid publication date and time'})
      return
    }
    if (publishAt.getTime() <= Date.now()) {
      toast.push({status: 'warning', title: 'Publication time must be in the future'})
      return
    }
    if (!editState.draft) {
      toast.push({status: 'warning', title: 'Make an edit before scheduling'})
      return
    }

    setBusy('schedule')
    try {
      const release = await client.releases.create({
        metadata: {
          title: `Scheduled: ${headerTitle}`,
          releaseType: 'scheduled',
          cardinality: 'one',
          intendedPublishAt: publishAt.toISOString(),
        },
      })

      await client.createVersion({
        publishedId,
        baseId: `drafts.${publishedId}`,
        releaseId: release.releaseId,
      })
      await client.releases.schedule({
        releaseId: release.releaseId,
        publishAt: publishAt.toISOString(),
      })

      toast.push({
        status: 'success',
        title: `Scheduled for ${publishAt.toLocaleString()}`,
      })
      setScheduleOpen(false)
      onBack()
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Could not schedule publication',
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setBusy(null)
    }
  }, [
    client,
    editState.draft,
    headerTitle,
    onBack,
    publishedId,
    scheduleAt,
    toast,
  ])

  return (
    <Flex direction="column" style={{height: '100%', minHeight: 0}}>
      <Card borderBottom padding={3} style={{flexShrink: 0}}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Flex align="center" gap={2} style={{minWidth: 0}}>
            <Button
              mode="bleed"
              icon={ArrowLeftIcon}
              text="Back"
              onClick={onBack}
            />
            <Box style={{minWidth: 0}}>
              <Text size={2} weight="semibold" textOverflow="ellipsis">
                {headerTitle}
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap={2} wrap="wrap">
            {editState.draft ? (
              <Text size={1} muted>
                Draft
              </Text>
            ) : null}
            {editState.published && !editState.draft ? (
              <Text size={1} muted>
                Published
              </Text>
            ) : null}
            {editState.published && editState.draft ? (
              <Text size={1} muted>
                Published + edits
              </Text>
            ) : null}

            {frontEndUrl ? (
              <Button
                mode="ghost"
                icon={EarthGlobeIcon}
                text="View on site"
                loading={viewOnSiteLoading}
                disabled={busy !== null || viewOnSiteLoading}
                onClick={handleViewOnSite}
              />
            ) : null}
            {canDiscard ? (
              <Button
                mode="ghost"
                text="Discard changes"
                disabled={busy !== null}
                onClick={handleDiscard}
              />
            ) : null}
            {canDelete ? (
              <Button
                mode="ghost"
                tone="critical"
                icon={TrashIcon}
                text={supportsTrash ? 'Move to Trash' : undefined}
                disabled={busy !== null}
                onClick={handleDelete}
              />
            ) : null}
            <Button
              mode="ghost"
              icon={CalendarIcon}
              text="Schedule"
              disabled={!editState.draft || busy !== null}
              onClick={() => setScheduleOpen(true)}
            />
            {canUnpublish ? (
              <Button
                mode="ghost"
                tone="critical"
                icon={UnpublishIcon}
                text="Unpublish"
                disabled={busy !== null}
                onClick={() => setUnpublishConfirmOpen(true)}
              />
            ) : null}
            <Button
              tone="positive"
              icon={PublishIcon}
              text="Publish"
              disabled={!canPublish || busy !== null}
              onClick={handlePublish}
            />
            <Button mode="bleed" icon={CloseIcon} onClick={onBack} />
          </Flex>
        </Flex>
      </Card>

      <Box
        ref={setScrollElement}
        flex={1}
        style={{overflow: 'auto', minHeight: 0}}
      >
        <CopyPasteProvider>
          <FormShell
            publishedId={publishedId}
            documentType={documentType}
            scrollElement={scrollElement}
          />
        </CopyPasteProvider>
      </Box>

      {scheduleOpen ? (
        <Dialog
          id="schedule-publication"
          header="Schedule publication"
          width={1}
          onClose={() => {
            if (busy !== 'schedule') setScheduleOpen(false)
          }}
        >
          <Stack space={4} padding={4}>
            <Text size={1} muted>
              The current draft will be locked and published automatically at
              this date and time.
            </Text>
            <TextInput
              type="datetime-local"
              value={scheduleAt}
              onChange={(event) => setScheduleAt(event.currentTarget.value)}
            />
            <Flex justify="flex-end" gap={2}>
              <Button
                mode="bleed"
                text="Cancel"
                disabled={busy === 'schedule'}
                onClick={() => setScheduleOpen(false)}
              />
              <Button
                tone="primary"
                text={busy === 'schedule' ? 'Scheduling…' : 'Schedule'}
                disabled={!scheduleAt || busy === 'schedule'}
                onClick={handleSchedule}
              />
            </Flex>
          </Stack>
        </Dialog>
      ) : null}

      {trashConfirmOpen ? (
        <Dialog
          id="move-to-trash"
          header="Move to Trash"
          width={1}
          onClose={() => {
            if (busy !== 'delete') setTrashConfirmOpen(false)
          }}
        >
          <Stack space={4} padding={4}>
            <Text size={1}>
              Move “{headerTitle}” to Trash? It stays recoverable for 30 days,
              then is permanently deleted.
            </Text>
            <Card padding={3} radius={2} tone="caution">
              <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
                {trashImpactText}
              </Text>
            </Card>
            <Flex justify="flex-end" gap={2}>
              <Button
                mode="bleed"
                text="Cancel"
                disabled={busy === 'delete'}
                onClick={() => setTrashConfirmOpen(false)}
              />
              <Button
                tone="critical"
                text={busy === 'delete' ? 'Moving…' : 'Move to Trash'}
                disabled={busy === 'delete'}
                onClick={handleMoveToTrash}
              />
            </Flex>
          </Stack>
        </Dialog>
      ) : null}

      {unpublishConfirmOpen ? (
        <Dialog
          id="unpublish-document"
          header="Unpublish"
          width={1}
          onClose={() => {
            if (busy !== 'unpublish') setUnpublishConfirmOpen(false)
          }}
        >
          <Stack space={4} padding={4}>
            <Text size={1}>
              Unpublish “{headerTitle}”? This removes it from the public
              website.
            </Text>
            <Text size={1} muted>
              The draft — including your current edits — is kept. Nothing is
              deleted. You can re-publish anytime.
            </Text>
            <Flex justify="flex-end" gap={2}>
              <Button
                mode="bleed"
                text="Cancel"
                disabled={busy === 'unpublish'}
                onClick={() => setUnpublishConfirmOpen(false)}
              />
              <Button
                tone="critical"
                text={busy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
                disabled={busy === 'unpublish'}
                onClick={handleUnpublish}
              />
            </Flex>
          </Stack>
        </Dialog>
      ) : null}
    </Flex>
  )
}
