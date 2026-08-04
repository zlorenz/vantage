/**
 * CjkOutlineFilter — single shared SVG filter for hollow CJK outline text.
 *
 * Dilates SourceAlpha, knocks out the original glyph, floods white → ring only.
 * Referenced by CSS as filter: url(#vp-cjk-outline) on :lang(zh) mobile.
 * Do not merge SourceGraphic (that yields filled text + border).
 */

export function CjkOutlineFilter() {
  return (
    <svg
      aria-hidden="true"
      width={0}
      height={0}
      className="pointer-events-none absolute overflow-hidden"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/*
          No explicit x/y/width/height — Safari has blanked filtered HTML text
          when filter regions are mis-set. Default region (-10%…120%) is enough
          for a 1px dilate at hero sizes.
        */}
        <filter id="vp-cjk-outline" colorInterpolationFilters="sRGB">
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="1"
            result="dilated"
          />
          <feComposite
            in="dilated"
            in2="SourceAlpha"
            operator="out"
            result="ring"
          />
          <feFlood floodColor="#ffffff" result="white" />
          <feComposite in="white" in2="ring" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
