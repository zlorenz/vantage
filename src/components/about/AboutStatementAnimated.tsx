'use client';

/**
 * About statement display — scroll-triggered word reveal on /about.
 * Receives pre-resolved line strings from AboutStatementSection (server).
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './about-statement.css';

export type AboutStatementMarkerImage = {
  src: string;
  alt: string;
};

export type AboutStatementLines = {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
  line6: string;
  markers: ReadonlyArray<AboutStatementMarkerImage>;
};

type AboutStatementAnimatedProps = AboutStatementLines;

const IO_ROOT_MARGIN = '0px 0px -25% 0px';
const IO_THRESHOLD = 0.2;

/** Body line index (0-based) → word index after which to insert a marker. */
const MARKER_AFTER_WORD_INDEX: Partial<Record<number, number>> = {
  1: 0,
  4: 2,
};

const LINE_TO_MARKER_SLOT: Partial<Record<number, 0 | 1>> = {
  1: 0,
  4: 1,
};

function splitLine(line: string): string[] {
  return line.trim().split(/\s+/).filter(Boolean);
}

type StatementMarkerProps = {
  slot: 0 | 1;
  staggerIndex: number;
  markers: ReadonlyArray<AboutStatementMarkerImage>;
};

function StatementMarker({ slot, staggerIndex, markers }: StatementMarkerProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const image = markers[slot];

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const measure = () => {
      const media = marker.querySelector('.vp-about-statement__marker-media');
      if (!(media instanceof HTMLElement)) return;

      const prevWidth = marker.style.width;
      const prevMaxWidth = marker.style.maxWidth;
      const prevOverflow = marker.style.overflow;
      marker.style.width = 'auto';
      marker.style.maxWidth = 'none';
      marker.style.overflow = 'visible';

      const w = media.getBoundingClientRect().width;
      if (w > 0) {
        marker.style.setProperty('--marker-w', `${w}px`);
      }

      marker.style.width = prevWidth;
      marker.style.maxWidth = prevMaxWidth;
      marker.style.overflow = prevOverflow;
    };

    measure();
    const img = marker.querySelector('img');
    if (img && !img.complete) {
      img.addEventListener('load', measure, { once: true });
    }
    void document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [image?.src]);

  return (
    <span
      ref={markerRef}
      className="vp-about-statement__marker"
      style={{ '--i': staggerIndex } as CSSProperties}
    >
      {image?.src ? (
        <img
          src={image.src}
          alt={image.alt}
          className="vp-about-statement__marker-media"
          decoding="async"
        />
      ) : (
        <span
          className="vp-about-statement__marker-media vp-about-statement__marker-placeholder"
          aria-hidden
        />
      )}
    </span>
  );
}

type StatementLineProps = {
  lineIndex: number;
  words: string[];
  accent?: boolean;
  reducedMotion: boolean;
  markers: ReadonlyArray<AboutStatementMarkerImage>;
};

function StatementLine({
  lineIndex,
  words,
  accent = false,
  reducedMotion,
  markers,
}: StatementLineProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const markerAfterWord = MARKER_AFTER_WORD_INDEX[lineIndex];
  const markerSlot = LINE_TO_MARKER_SLOT[lineIndex];

  useEffect(() => {
    if (reducedMotion) return;
    const el = lineRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('in-view', entry.isIntersecting);
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

  const nodes: ReactNode[] = [];
  let staggerIndex = 0;

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    nodes.push(
      <span
        key={`w-${wordIndex}`}
        className="vp-about-statement__word"
        style={{ '--i': staggerIndex } as CSSProperties}
      >
        {word}
      </span>,
    );

    const hasMarkerAfter = markerAfterWord === wordIndex && markerSlot !== undefined;
    if (wordIndex < words.length - 1 && !hasMarkerAfter) {
      nodes.push(
        <span key={`sp-${wordIndex}`} aria-hidden>
          {'\u00a0'}
        </span>,
      );
    }

    staggerIndex++;

    if (hasMarkerAfter) {
      nodes.push(
        <StatementMarker
          key={`m-${wordIndex}`}
          slot={markerSlot}
          staggerIndex={staggerIndex}
          markers={markers}
        />,
      );
      staggerIndex++;
    }
  }

  return (
    <div ref={lineRef} className={lineClass}>
      {nodes}
    </div>
  );
}

export function AboutStatementAnimated({
  line1,
  line2,
  line3,
  line4,
  line5,
  line6,
  markers,
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
    { words: splitLine(line5), accent: false },
    { words: splitLine(line6), accent: true },
  ];

  const sectionClass = [
    'vp-about-statement',
    'bg-vp-bg',
    'px-[var(--spacing-vp-gutter)]',
    'text-vp-text',
    reducedMotion ? 'vp-about-statement--reduced-motion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClass}>
      <div className="vp-content-rail vp-about-statement__inner text-center">
        <h1 className="vp-about-statement__heading">
          {lines.map((line, lineIndex) => (
            <StatementLine
              key={lineIndex}
              lineIndex={lineIndex}
              words={line.words}
              accent={line.accent}
              reducedMotion={reducedMotion}
              markers={markers}
            />
          ))}
        </h1>
      </div>
    </section>
  );
}
