'use client';

import './minimal-video-chrome.css';

type MinimalVideoChromeProps = {
  running: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
};

/** Pause and a progress bar. Title stays on the poster, before playback. */
export function MinimalVideoChrome({
  running,
  currentTime,
  duration,
  onToggle,
  onSeek,
}: MinimalVideoChromeProps) {
  const max = duration > 0 ? duration : 1;
  const value = duration > 0 ? Math.min(currentTime, duration) : 0;

  return (
    <div className="vp-min-player">
      <button
        type="button"
        className="vp-min-player__toggle"
        onClick={onToggle}
        aria-label={running ? 'Pause' : 'Play'}
      >
        {running ? (
          <span className="vp-min-player__pause" aria-hidden>
            <span />
            <span />
          </span>
        ) : (
          <span className="vp-min-player__play" aria-hidden />
        )}
      </button>
      <input
        className="vp-min-player__progress"
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        aria-label="Playback progress"
        onChange={(event) => onSeek(Number(event.target.value))}
      />
    </div>
  );
}
