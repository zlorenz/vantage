/**
 * Selection action bar + minimal create-showreel dialog for /work-internal.
 *
 * Auth approach: GET /api/showreel/session before opening the form. If unauthenticated,
 * stash selected ids in sessionStorage and redirect to /showreel/login?next=… so login
 * returns here and reopens the form with selection restored. POST 401 mid-submit uses
 * the same path.
 */

'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {useRouter} from '@/i18n/navigation';
import {showreelLoginPathFor} from '@/lib/showreel-auth-paths';
import {stashShowreelCreatePending} from './showreel-create-pending';

interface WorkInternalShowreelBarProps {
  selectedIds: string[];
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onClearSelection: () => void;
}

function redirectToShowreelLogin(ids: string[]): void {
  stashShowreelCreatePending(ids);
  const {pathname, search} = window.location;
  const next = `${pathname}${search}`;
  const login = showreelLoginPathFor(pathname);
  window.location.assign(
    `${login}?next=${encodeURIComponent(next)}`,
  );
}

export function WorkInternalShowreelBar({
  selectedIds,
  createOpen,
  onCreateOpenChange,
  onClearSelection,
}: WorkInternalShowreelBarProps) {
  const router = useRouter();
  const titleId = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);

  const count = selectedIds.length;

  useEffect(() => {
    if (!createOpen) return;
    setError(null);
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [createOpen]);

  useEffect(() => {
    if (!createOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) {
        onCreateOpenChange(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createOpen, onCreateOpenChange, pending]);

  async function ensureAuthenticated(): Promise<boolean> {
    setAuthChecking(true);
    try {
      const res = await fetch('/api/showreel/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        redirectToShowreelLogin(selectedIds);
        return false;
      }
      const data = (await res.json()) as {authenticated?: boolean};
      if (!data.authenticated) {
        redirectToShowreelLogin(selectedIds);
        return false;
      }
      return true;
    } catch {
      setError('Could not verify showreel session. Try again.');
      return false;
    } finally {
      setAuthChecking(false);
    }
  }

  async function onCreateClick() {
    setError(null);
    const ok = await ensureAuthenticated();
    if (!ok) return;
    onCreateOpenChange(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Select at least one project');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/showreel', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || undefined,
          portfolioItemIds: selectedIds,
        }),
      });

      if (res.status === 401) {
        redirectToShowreelLogin(selectedIds);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        id?: string;
        error?: string;
        missing?: string[];
      } | null;

      if (!res.ok) {
        if (data?.missing?.length) {
          setError(
            `Some selected projects are no longer available (${data.missing.length}). Clear selection and try again.`,
          );
        } else {
          setError(data?.error || 'Failed to create showreel');
        }
        return;
      }

      if (!data?.id) {
        setError('Showreel created but no id was returned');
        return;
      }

      onClearSelection();
      onCreateOpenChange(false);
      router.push({
        pathname: '/showreel/[id]/edit',
        params: {id: data.id},
      });
    } catch {
      setError('Failed to create showreel');
    } finally {
      setPending(false);
    }
  }

  if (count === 0 && !createOpen) return null;

  return (
    <>
      {count > 0 ? (
        <div className="vp-internal-showreel-bar" role="region" aria-label="Selection">
          <p className="vp-internal-showreel-bar__count">
            {count === 1 ? '1 selected' : `${count} selected`}
          </p>
          <div className="vp-internal-showreel-bar__actions">
            <button
              type="button"
              className="vp-internal-clear"
              onClick={onClearSelection}
              disabled={pending || authChecking}
            >
              Clear
            </button>
            <button
              type="button"
              className="vp-internal-showreel-bar__create"
              onClick={onCreateClick}
              disabled={pending || authChecking}
            >
              {authChecking ? 'Checking…' : 'Create Showreel'}
            </button>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div
          className="vp-internal-showreel-dialog"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !pending) {
              onCreateOpenChange(false);
            }
          }}
        >
          <form
            className="vp-internal-showreel-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onSubmit={onSubmit}
          >
            <h2 id={titleId} className="vp-internal-showreel-dialog__title">
              Create Showreel
            </h2>
            <p className="vp-internal-showreel-dialog__meta">
              {count === 1
                ? '1 project selected'
                : `${count} projects selected`}
            </p>

            <label className="vp-internal-showreel-dialog__field">
              <span className="vp-internal-filter__label">Title</span>
              <input
                ref={titleRef}
                type="text"
                className="vp-internal-search__input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={pending}
                autoComplete="off"
              />
            </label>

            <label className="vp-internal-showreel-dialog__field">
              <span className="vp-internal-filter__label">
                Description (optional)
              </span>
              <textarea
                className="vp-internal-showreel-dialog__textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={pending}
              />
            </label>

            {error ? (
              <p className="vp-internal-showreel-dialog__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="vp-internal-showreel-dialog__actions">
              <button
                type="button"
                className="vp-internal-clear"
                onClick={() => onCreateOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="vp-internal-showreel-bar__create"
                disabled={pending || !title.trim() || count === 0}
              >
                {pending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
