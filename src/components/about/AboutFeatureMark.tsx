/**
 * Figma production-row "A" mosaic, node 2466:28980.
 * Piece SVGs are the exported assets. Opacity and blend stay as authored.
 * `mirrored` flips the same mosaic for the production-log row.
 */

const PIECES = [
  { src: '/about/feature-mark/tile-a.svg', bottom: 57.94, right: 270.85, width: 57.152, height: 56.939 },
  { src: '/about/feature-mark/tile-b.svg', bottom: 114.87, right: 126.33, width: 57.152, height: 56.939 },
  { src: '/about/feature-mark/tile-c.svg', bottom: 1.01, right: 0.38, width: 57.152, height: 56.939 },
  { src: '/about/feature-mark/tile-d.svg', bottom: 1, right: 213.7, width: 84.097, height: 56.941 },
  { src: '/about/feature-mark/tile-e.svg', bottom: 57.94, right: 156.53, width: 84.097, height: 56.941, flip: true },
  { src: '/about/feature-mark/tile-f.svg', bottom: 1.01, right: 57.53, width: 114.294, height: 113.868 },
] as const;

type AboutFeatureMarkProps = {
  mirrored?: boolean;
};

export function AboutFeatureMark({ mirrored = false }: AboutFeatureMarkProps) {
  return (
    <div
      className={`vp-about-feature-mark${mirrored ? ' is-mirrored' : ''}`}
      aria-hidden="true"
    >
      {PIECES.map((piece) => (
        <span
          key={piece.src}
          className="vp-about-feature-mark__piece"
          style={{
            bottom: piece.bottom,
            right: piece.right,
            width: piece.width,
            height: piece.height,
          }}
        >
          <img
            src={piece.src}
            alt=""
            width={piece.width}
            height={piece.height}
            className={'flip' in piece && piece.flip ? 'is-flipped' : undefined}
          />
        </span>
      ))}
      <span
        className="vp-about-feature-mark__wash"
        style={{ bottom: 57.94, right: 270.85, width: 58.522, height: 58.369 }}
      />
    </div>
  );
}
