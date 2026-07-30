/**
 * TranslatorLockedArrayInput / Item — for Translators, disable
 * add/remove/duplicate/copy and reordering on object arrays while leaving
 * nested field editability alone. Editors/admins get defaults unchanged.
 *
 * Sanity reads disableActions/sortable from:
 * - the array input’s schemaType (Add button + list sortable) → wire
 *   TranslatorLockedArrayInput on the array field
 * - each item’s parentSchemaType (item menu + drag handle) → wire
 *   TranslatorLockedArrayItem on the object type in `of` (not the array)
 */

import {useMemo} from 'react'
import {
  useCurrentUser,
  type ArrayOfObjectsInputProps,
  type ArraySchemaType,
  type ObjectItem,
  type ObjectItemProps,
} from 'sanity'

import {getStudioRole} from '../lib/studio-roles'

const TRANSLATOR_DISABLE_ACTIONS = ['add', 'remove', 'duplicate', 'copy'] as const

function withTranslatorArrayLocks(schemaType: ArraySchemaType): ArraySchemaType {
  return {
    ...schemaType,
    options: {
      ...schemaType.options,
      disableActions: [...TRANSLATOR_DISABLE_ACTIONS],
      sortable: false,
    },
  } as ArraySchemaType
}

export function TranslatorLockedArrayInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault, schemaType} = props
  const role = getStudioRole(useCurrentUser())

  const lockedSchemaType = useMemo(() => {
    if (role !== 'translator') return schemaType
    return withTranslatorArrayLocks(schemaType)
  }, [role, schemaType])

  if (role !== 'translator') {
    return renderDefault(props)
  }

  return renderDefault({...props, schemaType: lockedSchemaType})
}

export function TranslatorLockedArrayItem(props: ObjectItemProps<ObjectItem>) {
  const {renderDefault, parentSchemaType} = props
  const role = getStudioRole(useCurrentUser())

  const lockedParent = useMemo(() => {
    if (role !== 'translator') return parentSchemaType
    return withTranslatorArrayLocks(parentSchemaType as ArraySchemaType)
  }, [role, parentSchemaType])

  if (role !== 'translator') {
    return renderDefault(props)
  }

  return renderDefault({...props, parentSchemaType: lockedParent})
}
