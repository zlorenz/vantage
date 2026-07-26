/**
 * Debounced phrase-book autofill for LocalePair EN/ZH stacks.
 */

import {useEffect, useRef, useState} from 'react'
import {useToast} from '@sanity/ui'
import {useClient} from 'sanity'

import {normalizePhraseKey} from '@phrase-book'

import {lookupPhraseZh, upsertPhraseFromPair} from './phrase-book-studio'

const LOOKUP_DEBOUNCE_MS = 300

type Options = {
  enValue: string
  zhValue: string
  onZhChange: (value: string) => void
  readOnly?: boolean
  /** Set false to disable (e.g. slug pairs). Default true. */
  enabled?: boolean
}

export function usePhraseBookAssist(options: Options): {
  fromPhraseBook: boolean
  onZhBlur: () => void
} {
  const enabled = options.enabled !== false && !options.readOnly
  const client = useClient({apiVersion: '2025-02-19'})
  const toast = useToast()
  const [bookZh, setBookZh] = useState<string | null>(null)
  const lastAutoFilled = useRef<string>('')
  /** null = not yet seen mount EN; skip writes on first lookup so opening a doc cannot create drafts. */
  const prevEnKey = useRef<string | null>(null)
  const enRef = useRef(options.enValue)
  const zhRef = useRef(options.zhValue)

  enRef.current = options.enValue
  zhRef.current = options.zhValue

  useEffect(() => {
    if (!enabled) {
      setBookZh(null)
      prevEnKey.current = null
      return
    }

    const en = normalizePhraseKey(options.enValue)
    if (!en) {
      setBookZh(null)
      prevEnKey.current = ''
      return
    }

    const isMountLookup = prevEnKey.current === null
    const enChanged = !isMountLookup && prevEnKey.current !== en
    prevEnKey.current = en

    let cancelled = false
    const timer = window.setTimeout(() => {
      void lookupPhraseZh(client, en).then((hit) => {
        if (cancelled) return
        if (!hit) {
          setBookZh(null)
          return
        }
        setBookZh(hit.zh)

        // Lookup on open is fine for the "From phrase book" badge; only write when EN changes.
        if (!enChanged) return

        const currentZh = normalizePhraseKey(zhRef.current)
        const canAutofill =
          !currentZh || currentZh === lastAutoFilled.current || currentZh === hit.zh
        if (canAutofill && currentZh !== hit.zh) {
          lastAutoFilled.current = hit.zh
          options.onZhChange(hit.zh)
        }
      })
    }, LOOKUP_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // Only re-run when EN changes (or enablement); onZhChange identity ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, enabled, options.enValue])

  const fromPhraseBook = Boolean(
    bookZh && normalizePhraseKey(options.zhValue) === bookZh,
  )

  const onZhBlur = () => {
    if (!enabled) return
    const en = normalizePhraseKey(enRef.current)
    const zh = normalizePhraseKey(zhRef.current)
    if (!en || !zh) return
    if (bookZh && zh === bookZh) return

    void upsertPhraseFromPair(client, en, zh).then((result) => {
      if (result.status === 'created') {
        lastAutoFilled.current = zh
        setBookZh(zh)
        toast.push({
          status: 'success',
          title: 'Saved to Translations',
          description: `“${en}” → “${zh}”`,
        })
      } else if (result.status === 'conflict') {
        toast.push({
          status: 'warning',
          title: 'Phrase book conflict',
          description: `“${en}” is already “${result.existingZh}”. Edit it in Translations to change site-wide.`,
        })
      }
    })
  }

  return {fromPhraseBook, onZhBlur}
}
