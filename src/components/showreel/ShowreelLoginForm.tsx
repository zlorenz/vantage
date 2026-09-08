'use client'

/**
 * Showreel editor shared-password login form.
 */

import {useMemo, useState, type FormEvent} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {safeShowreelNextPath} from '@/lib/showreel-auth-paths'

export function ShowreelLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(
    () => safeShowreelNextPath(searchParams.get('next'), '/showreel/login'),
    [searchParams],
  )

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/showreel/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password}),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        setError(data?.error || 'Login failed')
        return
      }
      router.replace(nextPath)
      router.refresh()
    } catch {
      setError('Login failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-3"
      onSubmit={onSubmit}
    >
      <label className="block">
        <span className="sr-only">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="w-full rounded border border-[var(--color-vp-input-border)] bg-[var(--color-vp-input-bg)] px-3 py-2 text-vp-text outline-none focus:border-[var(--color-vp-input-border-focus)] focus:bg-[var(--color-vp-input-bg-focus)]"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
        />
      </label>
      {error ? (
        <p className="text-sm text-[var(--vp-form-error)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="rounded bg-white px-4 py-2 font-medium text-[var(--vp-black)] disabled:opacity-50"
        disabled={pending || !password}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
