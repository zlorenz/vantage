'use client';

/**
 * Prototype-only footer lens — isolated from production SiteFooter.
 * Continuous rAF + cursor lerp (~0.1) match monopo.london's tracking feel.
 */

import {useEffect, useRef} from 'react';
import {createFooterLensEngine} from './footer-lens-engine';
import './footer-lens.css';

/** Monopo uses smooth += 0.1 * (target - smooth). */
const LERP = 0.1;
const SETTLE_PX = 0.15;

export function FooterLensPrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const engine = createFooterLensEngine(canvas);

    let targetX = 0;
    let targetY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let pointerActive = false;
    let running = false;
    let seeded = false;
    let raf = 0;
    let lastDrawnX = Number.NaN;
    let lastDrawnY = Number.NaN;

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      engine.setSize(cssW, cssH);
      if (!seeded) {
        targetX = smoothX = cssW / 2;
        targetY = smoothY = cssH / 2;
        seeded = true;
      }
      lastDrawnX = Number.NaN;
    };

    const stopLoop = () => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const tick = () => {
      raf = 0;
      if (!pointerActive) {
        engine.drawAt(smoothX, smoothY, false);
        running = false;
        return;
      }

      smoothX += (targetX - smoothX) * LERP;
      smoothY += (targetY - smoothY) * LERP;

      const dx = targetX - smoothX;
      const dy = targetY - smoothY;
      const settled = dx * dx + dy * dy < SETTLE_PX * SETTLE_PX;
      if (settled) {
        smoothX = targetX;
        smoothY = targetY;
      }

      const moved =
        Number.isNaN(lastDrawnX) ||
        Math.abs(smoothX - lastDrawnX) > 0.25 ||
        Math.abs(smoothY - lastDrawnY) > 0.25;

      if (moved) {
        engine.setPointer({x: targetX, y: targetY});
        engine.drawAt(smoothX, smoothY, true);
        lastDrawnX = smoothX;
        lastDrawnY = smoothY;
      }

      if (!settled || moved) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const setTarget = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      if (!pointerActive) {
        // Snap onto cursor on enter so the lens doesn't travel from center.
        smoothX = targetX;
        smoothY = targetY;
        lastDrawnX = Number.NaN;
      }
      pointerActive = true;
      startLoop();
    };

    const onPointerLeave = () => {
      pointerActive = false;
      engine.setPointer(null);
      startLoop(); // one idle paint, then stop
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);

    canvas.addEventListener('pointermove', setTarget);
    canvas.addEventListener('pointerenter', setTarget);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointermove', setTarget);
      canvas.removeEventListener('pointerenter', setTarget);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      stopLoop();
      engine.destroy();
    };
  }, []);

  return (
    <div className="vp-footer-lens-proto">
      <p className="vp-footer-lens-proto__hint">
        Hover the wordmark — mosaic content swap, displacement warp, rim
        chromatic aberration, glass overlay. Prototype only.
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
