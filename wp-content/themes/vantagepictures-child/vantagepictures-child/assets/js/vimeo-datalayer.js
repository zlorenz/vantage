/**
 * Vimeo portfolio embeds: push play / progress / complete to dataLayer for GTM → GA4.
 * Loaded on single-portfolio only. Requires Vimeo Player API (loaded dynamically).
 *
 * Events pushed:
 *   vp_vimeo_play     – user started playback
 *   vp_vimeo_progress – 25%, 50%, 75%, 100% (milestones only)
 *   vp_vimeo_complete – playback ended
 *
 * GTM: Create Custom Event triggers for these names, then GA4 Event tags with
 *      event name e.g. video_play, video_progress, video_complete and param video_id.
 */
(function () {
  'use strict';

  function pushEvent(eventName, videoId, extra) {
    window.dataLayer = window.dataLayer || [];
    var payload = {
      event: eventName,
      vimeo_video_id: videoId || '',
    };
    if (extra && typeof extra === 'object') {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) {
          payload[k] = extra[k];
        }
      }
    }
    window.dataLayer.push(payload);
  }

  function getVideoIdFromSrc(src) {
    if (!src || typeof src !== 'string') return '';
    var m = src.match(/video\/(\d+)/);
    return m ? m[1] : '';
  }

  function attachPlayer(iframe) {
    try {
      var player = new window.Vimeo.Player(iframe);
      var videoId = getVideoIdFromSrc(iframe.getAttribute('src'));
      var progressSent = { 25: false, 50: false, 75: false, 100: false };

      player.on('play', function () {
        pushEvent('vp_vimeo_play', videoId);
      });

      player.on('timeupdate', function (data) {
        var pct = data.percent != null ? Math.floor(data.percent * 100) : 0;
        [25, 50, 75, 100].forEach(function (milestone) {
          if (pct >= milestone && !progressSent[milestone]) {
            progressSent[milestone] = true;
            pushEvent('vp_vimeo_progress', videoId, { progress_percent: milestone });
          }
        });
      });

      player.on('ended', function () {
        pushEvent('vp_vimeo_complete', videoId);
      });
    } catch (e) {
      // Ignore iframe from different origin or missing API
    }
  }

  function loadVimeoApi(callback) {
    if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
      callback();
      return;
    }
    var s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.async = true;
    s.onload = callback;
    document.head.appendChild(s);
  }

  function init() {
    var iframes = document.querySelectorAll('iframe[src*="player.vimeo.com"]');
    if (!iframes.length) return;

    loadVimeoApi(function () {
      for (var i = 0; i < iframes.length; i++) {
        attachPlayer(iframes[i]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
