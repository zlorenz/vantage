'use client';

/**
 * Shared loupe stage — WebGL gradient + Canvas 2D symbol lens.
 * Used by the /prototype/footer-lens playground and the About page hero.
 */

import {useEffect, useRef} from 'react';
import {createFooterLensEngine} from './footer-lens-engine';
import {createGradientBgEngine} from './gradient-bg-engine';
import './footer-lens.css';

/** Monopo uses smooth += 0.1 * (target - smooth). */
const LERP = 0.1;
const SETTLE_PX = 0.15;

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
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lensCanvas = lensCanvasRef.current;
    const gradientCanvas = gradientCanvasRef.current;
    const wrap = wrapRef.current;
    if (!lensCanvas || !gradientCanvas || !wrap) return;

    const lens = createFooterLensEngine(lensCanvas);
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
    let pointerActive = false;
    let running = false;
    let seeded = false;
    let raf = 0;
    let cssW = 1;
    let cssH = 1;
    let idleSettleFrames = 0;

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(1, Math.floor(rect.width));
      cssH = Math.max(1, Math.floor(rect.height));
      lens.setSize(cssW, cssH);
      gradient?.setSize(cssW, cssH);
      if (!seeded) {
        targetX = smoothX = cssW / 2;
        targetY = smoothY = cssH / 2;
        seeded = true;
      }
      gradient?.frame();
      lens.drawAt(smoothX, smoothY, pointerActive);
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

      if (pointerActive) {
        smoothX += (targetX - smoothX) * LERP;
        smoothY += (targetY - smoothY) * LERP;

        const dx = targetX - smoothX;
        const dy = targetY - smoothY;
        if (dx * dx + dy * dy < SETTLE_PX * SETTLE_PX) {
          smoothX = targetX;
          smoothY = targetY;
        }

        lens.setPointer({x: targetX, y: targetY});
        lens.drawAt(smoothX, smoothY, true);
        gradient?.setPointer({x: smoothX, y: smoothY}, cssW, cssH);
        gradient?.frame();

        raf = requestAnimationFrame(tick);
        return;
      }

      lens.setPointer(null);
      lens.drawAt(smoothX, smoothY, false);
      gradient?.setPointer(null, cssW, cssH);
      gradient?.frame();
      idleSettleFrames -= 1;
      if (idleSettleFrames > 0) {
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
      const rect = lensCanvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      if (!pointerActive) {
        smoothX = targetX;
        smoothY = targetY;
      }
      pointerActive = true;
      idleSettleFrames = 0;
      startLoop();
    };

    const onPointerLeave = () => {
      pointerActive = false;
      idleSettleFrames = 24;
      startLoop();
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);

    lensCanvas.addEventListener('pointermove', setTarget);
    lensCanvas.addEventListener('pointerenter', setTarget);
    lensCanvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      ro.disconnect();
      lensCanvas.removeEventListener('pointermove', setTarget);
      lensCanvas.removeEventListener('pointerenter', setTarget);
      lensCanvas.removeEventListener('pointerleave', onPointerLeave);
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
      <canvas
        ref={lensCanvasRef}
        className="vp-footer-lens-proto__canvas"
        aria-label={canvasLabel}
      />
    </div>
  );
}
