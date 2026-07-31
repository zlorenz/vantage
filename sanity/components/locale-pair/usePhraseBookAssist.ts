/**
 * Debounced phrase-book autofill for LocalePair EN/ZH stacks.
 */

import {useCallback, useEffect, useRef, useState} from 'react'
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
  /** Normalized phrase-book ZH for the current EN (null when no hit / assist off). */
  phraseBookZh: string | null
  /** Phrase hit exists for current EN and ZH is empty (and assist is writable). */
  canFillFromPhraseBook: boolean
  /**
   * Phrase hit exists, ZH is non-empty, and ZH differs from the book
   * (and assist is writable). Mutually exclusive with canFillFromPhraseBook.
   */
  canOverwriteFromPhraseBook: boolean
  fillFromPhraseBook: () => void
  overwriteFromPhraseBook: () => void
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
  const onZhChangeRef = useRef(options.onZhChange)

  enRef.current = options.enValue
  zhRef.current = options.zhValue
  onZhChangeRef.current = options.onZhChange

  const writeZhFromBook = useCallback((zh: string) => {
    lastAutoFilled.current = zh
    onZhChangeRef.current(zh)
  }, [])

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
          writeZhFromBook(hit.zh)
        }
      })
    }, LOOKUP_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [client, enabled, options.enValue, writeZhFromBook])

  const currentZh = normalizePhraseKey(options.zhValue)
  const fromPhraseBook = Boolean(bookZh && currentZh === bookZh)

  const canFillFromPhraseBook = Boolean(enabled && bookZh && !currentZh)

  const canOverwriteFromPhraseBook = Boolean(
    enabled && bookZh && currentZh && currentZh !== bookZh,
  )

  const fillFromPhraseBook = useCallback(() => {
    if (!enabled || !bookZh) return
    if (normalizePhraseKey(zhRef.current)) return
    writeZhFromBook(bookZh)
  }, [bookZh, enabled, writeZhFromBook])

  const overwriteFromPhraseBook = useCallback(() => {
    if (!enabled || !bookZh) return
    const zh = normalizePhraseKey(zhRef.current)
    if (!zh || zh === bookZh) return
    writeZhFromBook(bookZh)
  }, [bookZh, enabled, writeZhFromBook])

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

  return {
    fromPhraseBook,
    phraseBookZh: bookZh,
    canFillFromPhraseBook,
    canOverwriteFromPhraseBook,
    fillFromPhraseBook,
    overwriteFromPhraseBook,
    onZhBlur,
  }
}
