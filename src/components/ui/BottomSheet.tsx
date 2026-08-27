/**
 * BottomSheet — shared mobile slide-up sheet shell.
 *
 * Visual/motion language matches the /work filter sheet (scrim, handle,
 * drag-to-dismiss, cubic-bezier enter). Filter-specific content and the
 * ≥576px desktop popout stay in PortfolioIndexFilterSheet.
 */

'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import './bottom-sheet.css';

/** Mobile sheet slide-down exit (enter is ~380ms — see CSS). */
export const BOTTOM_SHEET_CLOSE_MS = 280;

const DISMISS_DRAG_PX = 96;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Optional centered header title. Omit for close-only chrome (e.g. description sheet). */
  title?: string;
  /** Dialog accessible name — defaults to `title`, then `closeAriaLabel`. */
  ariaLabel?: string;
  children: ReactNode;
  /** Left header slot (e.g. Clear All / Back). */
  headerStart?: ReactNode;
  closeAriaLabel: string;
  bodyClassName?: string;
  /** Fires after exit animation finishes and the sheet unmounts. */
  onClosed?: () => void;
};

export function BottomSheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  headerStart,
  closeAriaLabel,
  bodyClassName,
  onClosed,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  useEffect(() => {
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
      onClosedRef.current?.();
    };

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    closeTimerRef.current = setTimeout(finishClose, BOTTOM_SHEET_CLOSE_MS);
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !mounted) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    dragDeltaRef.current = 0;
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, event.clientY - dragStartYRef.current);
    dragDeltaRef.current = delta;
    if (panelRef.current) {
      panelRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const onHandlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current == null) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const shouldClose = dragDeltaRef.current > DISMISS_DRAG_PX;
    dragStartYRef.current = null;
    dragDeltaRef.current = 0;
    if (panelRef.current) {
      panelRef.current.style.transition = '';
      panelRef.current.style.transform = '';
    }
    if (shouldClose) onClose();
  };

  if (!mounted) return null;

  const bodyClass = ['vp-bottom-sheet__body', bodyClassName]
    .filter(Boolean)
    .join(' ');
  const dialogLabel = ariaLabel ?? title ?? closeAriaLabel;

  return (
    <div
      className={`vp-bottom-sheet${visible ? ' is-open' : ''}`}
      role="presentation"
    >
      <button
        type="button"
        className="vp-bottom-sheet__scrim"
        aria-label={closeAriaLabel}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="vp-bottom-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        aria-hidden={!visible}
      >
        <div
          className="vp-bottom-sheet__handle-hit"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="vp-bottom-sheet__handle" aria-hidden />
        </div>

        <div
          className={`vp-bottom-sheet__header${
            title ? '' : ' vp-bottom-sheet__header--no-title'
          }`}
        >
          <div className="vp-bottom-sheet__header-start">
            {headerStart ?? (
              <span className="vp-bottom-sheet__header-spacer" aria-hidden />
            )}
          </div>
          {title ? (
            <h2 className="vp-bottom-sheet__title">{title}</h2>
          ) : (
            <span className="vp-bottom-sheet__title-spacer" aria-hidden />
          )}
          <div className="vp-bottom-sheet__header-end">
            <button
              type="button"
              className="vp-bottom-sheet__icon-btn"
              aria-label={closeAriaLabel}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={bodyClass}>{children}</div>
      </div>
    </div>
  );
}
