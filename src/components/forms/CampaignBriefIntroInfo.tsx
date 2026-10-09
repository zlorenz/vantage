/**
 * CampaignBriefIntroInfo — buries the form intro behind a chrome-chip info
 * control. Mobile (<576): BottomSheet. Desktop: anchored popout (same motion
 * language as /work filter).
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';

const DESKTOP_MQ = '(min-width: 576px)';
const DESKTOP_CLOSE_MS = 180;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function InfoIcon() {
  return (
    <svg
      className="vp-brief-intro-chip__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 10.75v5.5M12 7.75h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.4 6.4a.75.75 0 0 1 1.06 0L12 10.94l4.54-4.54a.75.75 0 1 1 1.06 1.06L13.06 12l4.54 4.54a.75.75 0 1 1-1.06 1.06L12 13.06l-4.54 4.54a.75.75 0 0 1-1.06-1.06L10.94 12 6.4 7.46a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

export type CampaignBriefIntroInfoProps = {
  description: string;
  openAriaLabel: string;
  closeAriaLabel: string;
};

export function CampaignBriefIntroInfo({
  description,
  openAriaLabel,
  closeAriaLabel,
}: CampaignBriefIntroInfoProps) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Desktop popout: mount / reveal / delayed unmount (exit animation).
  useEffect(() => {
    if (!isDesktop) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(false);
      setVisible(false);
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setMounted(true);
      return;
    }

    if (!mounted) return;

    setVisible(false);

    const finishClose = () => {
      setMounted(false);
      closeTimerRef.current = null;
    };

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    closeTimerRef.current = setTimeout(finishClose, DESKTOP_CLOSE_MS);
  }, [open, mounted, isDesktop]);

  useEffect(() => {
    if (!isDesktop || !open || !mounted) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, [open, mounted, isDesktop]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !isDesktop) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isDesktop, onClose]);

  useEffect(() => {
    if (!open || !isDesktop) return;

    function onPointerDown(e: Event) {
      const target = e.target as Node | null;
      if (!target) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, isDesktop, onClose]);

  const onToggle = () => setOpen((v) => !v);

  return (
    <div ref={anchorRef} className="vp-brief-intro-anchor">
      <button
        type="button"
        className={`vp-brief-intro-chip${open ? ' is-open' : ''}`}
        aria-label={open ? closeAriaLabel : openAriaLabel}
        aria-expanded={open}
        onClick={onToggle}
      >
        <InfoIcon />
      </button>

      {!isDesktop ? (
        <BottomSheet
          open={open}
          onClose={onClose}
          ariaLabel={openAriaLabel}
          closeAriaLabel={closeAriaLabel}
        >
          <p className="vp-brief-intro-panel__text">{description}</p>
        </BottomSheet>
      ) : null}

      {isDesktop && mounted ? (
        <div
          className={`vp-brief-intro-popout${visible ? ' is-open' : ''}`}
          role="presentation"
        >
          <div
            className="vp-brief-intro-popout__panel"
            role="dialog"
            aria-modal={false}
            aria-label={openAriaLabel}
            aria-hidden={!visible}
          >
            <div className="vp-brief-intro-popout__header">
              <button
                type="button"
                className="vp-brief-intro-popout__icon-btn"
                aria-label={closeAriaLabel}
                onClick={onClose}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="vp-brief-intro-popout__body">
              <p className="vp-brief-intro-panel__text">{description}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
