/**
 * CornerFrame — decorative brackets, optional crosshair, optional tick rulers.
 *
 * Shared overlay for the About desktop sections. Place it inside a
 * position: relative parent. It does not capture pointer events.
 *
 * Dark brackets reuse the brief tick tokens (12px, 1px, white 0.3).
 * Light brackets use --vp-candidate-about-black-50. This does not replace
 * the hand-rolled brackets on portfolio nav, blog nav, the campaign brief,
 * or the work index.
 */

import type { CSSProperties } from 'react';
import './corner-frame.css';

const MINOR_COUNT = 16;

const LABEL_CYCLE = ['( 01 )', '( 01 )', '( 02 )', '( 03 )', '( 03 )'] as const;

export type CornerFrameVariant = 'light' | 'dark';

export type CornerFrameCrosshair = {
  size: number;
  color: string;
};

export type CornerFrameRulers = {
  top?: boolean;
  bottom?: boolean;
  /** Index labels from the statement ruler. More About keeps these off. */
  labels?: boolean;
};

type CornerFrameProps = {
  variant?: CornerFrameVariant;
  crosshair?: CornerFrameCrosshair;
  rulers?: CornerFrameRulers;
  /** Set false to keep rulers or a crosshair without the corner brackets. */
  showBrackets?: boolean;
  className?: string;
};

function TickRow() {
  const ticks = [
    ...Array.from({ length: MINOR_COUNT }, () => false),
    true,
    ...Array.from({ length: MINOR_COUNT }, () => false),
  ];

  return (
    <span className="vp-corner-frame__ticks">
      {ticks.map((major, index) => (
        <span
          key={index}
          className={
            major ? 'vp-corner-frame__tick vp-corner-frame__tick--major' : 'vp-corner-frame__tick'
          }
        />
      ))}
    </span>
  );
}

function Ruler({
  edge,
  labels,
}: {
  edge: 'top' | 'bottom';
  labels: boolean;
}) {
  const groups = LABEL_CYCLE.flatMap((label, groupIndex) => {
    const group = (
      <div key={`${edge}-group-${groupIndex}`} className="vp-corner-frame__ruler-group">
        {labels ? <span className="vp-corner-frame__ruler-label">{label}</span> : null}
        <TickRow />
      </div>
    );
    if (groupIndex === LABEL_CYCLE.length - 1) return [group];
    return [
      group,
      <span key={`${edge}-sep-${groupIndex}`} className="vp-corner-frame__separator" />,
    ];
  });

  return <div className={`vp-corner-frame__ruler vp-corner-frame__ruler--${edge}`}>{groups}</div>;
}

export function CornerFrame({
  variant = 'dark',
  crosshair,
  rulers,
  showBrackets = true,
  className = '',
}: CornerFrameProps) {
  const showLabels = rulers?.labels ?? false;
  const crosshairStyle = crosshair
    ? ({
        '--vp-corner-crosshair-size': `${crosshair.size}px`,
        '--vp-corner-crosshair-color': crosshair.color,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={`vp-corner-frame vp-corner-frame--${variant}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {showBrackets ? (
        <>
          <span className="vp-corner-frame__bracket vp-corner-frame__bracket--tl" />
          <span className="vp-corner-frame__bracket vp-corner-frame__bracket--tr" />
          <span className="vp-corner-frame__bracket vp-corner-frame__bracket--bl" />
          <span className="vp-corner-frame__bracket vp-corner-frame__bracket--br" />
        </>
      ) : null}
      {crosshair ? <span className="vp-corner-frame__crosshair" style={crosshairStyle} /> : null}
      {rulers?.top ? <Ruler edge="top" labels={showLabels} /> : null}
      {rulers?.bottom ? <Ruler edge="bottom" labels={showLabels} /> : null}
    </div>
  );
}
