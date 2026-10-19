/**
 * One native-scroll conductor for a two-chapter, eight-second camera journey.
 *
 * Integration:
 *   import { initJourney } from './journey.mjs';
 *   const journey = initJourney(document.querySelector('[data-journey]'));
 *   // On route teardown: journey.destroy();
 *
 * All HTML is readable in normal flow before this module runs. CSS may add the
 * tall wrapper, sticky stage and absolute chapter layers ONLY under
 * `.journey-enhanced`. Keep the video renderable behind the opaque poster while
 * loading, so a presented-frame callback can fire. Hide the poster ONLY under
 * `.journey-enhanced.journey-frame-ready`. No-JS, mobile, motion-off and failed
 * media modes must retain a representative poster and both normal-flow chapters.
 *
 * Optional video[data-src] delays its network request until enhancement is
 * eligible. Missing media is explicitly reported, never treated as a movie.
 * [data-motion-toggle] can contain a [data-motion-label] text span. Progress can
 * be a native <progress>, a role=progressbar, or a decorative CSS element using
 * --journey-progress. The skip link uses its ordinary native anchor behavior.
 *
 * Browser temporal QA is required; the unit tests cover logic, not appearance.
 */

export const JOURNEY_TIMELINE = Object.freeze({
  travelStart: 0.18,
  travelEnd: 0.68,
  endTime: 7.9,
  frameTolerance: 1 / 30,
});

export function clamp(value, min = 0, max = 1) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

export function getScrollProgress(scrollY, sectionTop, sectionHeight, stageHeight) {
  if (![scrollY, sectionTop, sectionHeight, stageHeight].every(Number.isFinite)) return 0;
  return clamp((scrollY - sectionTop) / Math.max(1, sectionHeight - stageHeight));
}

/** Linear timeline mapping: media owns camera easing; scrolling owns time. */
export function progressToVideoTime(progress, duration, timeline = JOURNEY_TIMELINE) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const end = Math.max(0, Math.min(timeline.endTime, duration - 1 / 60));
  const travel = clamp((clamp(progress) - timeline.travelStart)
    / Math.max(Number.EPSILON, timeline.travelEnd - timeline.travelStart));
  return travel * end;
}

function smoothstep(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/** The camera clears the new text-safe area before the second panel arrives. */
export function chapterPresentation(progress, chapter) {
  const p = clamp(progress);
  if (Number(chapter) === 0) {
    const exit = smoothstep((p - 0.14) / 0.04);
    return { opacity: 1 - exit, translateY: -16 * exit, visible: exit < 1 };
  }
  if (Number(chapter) === 1) {
    const entrance = smoothstep((p - 0.68) / 0.04);
    return { opacity: entrance, translateY: 24 * (1 - entrance), visible: entrance > 0 };
  }
  return { opacity: 1, translateY: 0, visible: true };
}

/** Fast scrolling may outrun the decoder. Copy waits for its actual safe frame. */
export function chapterAtPresentedFrame(progress, chapter, displayedTime, duration) {
  const presentation = chapterPresentation(progress, chapter);
  const tolerance = JOURNEY_TIMELINE.frameTolerance * 2;
  const index = Number(chapter);
  const safe = Number.isFinite(displayedTime)
    && (index === 0 ? displayedTime <= tolerance
      : index === 1 ? displayedTime >= progressToVideoTime(1, duration) - tolerance : true);
  return safe ? presentation : { ...presentation, opacity: 0, visible: false };
}

/**
 * A bounded seek scheduler. A newer target replaces the old target; it never
 * queues a history of wheel positions. Waiting on metadata, a seek, visibility
 * or a settled target creates no RAF loop. Explicit media events wake it.
 */
export function createLatestSeekController({
  readTime,
  isReady,
  isSeeking,
  seek,
  requestFrame,
  cancelFrame,
  onError = () => {},
  tolerance = JOURNEY_TIMELINE.frameTolerance,
}) {
  let targetTime = 0;
  let inFlight = false;
  let suspended = true;
  let disposed = false;
  let frame = null;

  function schedule() {
    if (disposed || suspended || frame !== null) return;
    frame = requestFrame(tick);
  }

  function tick() {
    frame = null;
    if (disposed || suspended || !isReady() || inFlight || isSeeking()) return;
    if (Math.abs(targetTime - readTime()) <= tolerance) return;
    inFlight = true;
    try {
      seek(targetTime);
    } catch (error) {
      inFlight = false;
      suspended = true;
      onError(error);
    }
  }

  return {
    setTarget(time) {
      if (disposed) return;
      targetTime = Math.max(0, Number.isFinite(time) ? time : 0);
      schedule();
    },
    wake: schedule,
    onSeeked() {
      if (disposed) return;
      inFlight = false;
      schedule();
    },
    setSuspended(value) {
      suspended = Boolean(value);
      if (suspended && frame !== null) {
        cancelFrame(frame);
        frame = null;
      }
      if (!suspended) schedule();
    },
    getState: () => ({ targetTime, inFlight, suspended, scheduled: frame !== null, disposed }),
    destroy() {
      disposed = true;
      if (frame !== null) cancelFrame(frame);
      frame = null;
    },
  };
}

function rememberAttributes(element, names) {
  const original = new Map(names.map((name) => [name, element.getAttribute(name)]));
  return () => {
    for (const [name, value] of original) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
  };
}

function rememberStyles(element, names) {
  const original = new Map(names.map((name) => [name, {
    value: element.style.getPropertyValue(name),
    priority: element.style.getPropertyPriority(name),
  }]));
  return () => {
    for (const [name, { value, priority }] of original) {
      if (value) element.style.setProperty(name, value, priority);
      else element.style.removeProperty(name);
    }
  };
}

/** Returns a lifecycle handle even when the required markup is absent. */
export function initJourney(root, options = {}) {
  const stage = root?.querySelector('[data-journey-stage]');
  const video = root?.querySelector('[data-journey-video]');
  if (!root || !stage || !video) {
    return {
      destroy() {},
      getState: () => ({ state: 'static', reason: 'missing-markup', mediaStatus: 'missing' }),
    };
  }

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const chapters = [...root.querySelectorAll('[data-chapter]')];
  const progressElements = [...root.querySelectorAll('[data-journey-progress]')];
  const controls = [...(options.controls || doc.querySelectorAll('[data-motion-toggle]'))];
  const reducedQuery = win.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowQuery = win.matchMedia('(max-width: 767px)');
  const shortQuery = win.matchMedia('(max-height: 600px)');
  const source = (options.src || video.getAttribute('data-src')
    || video.getAttribute('src') || video.querySelector('source[src]')?.getAttribute('src') || '').trim();
  const restored = [];
  const removers = [];
  const chapterRestorers = new Map();
  const originalEnhanced = root.classList.contains('journey-enhanced');
  const originalFrameReady = root.classList.contains('journey-frame-ready');
  const originalMuted = video.muted;
  let disposed = false;
  let state = 'static';
  let reason = 'initial';
  let mediaStatus = source ? 'idle' : 'missing';
  let sourceAttached = false;
  let framePresented = false;
  let displayedTime = null;
  let userPaused = false;
  let focusSafetyHeld = false;
  let visible = root.getBoundingClientRect().bottom > 0
    && root.getBoundingClientRect().top < win.innerHeight;
  let domFrame = null;
  let presentationFrame = null;
  let readinessTimeout = null;
  let seekTimeout = null;
  let geometry = { start: 0, height: 1, stageHeight: 1 };
  let progress = 0;

  restored.push(rememberAttributes(root, ['data-journey-state', 'data-journey-reason', 'data-media-status']));
  restored.push(rememberStyles(root, ['--journey-progress']));
  restored.push(rememberAttributes(video, ['src', 'preload', 'autoplay', 'loop', 'muted', 'playsinline']));

  for (const chapter of chapters) {
    const restoreAttrs = rememberAttributes(chapter, ['hidden', 'inert', 'aria-hidden']);
    const restoreStyle = rememberStyles(chapter, ['opacity', 'transform', 'visibility', 'pointer-events']);
    const restore = () => { restoreAttrs(); restoreStyle(); };
    chapterRestorers.set(chapter, restore);
    restored.push(restore);
  }
  for (const element of progressElements) {
    restored.push(rememberAttributes(element, ['value', 'max', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax']));
    restored.push(rememberStyles(element, ['--journey-progress']));
  }
  for (const control of controls) {
    restored.push(rememberAttributes(control, ['aria-pressed', 'aria-label', 'disabled', 'title', 'hidden']));
    const label = control.querySelector('[data-motion-label]')
      || (control.children.length === 0 ? control : null);
    if (label) {
      const originalText = label.textContent;
      restored.push(() => { label.textContent = originalText; });
    }
  }

  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options);
    removers.push(() => target.removeEventListener(name, handler, options));
  }

  function listenPreference(query) {
    if (query.addEventListener) listen(query, 'change', reconcilePolicy);
    else {
      query.addListener(reconcilePolicy);
      removers.push(() => query.removeListener(reconcilePolicy));
    }
  }

  function clearReadinessTimeout() {
    if (readinessTimeout !== null) win.clearTimeout(readinessTimeout);
    readinessTimeout = null;
  }

  function clearSeekTimeout() {
    if (seekTimeout !== null) win.clearTimeout(seekTimeout);
    seekTimeout = null;
  }

  function armReadinessTimeout() {
    if (readinessTimeout !== null || framePresented || !sourceAttached || !visible || doc.hidden || staticReason()) return;
    readinessTimeout = win.setTimeout(() => {
      readinessTimeout = null;
      if (!framePresented && visible && !doc.hidden && !staticReason()) failMedia();
    }, options.readinessTimeoutMs ?? 15000);
  }

  function armSeekTimeout() {
    if (seekTimeout !== null || !seeker.getState().inFlight || !visible || doc.hidden || staticReason()) return;
    seekTimeout = win.setTimeout(() => {
      seekTimeout = null;
      if (seeker.getState().inFlight && visible && !doc.hidden && !staticReason()) failMedia();
    }, options.seekTimeoutMs ?? 8000);
  }

  function isChapterAnchor() {
    const hash = win.location.hash;
    if (!hash) return false;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return false; }
    const target = doc.getElementById(id);
    return Boolean(target && chapters.some((chapter) => chapter === target || chapter.contains(target)));
  }

  function staticReason() {
    if (!source) return 'missing-video';
    if (mediaStatus === 'error') return 'media-error';
    if (typeof video.requestVideoFrameCallback !== 'function') return 'unsupported-video';
    if (reducedQuery.matches) return 'reduced-motion';
    if (narrowQuery.matches) return 'mobile';
    if (shortQuery.matches) return 'short-viewport';
    if (userPaused) return 'paused';
    if (focusSafetyHeld) return 'keyboard-focus';
    if (isChapterAnchor()) return 'chapter-anchor';
    return null;
  }

  function updateControls() {
    const unavailable = !source || mediaStatus === 'error' || reducedQuery.matches || narrowQuery.matches || shortQuery.matches
      || typeof video.requestVideoFrameCallback !== 'function';
    for (const control of controls) {
      const label = control.querySelector('[data-motion-label]')
        || (control.children.length === 0 ? control : null);
      let message = userPaused ? 'Enable motion' : 'Pause motion';
      if (!source || mediaStatus === 'error' || typeof video.requestVideoFrameCallback !== 'function') message = 'Motion unavailable';
      else if (reducedQuery.matches || narrowQuery.matches || shortQuery.matches) message = 'Motion off';
      control.disabled = unavailable;
      control.hidden = unavailable;
      control.setAttribute('aria-pressed', String(userPaused));
      control.setAttribute('aria-label', message);
      control.setAttribute('title', message);
      if (label) label.textContent = message;
    }
  }

  function publishState() {
    root.dataset.journeyState = state;
    root.dataset.journeyReason = reason;
    root.dataset.mediaStatus = mediaStatus;
    updateControls();
  }

  function suspendRenderer() {
    seeker.setSuspended(state !== 'enhanced' || !visible || doc.hidden);
    if (!visible || doc.hidden || staticReason()) {
      clearReadinessTimeout();
      clearSeekTimeout();
      return;
    }
    armReadinessTimeout();
    if (state === 'enhanced') armSeekTimeout();
    else clearSeekTimeout();
  }

  function showNormalFlow(why, nextState = 'static') {
    state = nextState;
    reason = why;
    root.classList.remove('journey-enhanced');
    for (const restore of chapterRestorers.values()) restore();
    if (domFrame !== null) win.cancelAnimationFrame(domFrame);
    domFrame = null;
    video.pause();
    suspendRenderer();
    publishState();
  }

  function measure() {
    const rect = root.getBoundingClientRect();
    geometry = {
      start: rect.top + win.scrollY,
      height: rect.height,
      stageHeight: stage.getBoundingClientRect().height,
    };
  }

  function updateDOM() {
    domFrame = null;
    if (disposed || state !== 'enhanced' || !visible || doc.hidden) return;
    progress = getScrollProgress(win.scrollY, geometry.start, geometry.height, geometry.stageHeight);
    const presentations = chapters.map((chapter) => [chapter,
      chapterAtPresentedFrame(progress, chapter.dataset.chapter, displayedTime, video.duration)]);

    // Do not make a focused link disappear when a mouse, trackpad or PageDown
    // changes the timeline. Fall back to complete content without moving focus.
    if (presentations.some(([chapter, presentation]) => presentation.opacity < 0.99 && chapter.contains(doc.activeElement))) {
      focusSafetyHeld = true;
      showNormalFlow('keyboard-focus');
      return;
    }

    root.style.setProperty('--journey-progress', String(progress));
    for (const [chapter, presentation] of presentations) {
      chapter.style.opacity = String(presentation.opacity);
      chapter.style.transform = `translate3d(0, ${presentation.translateY}px, 0)`;
      chapter.style.visibility = presentation.visible ? 'visible' : 'hidden';
      chapter.style.pointerEvents = presentation.visible ? '' : 'none';
      chapter.hidden = !presentation.visible;
      chapter.toggleAttribute('inert', !presentation.visible);
      chapter.setAttribute('aria-hidden', String(!presentation.visible));
    }
    for (const element of progressElements) {
      element.style.setProperty('--journey-progress', String(progress));
      if (element.tagName === 'PROGRESS') {
        element.max = 1;
        element.value = progress;
      } else if (element.getAttribute('role') === 'progressbar') {
        element.setAttribute('aria-valuemin', '0');
        element.setAttribute('aria-valuemax', '100');
        element.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      }
    }
    seeker.setTarget(progressToVideoTime(progress, video.duration));
  }

  function scheduleDOM() {
    if (disposed || state !== 'enhanced' || !visible || doc.hidden || domFrame !== null) return;
    domFrame = win.requestAnimationFrame(updateDOM);
  }

  function refresh() {
    if (disposed) return;
    measure();
    scheduleDOM();
  }

  function onPresented(_now, metadata) {
    presentationFrame = null;
    if (disposed || mediaStatus === 'error') return;
    displayedTime = Number.isFinite(metadata?.mediaTime) ? metadata.mediaTime : video.currentTime;
    if (!framePresented) {
      framePresented = true;
      mediaStatus = 'ready';
      root.classList.add('journey-frame-ready');
      clearReadinessTimeout();
      reconcilePolicy();
    }
    scheduleDOM();
  }

  function armPresentation() {
    if (disposed || presentationFrame !== null || mediaStatus === 'error') return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      presentationFrame = video.requestVideoFrameCallback(onPresented);
    }
  }

  function failMedia() {
    if (disposed) return;
    mediaStatus = 'error';
    clearReadinessTimeout();
    clearSeekTimeout();
    root.classList.remove('journey-frame-ready');
    showNormalFlow('media-error');
  }

  const seeker = createLatestSeekController({
    readTime: () => video.currentTime,
    isReady: () => video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0,
    isSeeking: () => video.seeking,
    seek: (time) => {
      armPresentation();
      clearSeekTimeout();
      armSeekTimeout();
      video.currentTime = time;
    },
    requestFrame: (callback) => win.requestAnimationFrame(callback),
    cancelFrame: (id) => win.cancelAnimationFrame(id),
    onError: failMedia,
  });

  function beginLoading() {
    if (sourceAttached || !source || mediaStatus === 'error') return;
    sourceAttached = true;
    mediaStatus = 'loading';
    video.autoplay = false;
    video.loop = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.pause();
    if (options.src || (!video.getAttribute('src') && !video.querySelector('source[src]'))) video.src = source;
    video.load();
    armPresentation();
  }

  function reconcilePolicy() {
    if (disposed) return;
    const why = staticReason();
    if (why) {
      showNormalFlow(why);
      return;
    }
    if (!sourceAttached && visible && !doc.hidden) beginLoading();
    if (!framePresented) {
      showNormalFlow(sourceAttached ? 'awaiting-frame' : 'offscreen', sourceAttached ? 'loading' : 'static');
      return;
    }
    state = 'enhanced';
    reason = 'ready';
    root.classList.add('journey-enhanced');
    publishState();
    measure();
    suspendRenderer();
    scheduleDOM();
  }

  listen(win, 'scroll', scheduleDOM, { passive: true });
  listen(win, 'resize', refresh, { passive: true });
  listen(win, 'orientationchange', refresh, { passive: true });
  listen(win, 'pageshow', () => { reconcilePolicy(); refresh(); });
  listen(win, 'hashchange', reconcilePolicy);
  listen(doc, 'visibilitychange', () => {
    if (doc.hidden) {
      if (domFrame !== null) win.cancelAnimationFrame(domFrame);
      domFrame = null;
      suspendRenderer();
    } else {
      reconcilePolicy();
      refresh();
    }
  });
  listenPreference(reducedQuery);
  listenPreference(narrowQuery);
  listenPreference(shortQuery);
  listen(video, 'error', failMedia);
  listen(video, 'loadedmetadata', () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) failMedia();
    else seeker.wake();
  });
  listen(video, 'loadeddata', () => { armPresentation(); seeker.wake(); });
  listen(video, 'seeked', () => { clearSeekTimeout(); armPresentation(); seeker.onSeeked(); });
  listen(video, 'canplay', () => { armPresentation(); seeker.wake(); });
  listen(root, 'focusout', () => {
    // Wait for the browser's native focus transfer before reassessing the hold.
    Promise.resolve().then(() => {
      if (disposed || !focusSafetyHeld) return;
      if (!chapters.some((chapter) => chapter.contains(doc.activeElement))) {
        focusSafetyHeld = false;
        reconcilePolicy();
      }
    });
  });
  for (const control of controls) {
    listen(control, 'click', () => {
      if (control.disabled) return;
      userPaused = !userPaused;
      reconcilePolicy();
    });
  }

  let resizeObserver;
  if (typeof win.ResizeObserver === 'function') {
    resizeObserver = new win.ResizeObserver(refresh);
    resizeObserver.observe(root);
    resizeObserver.observe(stage);
  }
  let intersectionObserver;
  if (typeof win.IntersectionObserver === 'function') {
    intersectionObserver = new win.IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && domFrame !== null) win.cancelAnimationFrame(domFrame);
      if (!visible) domFrame = null;
      reconcilePolicy();
    }, { threshold: 0 });
    intersectionObserver.observe(root);
  } else {
    listen(win, 'scroll', () => {
      const rect = root.getBoundingClientRect();
      const nextVisible = rect.bottom > 0 && rect.top < win.innerHeight;
      if (visible !== nextVisible) {
        visible = nextVisible;
        reconcilePolicy();
      }
    }, { passive: true });
  }
  if (doc.fonts?.ready) doc.fonts.ready.then(() => { if (!disposed) refresh(); });

  reconcilePolicy();

  return {
    refresh,
    getState: () => ({ state, reason, mediaStatus, progress, targetTime: seeker.getState().targetTime, displayedTime }),
    destroy() {
      if (disposed) return;
      disposed = true;
      seeker.destroy();
      if (domFrame !== null) win.cancelAnimationFrame(domFrame);
      if (presentationFrame !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(presentationFrame);
      clearReadinessTimeout();
      clearSeekTimeout();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      for (const remove of removers) remove();
      video.pause();
      for (const restore of restored.reverse()) restore();
      video.muted = originalMuted;
      root.classList.toggle('journey-enhanced', originalEnhanced);
      root.classList.toggle('journey-frame-ready', originalFrameReady);
      // Release a source attached by this controller without destroying a
      // pre-existing source owned by the page or a different component.
      if (sourceAttached && !video.getAttribute('src') && !video.querySelector('source[src]')) video.load();
    },
  };
}
