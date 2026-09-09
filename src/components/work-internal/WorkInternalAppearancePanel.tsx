/**
 * Appearance density popover for the work-internal toolbar.
 */

'use client';

import {useEffect, useId, useRef, useState} from 'react';
import type {CardSize, LibraryAppearance} from './appearance';

interface WorkInternalAppearancePanelProps {
  appearance: LibraryAppearance;
  onChange: (next: LibraryAppearance) => void;
}

export function WorkInternalAppearancePanel({
  appearance,
  onChange,
}: WorkInternalAppearancePanelProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function patch<K extends keyof LibraryAppearance>(
    key: K,
    value: LibraryAppearance[K],
  ) {
    onChange({...appearance, [key]: value});
  }

  return (
    <div className="vp-internal-appearance" ref={rootRef}>
      <button
        type="button"
        className={
          open
            ? 'vp-internal-view-toggle__btn is-active'
            : 'vp-internal-view-toggle__btn'
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
      >
        Appearance
      </button>

      {open ? (
        <div
          id={panelId}
          className="vp-internal-appearance__panel"
          role="dialog"
          aria-label="Appearance"
        >
          <div className="vp-internal-appearance__row">
            <span className="vp-internal-appearance__label">Card Size</span>
            <div
              className="vp-internal-view-toggle"
              role="group"
              aria-label="Card size"
            >
              {(['s', 'm', 'l'] as const).map((size: CardSize) => (
                <button
                  key={size}
                  type="button"
                  className={
                    appearance.cardSize === size
                      ? 'vp-internal-view-toggle__btn is-active'
                      : 'vp-internal-view-toggle__btn'
                  }
                  aria-pressed={appearance.cardSize === size}
                  onClick={() => patch('cardSize', size)}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <p className="vp-internal-appearance__hint">
            Card Size applies to Cards view only.
          </p>
        </div>
      ) : null}
    </div>
  );
}
