'use client';

/**
 * Prototype-only footer lens — isolated from production SiteFooter.
 */

import {useEffect, useRef} from 'react';
import {
  renderFooterLens,
  resizeCanvas,
  type FooterLensCache,
  type FooterLensState,
} from './footer-lens-engine';
import './footer-lens.css';

export function FooterLensPrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<FooterLensState>({
    cssW: 0,
    cssH: 0,
    dpr: 1,
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
  });
  const cacheRef = useRef<FooterLensCache>({revealKey: '', reveal: null});
  const rafRef = useRef<number>(0);
  const needsDrawRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || stateRef.current.cssW < 1) return;
      renderFooterLens(ctx, stateRef.current, cacheRef.current);
      needsDrawRef.current = false;
    };

    const schedule = () => {
      needsDrawRef.current = true;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (needsDrawRef.current) draw();
      });
    };

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stateRef.current.cssW = cssW;
      stateRef.current.cssH = cssH;
      stateRef.current.dpr = dpr;
      cacheRef.current.reveal = null;
      cacheRef.current.revealKey = '';
      resizeCanvas(canvas, cssW, cssH, dpr);
      // Seed pointer at logo center so first hover isn't off-canvas
      if (!stateRef.current.pointerActive) {
        stateRef.current.pointerX = cssW / 2;
        stateRef.current.pointerY = cssH / 2;
      }
      schedule();
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.pointerX = e.clientX - rect.left;
      stateRef.current.pointerY = e.clientY - rect.top;
      stateRef.current.pointerActive = true;
      schedule();
    };

    const onPointerEnter = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.pointerX = e.clientX - rect.left;
      stateRef.current.pointerY = e.clientY - rect.top;
      stateRef.current.pointerActive = true;
      schedule();
    };

    const onPointerLeave = () => {
      stateRef.current.pointerActive = false;
      schedule();
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerenter', onPointerEnter);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerenter', onPointerEnter);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="vp-footer-lens-proto">
      <p className="vp-footer-lens-proto__hint">
        Hover the wordmark — mosaic reveal, outer-ring warp, rim chromatic
        aberration. Prototype only.
      </p>
      <div className="vp-footer-lens-proto__stage">
        <div ref={wrapRef} className="vp-footer-lens-proto__lens-wrap">
          <canvas
            ref={canvasRef}
            className="vp-footer-lens-proto__canvas"
            aria-label="Vantage wordmark with magnifying-glass hover effect"
          />
        </div>
      </div>
    </div>
  );
}
