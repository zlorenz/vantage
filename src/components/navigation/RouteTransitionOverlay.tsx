'use client';

/**
 * Global route-change feedback — dims the current view and shows a top progress
 * bar after ~150ms so slow RSC navigations feel responsive on first click.
 */

import {usePathname} from '@/i18n/navigation';
import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import './route-transition.css';

const SHOW_DELAY_MS = 150;
const FAILURE_TIMEOUT_MS = 20000;

function isModifiedEvent(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isInternalNavigationAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  if (anchor.getAttribute('rel')?.includes('external')) return false;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const current = new URL(window.location.href);
    if (url.pathname === current.pathname && url.search === current.search) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function RouteTransitionOverlay() {
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const previousPath = useRef(pathname);
  const failureTimer = useRef<number | null>(null);

  const clearFailureTimer = () => {
    if (failureTimer.current != null) {
      window.clearTimeout(failureTimer.current);
      failureTimer.current = null;
    }
  };

  const stopPending = () => {
    clearFailureTimer();
    setPending(false);
    setVisible(false);
  };

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      setFailed(false);
      stopPending();
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedEvent(event)) return;
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigationAnchor(anchor)) return;

      setFailed(false);
      setPending(true);
      clearFailureTimer();
      failureTimer.current = window.setTimeout(() => {
        setFailed(true);
        setPending(false);
        setVisible(false);
      }, FAILURE_TIMEOUT_MS);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => () => clearFailureTimer(), []);

  return (
    <>
      <div
        className={`vp-route-transition__bar${visible ? ' is-active' : ''}`}
        aria-hidden={!visible}
      />
      <div
        className={`vp-route-transition__veil${visible ? ' is-active' : ''}`}
        aria-hidden={!visible}
      />
      {failed ? (
        <div className="vp-route-transition__toast" role="alert">
          <p className="vp-route-transition__toast-text">
            {t('navigationFailed')}
          </p>
          <button
            type="button"
            className="vp-route-transition__toast-dismiss"
            onClick={() => setFailed(false)}
          >
            {t('dismiss')}
          </button>
        </div>
      ) : null}
    </>
  );
}
