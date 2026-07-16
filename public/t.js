/**
 * Video Nurture Pages — Tracking Beacon
 * ~2KB minified, zero dependencies, no cookies.
 *
 * Tracks:
 *  - Page views with referrer, screen size, user agent
 *  - CTA clicks
 *  - Time-on-page via heartbeat (every 30s while visible)
 *
 * Uses:
 *  - localStorage for visitor ID persistence
 *  - Page Visibility API to pause when tab is hidden
 *  - sendBeacon for reliable delivery on unload
 */
(function () {
  'use strict';

  var PAGE = window.location.pathname.replace(/\/$/, '') || '/';
  var API = '/api';

  // ── Visitor ID ──────────────────────────────────────────
  var VISITOR_KEY = '_vnp_visitor_id';
  var visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId =
      'v' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 6);
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  // ── Helpers ─────────────────────────────────────────────
  function post(path, data) {
    try {
      var payload = JSON.stringify(data);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(path, payload);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', path, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      }
    } catch (e) {
      // Silently fail — tracking should never break the page
    }
  }

  function getTimestamp() {
    return new Date().toISOString();
  }

  // ── Track page view ─────────────────────────────────────
  function trackView() {
    post(API + '/track', {
      page: PAGE,
      visitorId: visitorId,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      timestamp: getTimestamp(),
      screenWidth: window.screen.width || 0,
      screenHeight: window.screen.height || 0,
    });
  }

  // ── Heartbeat (time-on-page) ────────────────────────────
  var heartbeatInterval = null;
  var heartbeatSeconds = 0;

  function sendHeartbeat() {
    heartbeatSeconds += 30;
    post(API + '/track', {
      page: PAGE,
      visitorId: visitorId,
      timestamp: getTimestamp(),
      heartbeatSeconds: heartbeatSeconds,
    });
  }

  function startHeartbeat() {
    if (heartbeatInterval) return;
    heartbeatInterval = setInterval(sendHeartbeat, 30000);
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  // ── Visibility API ──────────────────────────────────────
  function handleVisibilityChange() {
    if (document.hidden) {
      stopHeartbeat();
    } else {
      startHeartbeat();
    }
  }

  if (typeof document.hidden !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange, false);
  }

  // ── Track CTA clicks ────────────────────────────────────
  function handleCtaClick(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (
        target.tagName === 'A' &&
        (target.classList.contains('cta-btn') ||
          target.getAttribute('data-track') === 'cta')
      ) {
        post(API + '/click', {
          page: PAGE,
          visitorId: visitorId,
          timestamp: getTimestamp(),
        });
        break;
      }
      target = target.parentElement;
    }
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    trackView();
    if (!document.hidden) {
      startHeartbeat();
    }
    document.addEventListener('click', handleCtaClick, false);

    // Send final heartbeat on page unload
    window.addEventListener('beforeunload', function () {
      sendHeartbeat();
    });
  }

  // Fire after DOM is ready (but not async-blocking)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, false);
  } else {
    init();
  }
})();
