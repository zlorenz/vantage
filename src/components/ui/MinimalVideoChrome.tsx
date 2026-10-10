'use client';

import './minimal-video-chrome.css';

type MinimalVideoChromeProps = {
  running: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  /** When set, shows a fullscreen control (e.g. lightbox / inline players). */
  onFullscreen?: () => void;
};

/** Pause, progress bar, optional fullscreen. Title stays on the poster. */
export function MinimalVideoChrome({
  running,
  currentTime,
  duration,
  onToggle,
  onSeek,
  onFullscreen,
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
      {onFullscreen ? (
        <button
          type="button"
          className="vp-min-player__fullscreen"
          onClick={onFullscreen}
          aria-label="Fullscreen"
          title="Fullscreen"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
