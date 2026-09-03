/**
 * Review dialog for Crew Members potential-duplicate flags.
 * Merge reuses IdentityMergeDialog; dismiss writes duplicateDismissal.
 */

import {useCallback, useMemo, useState} from 'react'
import {getPublishedId, useClient, useCurrentUser} from 'sanity'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {
  duplicatePairKey,
  type DuplicatePeer,
} from '@crew-credits'

export type DuplicateReviewIdentity = {
  _id: string
  name: string
  nameZh?: string
  url?: string
  roleKeys?: string[]
}

function dismissalDocumentId(pairKey: string): string {
  return `duplicateDismissal.${pairKey.replace(/\|/g, '__')}`
}

function reasonLabel(peer: DuplicatePeer): string {
  if (peer.kind === 'exact_name') return 'Exact name match'
  if (!peer.reasons.length) return 'Near-miss match'
  const parts = peer.reasons.map((r) => r.replace(/_/g, ' '))
  const conf = peer.confidence ? ` (${peer.confidence})` : ''
  return `${parts.join(', ')}${conf}`
}

export function DuplicateReviewDialog({
  source,
  peers,
  peerRows,
  onClose,
  onDismissed,
  onMerge,
}: {
  source: DuplicateReviewIdentity
  peers: DuplicatePeer[]
  /** Full row data for peers when available from the table. */
  peerRows: ReadonlyMap<string, DuplicateReviewIdentity>
  onClose: () => void
  onDismissed: (pairKey: string) => void
  onMerge: (targetId: string) => void
}) {
  const studioClient = useClient({apiVersion: '2024-01-01'})
  const client = useMemo(
    () => studioClient.withConfig({perspective: 'raw'}),
    [studioClient],
  )
  const currentUser = useCurrentUser()
  const [busyPeerId, setBusyPeerId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dismiss = useCallback(
    async (peer: DuplicatePeer) => {
      const sourceId = getPublishedId(source._id)
      const peerId = getPublishedId(peer.identityId)
      const pairKey = duplicatePairKey(sourceId, peerId)
      setBusyPeerId(peerId)
      setErrorMessage(null)
      try {
        await client.createOrReplace({
          _id: dismissalDocumentId(pairKey),
          _type: 'duplicateDismissal',
          pairKey,
          identityA: sourceId < peerId ? sourceId : peerId,
          identityB: sourceId < peerId ? peerId : sourceId,
          dismissedAt: new Date().toISOString(),
          ...(currentUser?.email || currentUser?.id
            ? {dismissedBy: currentUser.email || currentUser.id}
            : {}),
        })
        onDismissed(pairKey)
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Could not save dismissal',
        )
      } finally {
        setBusyPeerId(null)
      }
    },
    [client, currentUser, onDismissed, source._id],
  )

  return (
    <Dialog
      id="crew-duplicate-review"
      header="Potential duplicate"
      width={1}
      onClose={onClose}
    >
      <Stack space={4} padding={4}>
        <Card padding={3} radius={2} tone="caution" border>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              {source.name}
            </Text>
            {source.nameZh ? (
              <Text size={0} muted>
                {source.nameZh}
              </Text>
            ) : null}
            {source.url ? (
              <Text size={0} muted>
                {source.url}
              </Text>
            ) : null}
            {source.roleKeys?.length ? (
              <Text size={0} muted>
                Roles: {source.roleKeys.join(', ')}
              </Text>
            ) : null}
          </Stack>
        </Card>

        <Text size={1} muted>
          Possible match{peers.length === 1 ? '' : 'es'} — merge if the same
          person/company, or dismiss if they are different.
        </Text>

        <Stack space={3}>
          {peers.map((peer) => {
            const row = peerRows.get(peer.identityId)
            const busy = busyPeerId === peer.identityId
            return (
              <Card key={peer.identityId} padding={3} radius={2} border>
                <Stack space={3}>
                  <Flex align="flex-start" justify="space-between" gap={3}>
                    <Stack space={2} style={{minWidth: 0, flex: 1}}>
                      <Text size={1} weight="semibold">
                        {row?.name || peer.name}
                      </Text>
                      {row?.nameZh ? (
                        <Text size={0} muted>
                          {row.nameZh}
                        </Text>
                      ) : null}
                      {row?.url ? (
                        <Text size={0} muted>
                          {row.url}
                        </Text>
                      ) : null}
                      {row?.roleKeys?.length ? (
                        <Text size={0} muted>
                          Roles: {row.roleKeys.join(', ')}
                        </Text>
                      ) : null}
                      <Box>
                        <Badge
                          tone={peer.kind === 'exact_name' ? 'caution' : 'default'}
                          fontSize={0}
                        >
                          {reasonLabel(peer)}
                        </Badge>
                      </Box>
                    </Stack>
                  </Flex>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      text="Merge into…"
                      tone="critical"
                      mode="ghost"
                      fontSize={1}
                      disabled={Boolean(busyPeerId)}
                      onClick={() => onMerge(peer.identityId)}
                    />
                    <Button
                      text="Dismiss — not a duplicate"
                      mode="ghost"
                      fontSize={1}
                      disabled={Boolean(busyPeerId)}
                      loading={busy}
                      onClick={() => void dismiss(peer)}
                    />
                  </Flex>
                </Stack>
              </Card>
            )
          })}
        </Stack>

        {errorMessage ? (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{errorMessage}</Text>
          </Card>
        ) : null}

        <Flex justify="flex-end">
          <Button text="Close" mode="bleed" onClick={onClose} />
        </Flex>
      </Stack>
    </Dialog>
  )
}
