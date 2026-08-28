'use client';

/**
 * About statement display — scroll-triggered word reveal on /about.
 * Receives pre-resolved line strings from AboutStatementSection (server).
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './about-statement.css';

export type AboutStatementLines = {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
};

type AboutStatementAnimatedProps = AboutStatementLines;

const HEADING_CLASS =
  'm-0 font-vp-heading text-[clamp(2.375rem,5.5vw,4.5rem)] uppercase leading-[0.95] tracking-vp-heading';

const IO_ROOT_MARGIN = '0px 0px -25% 0px';
const IO_THRESHOLD = 0.2;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function splitLine(line: string): string[] {
  return line.trim().split(/\s+/).filter(Boolean);
}

type StatementLineProps = {
  words: string[];
  accent?: boolean;
  reducedMotion: boolean;
};

function StatementLine({ words, accent = false, reducedMotion }: StatementLineProps) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const el = lineRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: IO_ROOT_MARGIN, threshold: IO_THRESHOLD },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  const lineClass = [
    'vp-about-statement__line',
    accent ? 'vp-about-statement__line--accent' : '',
    reducedMotion ? 'in-view' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={lineRef} className={lineClass}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="vp-about-statement__word"
          style={{ '--i': index } as CSSProperties}
        >
          {word}
          {index < words.length - 1 ? '\u00a0' : null}
        </span>
      ))}
    </div>
  );
}

export function AboutStatementAnimated({
  line1,
  line2,
  line3,
  line4,
  line5,
}: AboutStatementAnimatedProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    function sync() {
      setReducedMotion(mq.matches);
    }
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const lines = [
    { words: splitLine(line1), accent: false },
    { words: splitLine(line2), accent: false },
    { words: splitLine(line3), accent: false },
    { words: splitLine(line4), accent: false },
    { words: splitLine(line5), accent: true },
  ];

  const sectionClass = [
    'vp-about-statement',
    'bg-vp-bg',
    'px-[var(--spacing-vp-gutter)]',
    'pb-[var(--vp-section-y)]',
    'pt-[var(--vp-section-y-header-condensed)]',
    'text-vp-text',
    reducedMotion ? 'vp-about-statement--reduced-motion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-[1400px] text-center">
        <h1 className={HEADING_CLASS}>
          {lines.map((line, lineIndex) => (
            <StatementLine
              key={lineIndex}
              words={line.words}
              accent={line.accent}
              reducedMotion={reducedMotion}
            />
          ))}
        </h1>
      </div>
    </section>
  );
}
