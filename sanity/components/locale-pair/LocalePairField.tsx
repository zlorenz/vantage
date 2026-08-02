import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, type ReactNode} from 'react'
import {
  getPublishedId,
  set,
  unset,
  useCurrentUser,
  useDocumentOperation,
  useFormValue,
  type FieldProps,
  type Path,
} from 'sanity'

import {getStudioRole} from '../../lib/studio-roles'
import {LocalePairStack} from './LocalePairStack'
import {slugifyEn, slugifyZh} from './slugify'
import {getLocalePairOptions} from './types'
import {shouldShowZh} from './shouldShowZh'

type SlugValue = {_type?: 'slug'; current?: string}

function isSlugType(typeName: string): boolean {
  return typeName === 'slug'
}

function slugCurrent(value: unknown): string {
  if (value && typeof value === 'object' && 'current' in value) {
    const current = (value as SlugValue).current
    return typeof current === 'string' ? current : ''
  }
  return ''
}

function toSlugValue(current: string): SlugValue | undefined {
  const trimmed = current.trim()
  if (!trimmed) return undefined
  return {_type: 'slug', current: trimmed}
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function pathToSetKey(path: Path): string {
  let key = ''
  for (const segment of path) {
    if (typeof segment === 'string') {
      key = key ? `${key}.${segment}` : segment
    } else if (typeof segment === 'number') {
      key = `${key}[${segment}]`
    } else if (segment && typeof segment === 'object' && '_key' in segment) {
      key = `${key}[_key=="${(segment as {_key: string})._key}"]`
    }
  }
  return key
}

function sourceToPath(source: string): Path {
  return source.split('.').filter(Boolean)
}

/**
 * Custom field that renders one label + stacked EN/ZH controls with flag chips.
 * EN patches via form onChange; ZH via document operations (sibling / NullField).
 */
export function LocalePairField(props: FieldProps) {
  const pair = getLocalePairOptions(props.schemaType)
  const zhName = pair?.zhName

  const documentId = useFormValue(['_id']) as string | undefined
  const documentType = useFormValue(['_type']) as string | undefined
  const publishedId = documentId ? getPublishedId(documentId) : ''
  const {patch} = useDocumentOperation(publishedId, documentType || 'document')

  const zhPath = useMemo<Path>(() => {
    if (!zhName) return props.path
    return [...props.path.slice(0, -1), zhName]
  }, [props.path, zhName])

  const zhRaw = useFormValue(zhPath)
  const typeName = props.schemaType.name
  const schemaRows = (props.schemaType as {rows?: number}).rows
  const rows = pair?.rows ?? schemaRows
  const useTextarea = typeName === 'text' || (typeof rows === 'number' && rows > 0)

  const enValue = isSlugType(typeName) ? slugCurrent(props.value) : stringValue(props.value)
  const zhValue = isSlugType(typeName) ? slugCurrent(zhRaw) : stringValue(zhRaw)

  const formReadOnly = Boolean(props.inputProps?.readOnly)
  const role = getStudioRole(useCurrentUser())
  const enReadOnly = formReadOnly || role === 'translator'
  // Editors normally lock ZH translation fields; opt out via editorCanEditZh
  // for non-copy pairs (e.g. Xinpianchang embed URLs).
  const zhReadOnly =
    formReadOnly || (role === 'editor' && !pair?.editorCanEditZh)

  const slugSourcePath = useMemo(
    () => (pair?.slugSource ? sourceToPath(pair.slugSource) : null),
    [pair?.slugSource],
  )
  const slugZhSourcePath = useMemo(
    () => (pair?.slugZhSource ? sourceToPath(pair.slugZhSource) : null),
    [pair?.slugZhSource],
  )
  // Hooks must run unconditionally; empty path is ignored when source is unset.
  const enSourceRaw = useFormValue(slugSourcePath ?? [])
  const zhSourceRaw = useFormValue(slugZhSourcePath ?? [])
  const enSourceText = slugSourcePath ? stringValue(enSourceRaw) : ''
  const zhSourceText = slugZhSourcePath ? stringValue(zhSourceRaw) : ''
  const slugMaxLength = pair?.slugMaxLength ?? 96

  const patchZh = useCallback(
    (nextRaw: string) => {
      if (!zhName || !publishedId || !documentType) return
      const key = pathToSetKey(zhPath)

      if (isSlugType(typeName)) {
        const slug = toSlugValue(nextRaw)
        patch.execute([slug ? {set: {[key]: slug}} : {unset: [key]}])
        return
      }

      if (nextRaw.trim()) {
        patch.execute([{set: {[key]: nextRaw}}])
      } else {
        patch.execute([{unset: [key]}])
      }
    },
    [documentType, patch, publishedId, typeName, zhName, zhPath],
  )

  const patchEn = useCallback(
    (nextRaw: string) => {
      const onChange = props.inputProps?.onChange
      if (!onChange) return

      if (isSlugType(typeName)) {
        const slug = toSlugValue(nextRaw)
        onChange(slug ? set(slug) : unset())
        return
      }

      onChange(nextRaw.trim() ? set(nextRaw) : unset())
    },
    [props.inputProps, typeName],
  )

  const generateEn = useCallback(() => {
    if (!enSourceText.trim()) return
    patchEn(slugifyEn(enSourceText, slugMaxLength))
  }, [enSourceText, patchEn, slugMaxLength])

  const generateZh = useCallback(() => {
    if (!zhSourceText.trim()) return
    patchZh(slugifyZh(zhSourceText, slugMaxLength))
  }, [patchZh, slugMaxLength, zhSourceText])

  const errors = (props.validation ?? [])
    .filter((marker) => marker.level === 'error')
    .map((marker) => marker.message)
    .filter(Boolean)

  if (!zhName) {
    return props.renderDefault(props)
  }

  return (
    <Box paddingY={1}>
      <Stack space={2}>
        <LocalePairStack
          label={props.title || props.schemaType.title || props.name}
          optional={pair?.optional === true}
          labelSize={1}
          description={props.description as ReactNode}
          enValue={enValue}
          zhValue={zhValue}
          onEnChange={patchEn}
          onZhChange={patchZh}
          enReadOnly={enReadOnly}
          zhReadOnly={zhReadOnly}
          rows={useTextarea ? (typeof rows === 'number' ? rows : 3) : undefined}
          showZh={shouldShowZh(enValue, zhValue)}
          phraseBook={!isSlugType(typeName)}
          onGenerateEn={pair?.slugSource ? generateEn : undefined}
          onGenerateZh={pair?.slugZhSource ? generateZh : undefined}
          generateEnDisabled={!enSourceText.trim()}
          generateZhDisabled={!zhSourceText.trim()}
        />
        {errors.length > 0 ? (
          <Text size={0} style={{color: 'var(--card-badge-critical-fg-color)'}}>
            {errors.join(' · ')}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
