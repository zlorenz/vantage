import {defineField, type FieldDefinition} from 'sanity'

import {LocalePairField} from '../components/locale-pair/LocalePairField'
import {NullField} from '../components/locale-pair/NullField'
import {hasLocaleText} from '../components/locale-pair/shouldShowZh'
import type {LocalePairOptions} from '../components/locale-pair/types'
import {getStudioRole} from './studio-roles'

type LocalePairType = 'string' | 'text' | 'url' | 'slug'

type DefineLocalePairConfig = {
  name: string
  /** Defaults to `${name}Zh`. */
  zhName?: string
  title: string
  type: LocalePairType
  group?: string
  fieldset?: string
  description?: string
  zhDescription?: string
  rows?: number
  validation?: FieldDefinition['validation']
  zhValidation?: FieldDefinition['validation']
  options?: Record<string, unknown>
  zhOptions?: Record<string, unknown>
  initialValue?: unknown
  zhInitialValue?: unknown
  /** Applied to the EN field only (ZH stays in the form via NullField). */
  hidden?: FieldDefinition['hidden']
  /** When true, FieldLabel is muted (optional). Defaults to true when no EN validation. */
  optional?: boolean
  /**
   * When true, editors may edit ZH (normally editor-locked). For pairs that are
   * not translation copy — e.g. Vimeo / Xinpianchang embed URLs.
   */
  editorCanEditZh?: boolean
  /** When true, both EN and ZH fields are read-only in Studio. Opt-in per call site. */
  readOnly?: FieldDefinition['readOnly']
}

type HiddenContext = {
  document?: unknown
  parent?: unknown
  value?: unknown
  currentUser?: {email?: string} | null
  path?: unknown
}

/**
 * Hide EN (or EN-side of a pair) for Translators when the field value is empty.
 * Reuses hasLocaleText for strings / slugs / Portable Text arrays.
 */
export function hiddenForTranslatorWhenEmpty({
  currentUser,
  value,
}: HiddenContext): boolean {
  return getStudioRole(currentUser) === 'translator' && !hasLocaleText(value)
}

/**
 * OR-compose ConditionalProperty values (boolean | callback | undefined).
 * - `true` short-circuits to always hidden
 * - `false` / `undefined` contribute nothing (still evaluate `extra`)
 * - callbacks are evaluated with the same Sanity hidden context
 */
function composeHidden(
  existing: FieldDefinition['hidden'],
  extra: (ctx: HiddenContext) => boolean,
): FieldDefinition['hidden'] {
  if (existing === true) return true

  return (ctx) => {
    const fromConfig =
      typeof existing === 'function' ? Boolean(existing(ctx as never)) : Boolean(existing)
    return fromConfig || extra(ctx)
  }
}

/**
 * Returns [enField, zhField] with shared LocalePairField UI on EN and an invisible ZH sibling
 * (NullField keeps the member in the form tree so sibling patches work).
 */
export function defineLocalePair(config: DefineLocalePairConfig): [FieldDefinition, FieldDefinition] {
  const zhName = config.zhName ?? `${config.name}Zh`
  const optional = config.optional ?? config.validation == null

  const slugSource =
    config.type === 'slug' && typeof config.options?.source === 'string'
      ? config.options.source
      : undefined
  const slugZhSource =
    config.type === 'slug' && typeof config.zhOptions?.source === 'string'
      ? config.zhOptions.source
      : undefined
  const slugMaxLength =
    config.type === 'slug' && typeof config.options?.maxLength === 'number'
      ? config.options.maxLength
      : undefined

  const localePair: LocalePairOptions = {
    zhName,
    rows: config.rows,
    optional,
    ...(config.editorCanEditZh ? {editorCanEditZh: true} : {}),
    ...(slugSource ? {slugSource} : {}),
    ...(slugZhSource ? {slugZhSource} : {}),
    ...(slugMaxLength != null ? {slugMaxLength} : {}),
  }

  const en = defineField({
    name: config.name,
    title: config.title,
    type: config.type,
    group: config.group,
    fieldset: config.fieldset,
    description: config.description,
    hidden: composeHidden(config.hidden, hiddenForTranslatorWhenEmpty),
    ...(config.readOnly != null ? {readOnly: config.readOnly} : {}),
    ...(config.type === 'text' && config.rows != null ? {rows: config.rows} : {}),
    validation: config.validation,
    initialValue: config.initialValue as never,
    options: {
      ...config.options,
      localePair,
    } as never,
    components: {field: LocalePairField},
  } as Parameters<typeof defineField>[0])

  const zh = defineField({
    name: zhName,
    title: `${config.title} (Chinese)`,
    type: config.type,
    group: config.group,
    // Omit fieldset so NullField does not consume a column in columnar fieldsets.
    description: config.zhDescription,
    ...(config.readOnly != null ? {readOnly: config.readOnly} : {}),
    ...(config.type === 'text' && config.rows != null ? {rows: config.rows} : {}),
    validation: config.zhValidation,
    initialValue: config.zhInitialValue as never,
    options: config.zhOptions as never,
    // Keep in form members (do not use hidden:true) so LocalePairField can patch siblings.
    components: {field: NullField},
  } as Parameters<typeof defineField>[0])

  return [en, zh]
}

/** Sanity `hidden` callback: show ZH portable text only when EN or ZH has blocks. */
export function hideZhPortableText(enFieldName: string) {
  return ({
    document,
    parent,
    value,
  }: {
    document?: Record<string, unknown> | undefined
    parent?: Record<string, unknown> | undefined
    value?: unknown
  }) => {
    const source = (parent ?? document ?? {}) as Record<string, unknown>
    const en = source[enFieldName]
    const enEmpty = !Array.isArray(en) || en.length === 0
    const zhEmpty = !Array.isArray(value) || value.length === 0
    return enEmpty && zhEmpty
  }
}
