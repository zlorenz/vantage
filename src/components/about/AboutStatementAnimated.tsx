'use client';

/**
 * About statement display — scroll-triggered word reveal on /about.
 * Receives pre-resolved line strings from AboutStatementSection (server).
 */

import { isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CornerFrame } from '@/components/ui/CornerFrame';
import './about-statement.css';

/** Third frame in each Figma strip (0-based) is the sharp, bracketed one. */
const FILM_CENTER_INDEX = 2;

export type AboutStatementMarkerImage = {
  src: string;
  alt: string;
};

export type AboutStatementFilmStrips = {
  left: ReadonlyArray<AboutStatementMarkerImage>;
  right: ReadonlyArray<AboutStatementMarkerImage>;
};

export type AboutStatementLines = {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
  markers: ReadonlyArray<AboutStatementMarkerImage>;
  filmStrips: AboutStatementFilmStrips;
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
  reducedMotion: boolean;
  markers: ReadonlyArray<AboutStatementMarkerImage>;
};

function StatementLine({
  lineIndex,
  words,
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
    if (wordIndex < words.length - 1) {
      nodes.push(
        <span
          key={`sp-${wordIndex}`}
          className={hasMarkerAfter ? 'vp-about-statement__gap vp-about-statement__gap--marker' : 'vp-about-statement__gap'}
          aria-hidden
        >
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

/**
 * Line 6, the yellow close. One run in both locales. t.rich still renders it
 * so a future <br> in the English catalog can split it without a code change.
 */
function AccentLine({ reducedMotion }: { reducedMotion: boolean }) {
  const t = useTranslations('About');
  const lineRef = useRef<HTMLDivElement>(null);
  const rich = t.rich('statementLine6', {
    br: () => <span className="vp-about-statement__accent-break" />,
  });
  const nodes = nodesFromRich(rich, { index: 0, pendingSpace: false });

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
    'vp-about-statement__line--accent',
    reducedMotion ? 'in-view' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={lineRef} className={lineClass}>
      {nodes}
    </div>
  );
}

function nodesFromRich(
  node: ReactNode,
  state: { index: number; pendingSpace: boolean },
): ReactNode[] {
  if (node == null || typeof node === 'boolean') return [];

  if (typeof node === 'string' || typeof node === 'number') {
    const words = String(node).trim().split(/\s+/).filter(Boolean);
    const out: ReactNode[] = [];
    words.forEach((word) => {
      if (state.pendingSpace) {
        out.push(
          <span key={`sp-${state.index}`} className="vp-about-statement__gap" aria-hidden>
            {'\u00a0'}
          </span>,
        );
      }
      out.push(
        <span
          key={`w-${state.index}`}
          className="vp-about-statement__word"
          style={{ '--i': state.index } as CSSProperties}
        >
          {word}
        </span>,
      );
      state.index += 1;
      state.pendingSpace = true;
    });
    return out;
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => nodesFromRich(child, state));
  }

  if (isValidElement(node)) {
    state.pendingSpace = false;
    return [node];
  }

  return [];
}

function FilmStrip({
  side,
  frames,
}: {
  side: 'left' | 'right';
  frames: ReadonlyArray<AboutStatementMarkerImage>;
}) {
  return (
    <div className={`vp-about-statement__rail vp-about-statement__rail--${side}`}>
      <div className="vp-about-statement__track" data-film-strip-track={side}>
        {frames.map((frame, index) => {
          const center = index === FILM_CENTER_INDEX;
          return (
            <div
              key={`${side}-${frame.src}`}
              className={
                center
                  ? 'vp-about-statement__frame vp-about-statement__frame--center'
                  : 'vp-about-statement__frame'
              }
            >
              <div className="vp-about-statement__frame-media">
                <Image
                  src={frame.src}
                  alt=""
                  fill
                  sizes="297px"
                  className="object-cover"
                />
              </div>
              {center ? (
                <CornerFrame
                  variant="dark"
                  crosshair={{ size: 40, color: 'var(--vp-text)' }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AboutStatementAnimated({
  line1,
  line2,
  line3,
  line4,
  line5,
  markers,
  filmStrips,
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
    { words: splitLine(line5) },
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
      <div className="vp-about-statement__stage" aria-hidden="true">
        <FilmStrip side="left" frames={filmStrips.left} />
        <FilmStrip side="right" frames={filmStrips.right} />
        <span className="vp-about-statement__hairline vp-about-statement__hairline--outer-left" />
        <span className="vp-about-statement__hairline vp-about-statement__hairline--inner-left" />
        <span className="vp-about-statement__hairline vp-about-statement__hairline--inner-right" />
        <span className="vp-about-statement__hairline vp-about-statement__hairline--outer-right" />
        <div className="vp-about-statement__rulers">
          <CornerFrame variant="dark" rulers={{ top: true, bottom: true }} />
        </div>
      </div>
      <div className="vp-content-rail vp-about-statement__inner text-center">
        <h1 className="vp-about-statement__heading">
          {lines.map((line, lineIndex) => (
            <StatementLine
              key={lineIndex}
              lineIndex={lineIndex}
              words={line.words}
              reducedMotion={reducedMotion}
              markers={markers}
            />
          ))}
          <AccentLine reducedMotion={reducedMotion} />
        </h1>
      </div>
    </section>
  );
}
