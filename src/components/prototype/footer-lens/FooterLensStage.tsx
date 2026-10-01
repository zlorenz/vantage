'use client';

/**
 * Shared loupe stage — WebGL gradient + Canvas 2D symbol lens.
 * Used by the /prototype/footer-lens playground and the About page hero.
 */

import {useEffect, useRef} from 'react';
import {createFooterLensEngine} from './footer-lens-engine';
import {createGradientBgEngine} from './gradient-bg-engine';
import './footer-lens.css';

/** Fraction of the remaining gap closed per 60fps frame. Matches Monopo's 0.1 follow. */
const FOLLOW = 0.1;
const FRAME_MS = 1000 / 60;

type FooterLensStageProps = {
  className?: string;
  canvasLabel?: string;
};

export function FooterLensStage({
  className,
  canvasLabel = 'Vantage symbol with magnifying-glass hover effect',
}: FooterLensStageProps) {
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const gradientCanvasRef = useRef<HTMLCanvasElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lensCanvas = lensCanvasRef.current;
    const gradientCanvas = gradientCanvasRef.current;
    const wrap = wrapRef.current;
    if (!lensCanvas || !gradientCanvas || !wrap) return;

    const lens = createFooterLensEngine(lensCanvas);
    lens.setGlassHost(glassRef.current);
    let gradient: ReturnType<typeof createGradientBgEngine> | null = null;
    try {
      gradient = createGradientBgEngine(gradientCanvas);
    } catch (err) {
      console.warn('[footer-lens] gradient WebGL unavailable', err);
    }

    let targetX = 0;
    let targetY = 0;
    let smoothX = 0;
    let smoothY = 0;
    /** Pointer is inside the hero, including the nav that covers its top edge. */
    let tracking = false;
    /** True after the first hover, so leaving the hero holds the last frame. */
    let tracked = false;
    let running = false;
    let seeded = false;
    let raf = 0;
    let cssW = 1;
    let cssH = 1;
    let idleSettleFrames = 0;
    let lastTick = 0;

    const heroRect = () => wrap.getBoundingClientRect();

    const pointInHero = (clientX: number, clientY: number) => {
      const rect = heroRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    };

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(1, Math.floor(rect.width));
      cssH = Math.max(1, Math.floor(rect.height));
      if (!seeded) {
        targetX = smoothX = cssW / 2;
        targetY = smoothY = cssH / 2;
        seeded = true;
      }
      // Gradient first so a lens rebuild throw cannot skip the background paint.
      try {
        gradient?.setSize(cssW, cssH);
        gradient?.frame();
      } catch (err) {
        console.warn('[footer-lens] gradient resize failed', err);
      }
      try {
        lens.setSize(cssW, cssH);
        lens.drawAt(smoothX, smoothY, tracked);
      } catch (err) {
        console.error('[footer-lens] lens resize failed', err);
      }
      // A single synchronous draw can be dropped before the canvas is
      // composited. Keep painting a few frames so the hero cannot stick blank.
      if (!tracked) {
        idleSettleFrames = Math.max(idleSettleFrames, 3);
        startLoop();
      }
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
      const now = performance.now();
      const dt = lastTick ? Math.min(48, now - lastTick) : FRAME_MS;
      lastTick = now;
      const follow = 1 - Math.pow(1 - FOLLOW, dt / FRAME_MS);

      if (tracking) {
        smoothX += (targetX - smoothX) * follow;
        smoothY += (targetY - smoothY) * follow;

        gradient?.setPointer({x: smoothX, y: smoothY}, cssW, cssH);
        gradient?.frame();
        lens.drawAt(smoothX, smoothY, true);

        raf = requestAnimationFrame(tick);
        return;
      }

      // Before the first hover, paint the resting gradient a few frames so
      // the hero cannot stick blank. After that, leaving the hero freezes.
      if (tracked || idleSettleFrames <= 0) {
        running = false;
        return;
      }
      gradient?.setPointer(null, cssW, cssH);
      gradient?.frame();
      lens.drawAt(smoothX, smoothY, false);
      idleSettleFrames -= 1;
      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (running) return;
      lastTick = 0;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const freeze = () => {
      if (!tracking) return;
      tracking = false;
      stopLoop();
    };

    const onWindowPointer = (e: PointerEvent) => {
      if (!pointInHero(e.clientX, e.clientY)) {
        freeze();
        return;
      }
      const rect = heroRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      if (!tracked) {
        smoothX = targetX;
        smoothY = targetY;
      }
      tracked = true;
      tracking = true;
      idleSettleFrames = 0;
      startLoop();
    };

    const onLeaveDocument = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      freeze();
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);

    window.addEventListener('pointermove', onWindowPointer, true);
    document.addEventListener('pointerleave', onLeaveDocument);

    return () => {
      ro.disconnect();
      window.removeEventListener('pointermove', onWindowPointer, true);
      document.removeEventListener('pointerleave', onLeaveDocument);
      stopLoop();
      lens.destroy();
      gradient?.destroy();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={['vp-footer-lens-proto__lens-wrap', className].filter(Boolean).join(' ')}
    >
      <canvas
        ref={gradientCanvasRef}
        className="vp-footer-lens-proto__gradient"
        aria-hidden
      />
      <div ref={glassRef} className="vp-footer-lens-proto__glass" aria-hidden />
      <canvas
        ref={lensCanvasRef}
        className="vp-footer-lens-proto__canvas"
        aria-label={canvasLabel}
      />
    </div>
  );
}
