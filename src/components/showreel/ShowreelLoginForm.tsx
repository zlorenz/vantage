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
    <form className="vp-showreel-login__form" onSubmit={onSubmit}>
      <label className="vp-showreel-editor__field">
        <span className="vp-internal-filter__label">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="vp-internal-search__input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
        />
      </label>
      {error ? (
        <p className="vp-showreel-editor__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="vp-showreel-editor__field-actions">
        <button
          type="submit"
          className="vp-internal-showreel-bar__create"
          disabled={pending || !password}
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </form>
  )
}
