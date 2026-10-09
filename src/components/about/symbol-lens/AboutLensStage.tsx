'use client';

/**
 * Shared loupe stage — WebGL gradient + Canvas 2D symbol lens.
 * Desktop (fine pointer): cursor-tracked collage disc + gradient warp.
 * Coarse pointer: no loupe; idle glass mark + scroll-driven gradient.
 * Reduced motion parks the field at rest.
 */

import {useEffect, useRef} from 'react';
import {createAboutLensEngine, aboutLensRadiusCss} from './symbol-lens-engine';
import {createGradientBgEngine} from './gradient-bg-engine';
import './symbol-lens.css';

/** Fraction of the remaining gap closed per 60fps frame. Matches Monopo's 0.1 follow. */
const FOLLOW = 0.1;
const FRAME_MS = 1000 / 60;

type AboutLensStageProps = {
  className?: string;
  canvasLabel?: string;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function AboutLensStage({
  className,
  canvasLabel = 'Vantage symbol with magnifying-glass hover effect',
}: AboutLensStageProps) {
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const gradientCanvasRef = useRef<HTMLCanvasElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lensCanvas = lensCanvasRef.current;
    const gradientCanvas = gradientCanvasRef.current;
    const wrap = wrapRef.current;
    if (!lensCanvas || !gradientCanvas || !wrap) return;

    const lens = createAboutLensEngine(lensCanvas);
    lens.setGlassHost(glassRef.current);
    let gradient: ReturnType<typeof createGradientBgEngine> | null = null;
    try {
      gradient = createGradientBgEngine(gradientCanvas);
    } catch (err) {
      console.warn('[about-lens] gradient WebGL unavailable', err);
    }

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    let pointerDriven = false;
    let scrollDriven = false;

    const heroRect = () => wrap.getBoundingClientRect();
    const loupeHost = () =>
      (wrap.closest('.vp-about-hero') as HTMLElement | null) ?? wrap;

    const pointInHero = (clientX: number, clientY: number) => {
      const rect = heroRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    };

    const syncLoupeVars = (active: boolean) => {
      const host = loupeHost();
      const r = active ? aboutLensRadiusCss(cssW, cssH) : 0;
      host.style.setProperty('--vp-loupe-x', `${smoothX}px`);
      host.style.setProperty('--vp-loupe-y', `${smoothY}px`);
      host.style.setProperty('--vp-loupe-r', `${r}px`);
    };

    const heroProgress = () => {
      const rect = heroRect();
      const travel = Math.max(Math.min(rect.height, window.innerHeight) * 0.55, 1);
      return clamp01(-rect.top / travel);
    };

    const paintScrollFrame = () => {
      gradient?.setScrollProgress(heroProgress());
      gradient?.frame();
      lens.drawAt(cssW / 2, cssH / 2, false);
      syncLoupeVars(false);
    };

    const paintPointerFrame = (active: boolean) => {
      if (active) {
        gradient?.setPointer({x: smoothX, y: smoothY}, cssW, cssH);
      } else {
        gradient?.setPointer(null, cssW, cssH);
      }
      gradient?.frame();
      lens.drawAt(smoothX, smoothY, active);
      syncLoupeVars(active);
    };

    const restPoint = () => ({x: cssW * 0.5, y: cssH * 0.5});

    const syncDriveMode = () => {
      const reduce = motionQuery.matches;
      pointerDriven = pointerQuery.matches && !reduce;
      scrollDriven = !pointerQuery.matches && !reduce;
      wrap.classList.toggle('is-scroll-driven', scrollDriven || reduce);
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

      if (scrollDriven) {
        paintScrollFrame();
        if (gradient?.settled()) {
          running = false;
          return;
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (tracking) {
        smoothX += (targetX - smoothX) * follow;
        smoothY += (targetY - smoothY) * follow;
        paintPointerFrame(true);
        raf = requestAnimationFrame(tick);
        return;
      }

      // Before the first hover, paint the resting gradient a few frames so
      // the hero cannot stick blank. After that, leaving the hero freezes.
      if (tracked || idleSettleFrames <= 0) {
        running = false;
        return;
      }
      paintPointerFrame(false);
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

    const aimAt = (x: number, y: number, snap: boolean) => {
      targetX = x;
      targetY = y;
      if (snap || !tracked) {
        smoothX = x;
        smoothY = y;
      }
      tracked = true;
      tracking = true;
      idleSettleFrames = 0;
      startLoop();
    };

    const onWindowPointer = (e: PointerEvent) => {
      if (!pointerDriven) return;
      if (!pointInHero(e.clientX, e.clientY)) {
        freeze();
        return;
      }
      const rect = heroRect();
      aimAt(e.clientX - rect.left, e.clientY - rect.top, false);
    };

    const onLeaveDocument = (e: PointerEvent) => {
      if (!pointerDriven) return;
      if (e.relatedTarget) return;
      freeze();
    };

    const onScroll = () => {
      if (!scrollDriven) return;
      startLoop();
    };

    const seedPosition = () => {
      const rest = restPoint();
      targetX = smoothX = rest.x;
      targetY = smoothY = rest.y;
    };

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(1, Math.floor(rect.width));
      cssH = Math.max(1, Math.floor(rect.height));
      if (!seeded) {
        seedPosition();
        seeded = true;
      }
      try {
        gradient?.setSize(cssW, cssH);
      } catch (err) {
        console.warn('[about-lens] gradient resize failed', err);
      }
      try {
        lens.setSize(cssW, cssH);
      } catch (err) {
        console.error('[about-lens] lens resize failed', err);
      }
      if (scrollDriven) {
        paintScrollFrame();
        startLoop();
        return;
      }
      if (tracked) {
        paintPointerFrame(true);
        return;
      }
      paintPointerFrame(false);
      idleSettleFrames = Math.max(idleSettleFrames, 3);
      startLoop();
    };

    const bindDrive = () => {
      window.removeEventListener('pointermove', onWindowPointer, true);
      document.removeEventListener('pointerleave', onLeaveDocument);
      window.removeEventListener('scroll', onScroll);
      window.visualViewport?.removeEventListener('scroll', onScroll);
      window.visualViewport?.removeEventListener('resize', onScroll);
      if (pointerDriven) {
        window.addEventListener('pointermove', onWindowPointer, true);
        document.addEventListener('pointerleave', onLeaveDocument);
      } else if (scrollDriven) {
        window.addEventListener('scroll', onScroll, {passive: true});
        window.visualViewport?.addEventListener('scroll', onScroll, {passive: true});
        window.visualViewport?.addEventListener('resize', onScroll, {passive: true});
        paintScrollFrame();
        startLoop();
      } else {
        tracking = false;
        stopLoop();
        paintPointerFrame(false);
      }
    };

    const onDriveChange = () => {
      syncDriveMode();
      bindDrive();
    };

    syncDriveMode();
    syncSize();
    bindDrive();

    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);
    pointerQuery.addEventListener('change', onDriveChange);
    motionQuery.addEventListener('change', onDriveChange);

    return () => {
      ro.disconnect();
      pointerQuery.removeEventListener('change', onDriveChange);
      motionQuery.removeEventListener('change', onDriveChange);
      window.removeEventListener('pointermove', onWindowPointer, true);
      document.removeEventListener('pointerleave', onLeaveDocument);
      window.removeEventListener('scroll', onScroll);
      window.visualViewport?.removeEventListener('scroll', onScroll);
      window.visualViewport?.removeEventListener('resize', onScroll);
      stopLoop();
      wrap.classList.remove('is-scroll-driven');
      const host = loupeHost();
      host.style.removeProperty('--vp-loupe-x');
      host.style.removeProperty('--vp-loupe-y');
      host.style.removeProperty('--vp-loupe-r');
      lens.destroy();
      gradient?.destroy();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={['vp-about-lens__lens-wrap', className].filter(Boolean).join(' ')}
    >
      <canvas
        ref={gradientCanvasRef}
        className="vp-about-lens__gradient"
        aria-hidden
      />
      <div ref={glassRef} className="vp-about-lens__glass" aria-hidden />
      <canvas
        ref={lensCanvasRef}
        className="vp-about-lens__canvas"
        aria-label={canvasLabel}
      />
    </div>
  );
}
