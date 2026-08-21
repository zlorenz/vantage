# Adding a bilingual field (EN / ZH)

This project is bilingual: English + Chinese. Every translatable field exists
as a pair — an English field `X` and a Chinese field `XZh` (e.g. `title` /
`titleZh`, `body` / `bodyZh`). The GROQ and front-end layers read both by name.

**Do not reach for a localization plugin.** We evaluated
`sanity-plugin-internationalized-array` and decided against it: at two
languages the plugin's main benefit (scaling past the Content Lake attribute
ceiling) doesn't apply, and migrating would touch the entire query + front-end
surface for little gain. The `X` / `XZh` pattern below is the standard. Keep
using it.

There are three cases. Pick by field type.

---

## Case 1 — Scalar fields (string, text, url, slug) → use `defineLocalePair`

This is the common case and it is a one-liner per field. The helper generates
**both** the EN and ZH `defineField` objects for you, wires the shared
side-by-side UI onto the EN field, and keeps the ZH sibling invisible but
present in the form (so patches work). You do not hand-write `titleZh`.

Helper: `sanity/lib/define-locale-pair.ts`
Supported types: `'string' | 'text' | 'url' | 'slug'` (nothing else).

Spread the result into your `fields` array with `...`:

```ts
// adjust the relative path to define-locale-pair for your file's location:
//   sanity/schemas/*.ts        -> '../lib/define-locale-pair'
//   sanity/schemas/objects/*.ts -> '../../lib/define-locale-pair'
import { defineType, defineField } from 'sanity'
import { defineLocalePair } from '../lib/define-locale-pair'

export default defineType({
  name: 'industry',
  type: 'document',
  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    ...defineLocalePair({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    // Slugs are locale pairs too. For the exact slug options (source, etc.),
    // copy from an existing taxonomy schema like industry.ts / market.ts.
    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
    }),
  ],
})
```

What you get automatically:
- EN field named `title`, ZH field named `titleZh` (ZH name defaults to
  `${name}Zh` — override with `zhName` if you need a different name, see the
  video-URL example below).
- ZH field title is `"<title> (Chinese)"`.
- The shared `LocalePairField` UI on EN; a `NullField` on ZH that keeps it in
  the form tree.
- Independent validation per language (`validation` for EN, `zhValidation`
  for ZH — usually leave ZH unset).

Common config options (all optional unless noted): `name` (required),
`title` (required), `type` (required), `zhName`, `group`, `fieldset`,
`description` / `zhDescription`, `rows` (text only), `validation` /
`zhValidation`, `options` / `zhOptions`, `initialValue` / `zhInitialValue`,
`hidden` (EN only), `optional`.

### The `zhName` override — a real example worth understanding

The Vimeo / Xinpianchang video URLs are built as a locale pair with a renamed
ZH field:

```ts
...defineLocalePair({
  name: 'vimeoUrl',
  zhName: 'xinpianchangUrl',
  title: 'Video URL',
  type: 'url',
}),
```

Note this pair is **not a translation** — Xinpianchang (新片场) is a separate
Chinese video-hosting platform used because Vimeo is unreliable in mainland
China. It rides the locale mechanism because it maps cleanly to EN-vs-ZH
delivery (locale ≈ region for our audience), but conceptually it's a
hosting choice, not translated text. Don't "clean it up" into a translation
field, and don't rename it.

`LocalePairField` already excludes `type: 'url'` (and slugs) from the shared
phrase book — no lookup, fill/overwrite UI, or blur upsert. Use
`editorCanEditZh: true` so editors can still set the ZH host URL.

---

## Case 2 — Portable Text bodies → build both fields by hand

`defineLocalePair` does **not** support Portable Text. Write the two fields
directly, mirroring an existing body pair. Canonical example to copy:
`blogPost.body` / `blogPost.bodyZh`.

```ts
// Import hideZhPortableText the same way blogPost.ts does.
defineField({
  name: 'body',
  title: 'Body',
  type: 'portableTextBody', // use the same PT type your other bodies use
}),
defineField({
  name: 'bodyZh',
  title: 'Body (Chinese)',
  type: 'portableTextBody',
  hidden: hideZhPortableText('body'), // hides ZH until EN has content
}),
```

Existing PT pairs already in the schema (use any as a reference):
`blogPost.body`, `page.body`, `siteSettings.contactModalContent`.

> If you're adding a new Portable Text bilingual field, consider whether it's
> worth first extending the helper with a `defineLocalePairPortableText`
> sibling so this stops being hand-built. Optional / low-priority — only worth
> it if PT pairs start multiplying.

---

## Case 3 — Arrays (e.g. array of text) → build both fields by hand

Also unsupported by the helper. Two `defineField`s, mirroring
`campaignCta.paragraphs` / `campaignCta.paragraphsZh`.

```ts
defineField({
  name: 'paragraphs',
  title: 'Paragraphs',
  type: 'array',
  of: [{ type: 'text' }],
}),
defineField({
  name: 'paragraphsZh',
  title: 'Paragraphs (Chinese)',
  type: 'array',
  of: [{ type: 'text' }],
}),
```

---

## Leave these alone (special subsystems — not the standard pattern)

- **`portfolioEntry` titles / display-title parts / overrides**
  (`title`, `displayTitleParts.*`, `thumbTitleOverride`, `headerTitleOverride`,
  `longTitleOverride` and their `Zh` siblings). These use
  `LocalePairHeadingField` and `DisplayTitlesInput`, not `defineLocalePair`,
  because they're part of the display-title composition system. Don't convert
  them.

- **`translatedPhrase`** is NOT a per-field content pattern. It's the EN→ZH
  glossary: each document has parallel `en` and `zh` string fields (both
  required). That's a shared string-override product, unrelated to the
  `X` / `XZh` field pairs above. Don't confuse the two conventions.

---

## Quick decision table

| Field type                        | How to add it                                  |
|-----------------------------------|------------------------------------------------|
| string / text / url / slug        | `...defineLocalePair({ ... })`                 |
| Portable Text body                | two `defineField`s + `hideZhPortableText('X')` |
| array (of text, etc.)             | two `defineField`s (`X` and `XZh`)             |
| display-title fields on portfolio | leave alone (DisplayTitlesInput subsystem)     |
| glossary entry                    | `translatedPhrase` (`en` / `zh`), separate     |

After adding fields, the ZH field name is always `${name}Zh` unless you set
`zhName`. The GROQ/query layer reads both by name, so keep the `Zh` suffix
consistent.

ADDITION

When adding a hand-rolled EN/ZH pair (i.e. NOT going through
defineLocalePair — required for Portable Text or anything outside
string/text/url/slug), you must wire THREE things by hand on the EN field,
not just one:
1. readOnly — locks EN for Translator, ZH for Editor
   (({currentUser}) => getStudioRole(currentUser) === 'translator' / 'editor')
2. hidden — hides the field entirely for Translator when EN is empty
   (use hiddenForTranslatorWhenEmpty, exported from define-locale-pair.ts —
   do not re-derive this logic)
3. On the ZH sibling: hideZhPortableText(enFieldName) for progressive
   reveal (only show ZH once EN or ZH has content) — already the existing
   pattern for bodyZh/contactModalContentZh, apply to any new PT pair too

defineLocalePair() fields get all of this automatically. Hand-rolled pairs
do not — each one built outside that helper is a fresh manual checklist.