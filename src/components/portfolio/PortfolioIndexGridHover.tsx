/**
 * Hover chrome for a portfolio index grid card: corner brackets + center plus.
 */

export function PortfolioIndexGridHover() {
  return (
    <div className="vp-portfolio-index__grid-hover" aria-hidden="true">
      <span className="vp-portfolio-index__grid-corner vp-portfolio-index__grid-corner--tl" />
      <span className="vp-portfolio-index__grid-corner vp-portfolio-index__grid-corner--tr" />
      <span className="vp-portfolio-index__grid-corner vp-portfolio-index__grid-corner--bl" />
      <span className="vp-portfolio-index__grid-corner vp-portfolio-index__grid-corner--br" />
      <svg
        className="vp-portfolio-index__grid-plus"
        viewBox="0 0 40 40"
        focusable="false"
      >
        <line x1="0" y1="20" x2="40" y2="20" />
        <line x1="20" y1="0" x2="20" y2="40" />
      </svg>
    </div>
  );
}
