'use client';

/**
 * Height-reveal wrapper for About accordions.
 * Keeps content mounted through the close transition so the collapse can play.
 */

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import './about-accordion.css';

const ACC_MS = 500;

type AboutAccordionRevealProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  role?: string;
  'aria-labelledby'?: string;
  style?: CSSProperties;
};

export function AboutAccordionReveal({
  open,
  children,
  className,
  bodyClassName,
  id,
  role,
  'aria-labelledby': ariaLabelledBy,
  style,
}: AboutAccordionRevealProps) {
  const [mounted, setMounted] = useState(open);
  const [revealed, setRevealed] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setRevealed(true));
      });
      return () => cancelAnimationFrame(raf);
    }

    setRevealed(false);
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setMounted(false), reduce ? 0 : ACC_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  const shellClass = [
    'vp-about-acc',
    revealed ? 'is-open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClass = ['vp-about-acc__body', bodyClassName].filter(Boolean).join(' ');

  return (
    <div className={shellClass} style={style}>
      <div className="vp-about-acc__clip">
        <div
          id={id}
          role={role}
          aria-labelledby={ariaLabelledBy}
          aria-hidden={!open}
          inert={!open ? true : undefined}
          className={bodyClass}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
