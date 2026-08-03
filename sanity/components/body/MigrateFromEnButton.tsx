/**
 * Translator-only "Migrate from EN" control for bilingual Portable Text ZH fields.
 * Copies EN → ZH via migrateBodyFromEn (fresh _keys). Empty ZH applies immediately;
 * non-empty ZH requires confirm before overwrite.
 */

import {Button} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {
  set,
  useCurrentUser,
  useFormValue,
  type Path,
  type PortableTextInputProps,
} from 'sanity'

import {getStudioRole} from '../../lib/studio-roles'
import {isPortableTextEmpty, migrateBodyFromEn} from '../../lib/migrate-body-from-en'

const CONFIRM_OVERWRITE =
  'Replace the Chinese content with a copy of the English body? Existing Chinese content will be overwritten.'

function pathLeaf(path: Path): string | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const segment = path[i]
    if (typeof segment === 'string') return segment
  }
  return null
}

/** `bodyZh` → `body`, `contactModalContentZh` → `contactModalContent`. */
export function enSiblingFieldName(zhFieldName: string): string | null {
  if (!zhFieldName.endsWith('Zh') || zhFieldName.length <= 2) return null
  return zhFieldName.slice(0, -2)
}

type MigrateFromEnButtonProps = {
  path: Path
  value: PortableTextInputProps['value']
  onChange: PortableTextInputProps['onChange']
  readOnly?: boolean
}

export function MigrateFromEnButton(props: MigrateFromEnButtonProps) {
  const {path, value, onChange, readOnly} = props
  const role = getStudioRole(useCurrentUser())
  const leaf = pathLeaf(path)
  const enName = leaf ? enSiblingFieldName(leaf) : null

  const enRaw = useFormValue(enName ? [enName] : [])
  const enValue = enName ? enRaw : undefined

  const show = role === 'translator' && Boolean(enName) && !readOnly
  const enEmpty = isPortableTextEmpty(enValue)
  const zhEmpty = isPortableTextEmpty(value)

  const handleClick = useCallback(() => {
    if (!enName || enEmpty) return
    if (!zhEmpty && !window.confirm(CONFIRM_OVERWRITE)) return
    onChange(set(migrateBodyFromEn(enValue)))
  }, [enEmpty, enName, enValue, onChange, zhEmpty])

  const title = useMemo(() => {
    if (enEmpty) return 'English body is empty — nothing to migrate'
    if (zhEmpty) return 'Copy English body structure into Chinese'
    return 'Replace Chinese body with a copy of English'
  }, [enEmpty, zhEmpty])

  if (!show) return null

  return (
    <Button
      mode="ghost"
      text="Migrate from EN"
      fontSize={1}
      padding={2}
      disabled={enEmpty}
      title={title}
      onClick={handleClick}
    />
  )
}
