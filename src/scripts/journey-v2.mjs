/**
 * Four cinematic reading positions and one bounded horizontal showcase.
 * Semantic normal flow is the baseline. Enhancement is reversible and never
 * intercepts wheel/touch input. Only an actually presented frame reveals copy.
 */
import { clamp, getScrollProgress, createLatestSeekController } from './journey.mjs';

export const CINEMA_TIMELINE = Object.freeze({
  holds: Object.freeze([[0, .14], [.28, .40], [.54, .66], [.80, 1]].map(Object.freeze)),
  landings: Object.freeze([0, 4, 8, 12]),
  frameTolerance: 1 / 12,
  entrance: .04,
  exit: .04,
});
const HISTORY_KEY = '__nuLabsCinemaV2';
const empty = reason => ({ refresh() {}, destroy() {}, getState: () => ({ state: 'static', reason }) });
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

export function cinemaTimes(duration, timeline = CINEMA_TIMELINE) {
  if (!Number.isFinite(duration) || duration <= 0) return timeline.landings.map(() => 0);
  const last = Math.max(0, duration - 1 / 24);
  const scale = Math.min(1, last / timeline.landings.at(-1));
  return timeline.landings.map(time => Math.min(last, time * scale));
}

export function cinemaVideoTime(progress, duration, timeline = CINEMA_TIMELINE) {
  const p = clamp(progress);
  const times = cinemaTimes(duration, timeline);
  for (let i = 0; i < timeline.holds.length; i += 1) {
    if (p <= timeline.holds[i][1]) return times[i];
    if (i < times.length - 1 && p < timeline.holds[i + 1][0]) {
      const start = timeline.holds[i][1];
      const end = timeline.holds[i + 1][0];
      return times[i] + (times[i + 1] - times[i]) * clamp((p - start) / (end - start));
    }
  }
  return times.at(-1);
}

export function cinemaChapterProgress(index, timeline = CINEMA_TIMELINE) {
  const hold = timeline.holds[index];
  if (!hold) return 0;
  return index === 0 ? 0 : (hold[0] + hold[1]) / 2;
}

export function cinemaChapterPresentation(progress, index, displayedTime, duration, timeline = CINEMA_TIMELINE) {
  const hold = timeline.holds[index];
  const hidden = { opacity: 0, x: 0, y: 30, blur: 8, interactive: false };
  if (!hold || !Number.isFinite(displayedTime) || !Number.isFinite(duration) || duration <= 0) return hidden;
  const p = clamp(progress);
  const safeTime = cinemaTimes(duration, timeline)[index];
  if (p < hold[0] || p > hold[1] || Math.abs(displayedTime - safeTime) > timeline.frameTolerance) return hidden;
  const enter = index === 0 ? 1 : smooth((p - hold[0]) / timeline.entrance);
  const leave = index === timeline.holds.length - 1 ? 0 : smooth((p - (hold[1] - timeline.exit)) / timeline.exit);
  const opacity = clamp(enter * (1 - leave));
  return {
    opacity,
    x: (index % 2 ? 1 : -1) * 24 * (1 - enter),
    y: 30 * (1 - enter) - 18 * leave,
    blur: 8 * (1 - opacity),
    interactive: opacity >= .995,
  };
}

export function horizontalPresentation(progress, trackWidth, viewportWidth, count) {
  const travel = Math.max(0, Number.isFinite(trackWidth - viewportWidth) ? trackWidth - viewportWidth : 0);
  const p = clamp(progress);
  return { travel, x: -p * travel, index: Math.min(Math.max(0, count - 1), Math.floor(p * Math.max(1, count))) };
}

function remember(element, attrs = [], styles = []) {
  const attributes = attrs.map(name => [name, element.getAttribute(name)]);
  const properties = styles.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
  return () => {
    for (const [name, value] of attributes) value === null ? element.removeAttribute(name) : element.setAttribute(name, value);
    for (const [name, value, priority] of properties) value ? element.style.setProperty(name, value, priority) : element.style.removeProperty(name);
  };
}

function lifecycle(win) {
  const removers = [];
  return {
    listen(target, name, fn, options) {
      target.addEventListener(name, fn, options);
      removers.push(() => target.removeEventListener(name, fn, options));
    },
    cleanup() { removers.splice(0).forEach(remove => remove()); },
    preferences(callback) {
      const queries = ['(prefers-reduced-motion: reduce)', '(max-width: 999px)', '(max-height: 649px)', '(max-aspect-ratio: 5/4)'].map(query => win.matchMedia(query));
      for (const query of queries) {
        if (query.addEventListener) this.listen(query, 'change', callback);
        else { query.addListener(callback); removers.push(() => query.removeListener(callback)); }
      }
      return () => queries[0].matches ? 'reduced-motion' : queries.slice(1).some(query => query.matches) ? 'compact-viewport' : null;
    },
  };
}

function setProgress(elements, progress, name) {
  for (const element of elements) {
    element.style.setProperty(name, String(progress));
    if (element.tagName === 'PROGRESS') { element.max = 1; element.value = progress; }
    else if (element.getAttribute('role') === 'progressbar') {
      element.setAttribute('aria-valuemin', '0'); element.setAttribute('aria-valuemax', '100');
      element.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }
  }
}

export function initCinema(root, options = {}) {
  const stage = root?.querySelector('[data-cinema-stage]');
  const video = root?.querySelector('[data-cinema-video]');
  const chapters = [...(root?.querySelectorAll('[data-cinema-chapter]') || [])];
  if (!root || !stage || !video || chapters.length !== 4) return empty('missing-markup');
  const doc = root.ownerDocument, win = doc.defaultView;
  const events = lifecycle(win);
  const timeline = options.timeline || CINEMA_TIMELINE;
  const source = options.src || video.getAttribute('data-src') || video.getAttribute('src') || '';
  const controls = [...doc.querySelectorAll('[data-cinema-toggle]')];
  const indicators = [...root.querySelectorAll('[data-cinema-index]')];
  const progressElements = [...root.querySelectorAll('[data-cinema-progress]')];
  const restores = [remember(root, ['data-cinema-state', 'data-cinema-reason', 'data-media-status'], ['--cinema-progress']),
    remember(video, ['src', 'preload', 'autoplay', 'loop', 'muted', 'playsinline'])];
  const panelRestore = chapters.map(chapter => remember(chapter, ['inert', 'aria-hidden', 'hidden'],
    ['--chapter-opacity', '--chapter-x', '--chapter-y', '--chapter-blur']));
  const originalMuted = video.muted;
  for (const control of controls) {
    restores.push(remember(control, ['hidden', 'disabled', 'aria-disabled', 'aria-pressed', 'aria-label']));
    const label = control.querySelector('[data-cinema-label]') || (!control.children.length ? control : null);
    if (label) { const original = label.textContent; restores.push(() => { label.textContent = original; }); }
  }
  for (const indicator of indicators) { const original = indicator.textContent; restores.push(() => { indicator.textContent = original; }); }
  for (const item of progressElements) restores.push(remember(item, ['max', 'value', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'], ['--cinema-progress']));
  let disposed = false, state = 'static', reason = 'initial', mediaStatus = source ? 'idle' : 'missing';
  let sourceAttached = false, presented = false, displayedTime = null, pendingTime = null;
  let progress = 0, userPaused = false, focusHeld = false, visible = true;
  let frame = null, videoFrame = null, timer = null, seekTimer = null, saveTimer = null, navigationFrame = null;
  let geometry = { top: 0, height: 1, stage: 1 };
  const navigationType = win.performance?.getEntriesByType?.('navigation')?.[0]?.type;
  let restoration = null;
  if (['reload', 'back_forward'].includes(navigationType) && !win.location.hash) {
    try {
      const saved = win.history.state?.[HISTORY_KEY];
      if (saved?.href === win.location.href && saved.version === 1) restoration = saved;
    } catch { /* Browsers can restrict history access. */ }
  }
  let pendingHash = win.location.hash;
  let pendingFocus = null;
  const focusRestores = new Map();
  const policyReason = events.preferences(reconcile);

  function measure() {
    const rect = root.getBoundingClientRect();
    geometry = { top: rect.top + win.scrollY, height: rect.height, stage: stage.getBoundingClientRect().height };
    visible = rect.bottom > 0 && rect.top < win.innerHeight;
  }
  function targetIndex(hash = win.location.hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return -1; }
    const target = id && doc.getElementById(id);
    return target ? chapters.findIndex(chapter => chapter === target || chapter.contains(target)) : -1;
  }
  function staticReason() {
    return !source ? 'missing-video' : mediaStatus === 'error' ? 'media-error'
      : typeof video.requestVideoFrameCallback !== 'function' ? 'unsupported-video'
        : policyReason() || (userPaused ? 'paused' : focusHeld ? 'keyboard-focus' : null);
  }
  function clearTimer(kind) {
    const id = kind === 'readiness' ? timer : seekTimer;
    if (id !== null) win.clearTimeout(id);
    if (kind === 'readiness') timer = null; else seekTimer = null;
  }
  function publish() {
    root.dataset.cinemaState = state; root.dataset.cinemaReason = reason; root.dataset.mediaStatus = mediaStatus;
    const unavailable = Boolean(policyReason() || !source || mediaStatus === 'error' || typeof video.requestVideoFrameCallback !== 'function');
    for (const control of controls) {
      const focused = doc.activeElement === control;
      control.hidden = unavailable && !focused;
      control.disabled = unavailable && !focused;
      control.setAttribute('aria-disabled', String(unavailable));
      control.setAttribute('aria-pressed', String(userPaused || focusHeld));
      const text = unavailable ? 'Motion unavailable' : userPaused || focusHeld ? 'Enable motion' : 'Pause motion';
      control.setAttribute('aria-label', text);
      const label = control.querySelector('[data-cinema-label]') || (!control.children.length ? control : null);
      if (label) label.textContent = text;
    }
  }
  function syncActivity() {
    const active = !disposed && !doc.hidden && (visible || restoration) && !staticReason();
    seeker.setSuspended(!active || state !== 'enhanced');
    if (!active) { clearTimer('readiness'); clearTimer('seek'); return; }
    if (!presented && sourceAttached && timer === null) timer = win.setTimeout(fail, options.readinessTimeoutMs ?? 15000);
    if (pendingTime !== null && seekTimer === null) seekTimer = win.setTimeout(fail, options.seekTimeoutMs ?? 8000);
  }
  function focusHeading(index) {
    const target = chapters[index]?.querySelector('h1, h2') || chapters[index];
    if (!target) return;
    if (!focusRestores.has(target)) focusRestores.set(target, remember(target, ['tabindex']));
    target.setAttribute('tabindex', '-1');
    target.focus?.({ preventScroll: true });
  }
  function normal(why, nextState = 'static') {
    state = nextState; reason = why;
    root.classList.remove('cinema-enhanced');
    panelRestore.forEach(restore => restore());
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    video.pause(); syncActivity(); publish();
    if (pendingFocus !== null) {
      const index = pendingFocus; pendingFocus = null;
      alignAfterLayout(() => { chapters[index].scrollIntoView({ block: 'start', behavior: 'instant' }); focusHeading(index); });
    }
  }
  function alignAfterLayout(callback) {
    if (navigationFrame !== null) win.cancelAnimationFrame(navigationFrame);
    navigationFrame = win.requestAnimationFrame(() => {
      navigationFrame = win.requestAnimationFrame(() => {
        navigationFrame = null;
        if (!disposed) { callback(); measure(); schedule(); syncActivity(); }
      });
    });
  }
  function alignHash(hash) {
    const index = targetIndex(hash);
    if (index < 0) return;
    alignAfterLayout(() => {
      if (win.location.hash !== hash) return;
      if (state === 'enhanced') {
        measure();
        win.scrollTo({ top: geometry.top + cinemaChapterProgress(index, timeline) * Math.max(1, geometry.height - geometry.stage), behavior: 'instant' });
      } else chapters[index].scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function restorePosition() {
    if (pendingHash && targetIndex(pendingHash) >= 0) {
      const hash = pendingHash; pendingHash = '';
      alignHash(hash);
      return;
    }
    if (!restoration) return;
    const saved = restoration;
    alignAfterLayout(() => {
      if (restoration !== saved) return;
      restoration = null; measure();
      if (state === 'enhanced') {
        const top = saved.region === 'after' ? geometry.top + geometry.height + saved.offset
          : geometry.top + clamp(saved.progress) * Math.max(1, geometry.height - geometry.stage);
        win.scrollTo({ top, behavior: 'instant' });
      } else if (saved.region === 'cinema') {
        chapters[Math.min(3, Math.max(0, saved.index || 0))].scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
  }
  function savePosition() {
    saveTimer = null;
    if (disposed || restoration || state !== 'enhanced' || win.location.hash) return;
    try {
      const current = win.history.state;
      if (current !== null && Object.prototype.toString.call(current) !== '[object Object]') return;
      measure();
      const p = getScrollProgress(win.scrollY, geometry.top, geometry.height, geometry.stage);
      const saved = win.scrollY >= geometry.top + geometry.height
        ? { region: 'after', offset: win.scrollY - geometry.top - geometry.height }
        : { region: 'cinema', progress: p, index: activeIndex(p) };
      win.history.replaceState({ ...current, [HISTORY_KEY]: { ...saved, href: win.location.href, version: 1 } }, '');
    } catch { /* Navigation remains native if storage is unavailable. */ }
  }
  function activeIndex(p) {
    for (let i = timeline.holds.length - 1; i >= 0; i -= 1) if (p >= timeline.holds[i][0]) return i;
    return 0;
  }
  function schedule() {
    if (disposed || state !== 'enhanced' || !visible || doc.hidden || frame !== null) return;
    frame = win.requestAnimationFrame(update);
  }
  function update() {
    frame = null;
    if (disposed || state !== 'enhanced' || doc.hidden || !visible) return;
    progress = getScrollProgress(win.scrollY, geometry.top, geometry.height, geometry.stage);
    const presentations = chapters.map((_, index) => cinemaChapterPresentation(progress, index, displayedTime, video.duration, timeline));
    if (chapters.some((chapter, index) => chapter.contains(doc.activeElement) && !presentations[index].interactive)) {
      focusHeld = true;
      const focused = doc.activeElement;
      normal('keyboard-focus');
      alignAfterLayout(() => focused?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
      return;
    }
    root.style.setProperty('--cinema-progress', String(progress));
    chapters.forEach((chapter, index) => {
      const view = presentations[index];
      chapter.style.setProperty('--chapter-opacity', String(view.opacity));
      chapter.style.setProperty('--chapter-x', view.x + 'px');
      chapter.style.setProperty('--chapter-y', view.y + 'px');
      chapter.style.setProperty('--chapter-blur', view.blur + 'px');
      chapter.toggleAttribute('inert', !view.interactive);
      chapter.setAttribute('aria-hidden', String(!view.interactive));
    });
    if (pendingFocus !== null && presentations[pendingFocus]?.interactive) {
      const index = pendingFocus; pendingFocus = null; focusHeading(index);
    }
    setProgress(progressElements, progress, '--cinema-progress');
    for (const indicator of indicators) indicator.textContent = String(activeIndex(progress) + 1).padStart(2, '0');
    seeker.setTarget(cinemaVideoTime(progress, video.duration, timeline));
  }
  function armFrame() {
    if (disposed || videoFrame !== null || mediaStatus === 'error') return;
    videoFrame = video.requestVideoFrameCallback((_now, metadata) => {
      videoFrame = null;
      if (disposed) return;
      if (!Number.isFinite(metadata?.mediaTime)) { fail(); return; }
      displayedTime = metadata.mediaTime;
      if (pendingTime !== null && Math.abs(displayedTime - pendingTime) <= timeline.frameTolerance) {
        pendingTime = null; clearTimer('seek');
      }
      if (!presented) {
        presented = true; mediaStatus = 'ready'; clearTimer('readiness');
        root.classList.add('cinema-frame-ready'); reconcile();
      }
      if (pendingTime !== null) armFrame();
      schedule();
    });
  }
  function fail() {
    if (disposed) return;
    mediaStatus = 'error'; pendingTime = null;
    clearTimer('readiness'); clearTimer('seek');
    if (videoFrame !== null) video.cancelVideoFrameCallback?.(videoFrame);
    videoFrame = null; root.classList.remove('cinema-frame-ready');
    normal('media-error'); restorePosition();
  }
  const seeker = createLatestSeekController({
    readTime: () => video.currentTime,
    isReady: () => video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0,
    isSeeking: () => video.seeking,
    seek(time) { pendingTime = time; armFrame(); video.currentTime = time; syncActivity(); },
    requestFrame: callback => win.requestAnimationFrame(callback),
    cancelFrame: id => win.cancelAnimationFrame(id),
    onError: fail,
  });
  function reconcile() {
    if (disposed) return;
    measure();
    const why = staticReason();
    if (why) { normal(why); restorePosition(); return; }
    if (!sourceAttached && (visible || restoration || targetIndex() >= 0) && !doc.hidden) {
      sourceAttached = true; mediaStatus = 'loading';
      video.muted = true; video.defaultMuted = true; video.playsInline = true;
      video.autoplay = false; video.loop = false; video.preload = 'auto';
      if (!video.getAttribute('src')) video.src = source;
      armFrame(); video.load();
    }
    if (!presented) { normal(sourceAttached ? 'awaiting-frame' : 'offscreen', sourceAttached ? 'loading' : 'static'); return; }
    state = 'enhanced'; reason = 'ready';
    root.classList.add('cinema-enhanced');
    measure(); publish(); syncActivity(); schedule(); restorePosition();
  }
  function refresh() { if (!disposed) { reconcile(); measure(); schedule(); } }
  function cancelDeferred(event) {
    const scrollGesture = event && (['wheel', 'touchstart', 'pointerdown'].includes(event.type)
      || event.type === 'keydown' && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key));
    if (scrollGesture && focusRestores.has(doc.activeElement)) doc.activeElement?.blur?.();
    if (navigationFrame !== null) win.cancelAnimationFrame(navigationFrame);
    navigationFrame = null; restoration = null; pendingHash = ''; pendingFocus = null;
  }
  events.listen(win, 'scroll', () => {
    const oldVisible = visible; measure();
    if (oldVisible !== visible) reconcile();
    syncActivity(); schedule();
    if (saveTimer !== null) win.clearTimeout(saveTimer);
    saveTimer = win.setTimeout(savePosition, 150);
  }, { passive: true });
  events.listen(win, 'resize', refresh, { passive: true });
  events.listen(win, 'orientationchange', refresh, { passive: true });
  events.listen(win, 'pagehide', savePosition);
  events.listen(win, 'pageshow', event => { if (!event.persisted) pendingHash = win.location.hash; refresh(); });
  events.listen(win, 'hashchange', () => { restoration = null; pendingHash = win.location.hash; reconcile(); });
  events.listen(doc, 'click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target?.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self') return;
    let destination;
    try { destination = new URL(link.getAttribute('href'), win.location.href); } catch { return; }
    if (destination.origin !== win.location.origin || destination.pathname !== win.location.pathname || destination.search !== win.location.search || targetIndex(destination.hash) < 0) return;
    if (state !== 'enhanced') return;
    event.preventDefault();
    cancelDeferred();
    // Intentional chapter navigation owns focus until the destination settles.
    // Release only the outgoing chapter link, then focus the real heading once
    // its displayed frame and overlay are safe. New gestures cancel this handoff.
    if (chapters.some(chapter => chapter.contains(doc.activeElement))) doc.activeElement?.blur?.();
    pendingFocus = targetIndex(destination.hash);
    if (win.location.hash !== destination.hash) win.history.pushState(win.history.state, '', destination.hash);
    alignHash(destination.hash);
  });
  for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown']) events.listen(win, name, cancelDeferred, { passive: true });
  events.listen(doc, 'visibilitychange', () => {
    if (doc.hidden) { if (frame !== null) win.cancelAnimationFrame(frame); frame = null; syncActivity(); }
    else refresh();
  });
  events.listen(video, 'error', fail);
  events.listen(video, 'loadedmetadata', () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) fail(); else seeker.wake();
  });
  for (const name of ['loadeddata', 'canplay']) events.listen(video, name, () => { if (!staticReason()) armFrame(); seeker.wake(); });
  events.listen(video, 'seeked', () => { seeker.onSeeked(); if (pendingTime !== null) armFrame(); syncActivity(); });
  for (const control of controls) {
    events.listen(control, 'click', () => {
      if (control.getAttribute('aria-disabled') === 'true') return;
      userPaused = focusHeld ? false : !userPaused; focusHeld = false;
      reconcile();
    });
    events.listen(control, 'blur', () => Promise.resolve().then(() => { if (!disposed) publish(); }));
  }
  let observer;
  if (typeof win.ResizeObserver === 'function') {
    observer = new win.ResizeObserver(() => { measure(); schedule(); });
    observer.observe(root); observer.observe(stage);
  }
  doc.fonts?.ready?.then(() => { if (!disposed) refresh(); });
  reconcile();
  return {
    refresh,
    getState: () => ({ state, reason, mediaStatus, progress, displayedTime, targetTime: seeker.getState().targetTime, pendingTime }),
    destroy() {
      if (disposed) return;
      disposed = true; events.cleanup(); observer?.disconnect(); seeker.destroy();
      if (frame !== null) win.cancelAnimationFrame(frame);
      if (videoFrame !== null) video.cancelVideoFrameCallback?.(videoFrame);
      cancelDeferred(); clearTimer('readiness'); clearTimer('seek');
      if (saveTimer !== null) win.clearTimeout(saveTimer);
      video.pause(); panelRestore.forEach(restore => restore()); focusRestores.forEach(restore => restore()); restores.reverse().forEach(restore => restore());
      video.muted = originalMuted; root.classList.remove('cinema-enhanced', 'cinema-frame-ready');
      if (sourceAttached && !video.getAttribute('src')) video.load();
    },
  };
}

export function initHorizontal(root) {
  const stage = root?.querySelector('[data-horizontal-stage]');
  const track = root?.querySelector('[data-horizontal-track]');
  const panels = [...(root?.querySelectorAll('[data-horizontal-panel]') || [])];
  if (!root || !stage || !track || panels.length < 2) return empty('missing-markup');
  const doc = root.ownerDocument, win = doc.defaultView;
  const events = lifecycle(win);
  const policyReason = events.preferences(reconcile);
  const progressElements = [...root.querySelectorAll('[data-horizontal-progress]')];
  const indicators = [...root.querySelectorAll('[data-horizontal-index]')];
  const restores = [remember(root, ['data-horizontal-state', 'data-horizontal-reason'], ['--horizontal-height', '--horizontal-travel']),
    remember(track, [], ['--horizontal-x'])];
  for (const item of progressElements) restores.push(remember(item, ['max', 'value', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'], ['--horizontal-progress']));
  for (const item of indicators) { const text = item.textContent; restores.push(() => { item.textContent = text; }); }
  let disposed = false, enhanced = false, focusHeld = false, frame = null;
  let progress = 0, travel = 0, top = 0, stageHeight = 0, reason = 'initial';
  function measure() {
    const rect = root.getBoundingClientRect();
    top = rect.top + win.scrollY; stageHeight = stage.getBoundingClientRect().height;
    travel = Math.max(0, track.scrollWidth - stage.clientWidth);
    root.style.setProperty('--horizontal-travel', travel + 'px');
    root.style.setProperty('--horizontal-height', stageHeight + travel + 'px');
  }
  function render() {
    frame = null;
    if (!enhanced || disposed || doc.hidden) return;
    progress = clamp((win.scrollY - top) / Math.max(1, travel));
    const view = horizontalPresentation(progress, track.scrollWidth, stage.clientWidth, panels.length);
    track.style.setProperty('--horizontal-x', view.x + 'px');
    setProgress(progressElements, progress, '--horizontal-progress');
    for (const indicator of indicators) indicator.textContent = String(view.index + 1).padStart(2, '0');
  }
  function schedule() {
    if (disposed || !enhanced || doc.hidden || frame !== null) return;
    const rect = root.getBoundingClientRect();
    top = rect.top + win.scrollY;
    if (rect.bottom < 0 || rect.top > win.innerHeight) return;
    frame = win.requestAnimationFrame(render);
  }
  function normal(why) {
    enhanced = false; reason = why;
    root.classList.remove('horizontal-enhanced');
    track.style.removeProperty('--horizontal-x');
    root.style.removeProperty('--horizontal-height');
    root.style.removeProperty('--horizontal-travel');
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
  }
  function reconcile() {
    if (disposed) return;
    const why = policyReason() || (focusHeld ? 'keyboard-focus' : null);
    if (why) normal(why);
    else {
      root.classList.add('horizontal-enhanced'); measure();
      if (travel < 1) normal('no-overflow');
      else { enhanced = true; reason = 'ready'; render(); }
    }
    root.dataset.horizontalState = enhanced ? 'enhanced' : 'static';
    root.dataset.horizontalReason = reason;
  }
  events.listen(win, 'scroll', schedule, { passive: true });
  events.listen(win, 'resize', reconcile, { passive: true });
  events.listen(win, 'pageshow', reconcile);
  events.listen(doc, 'visibilitychange', () => {
    if (doc.hidden && frame !== null) { win.cancelAnimationFrame(frame); frame = null; }
    else if (!doc.hidden) reconcile();
  });
  // Native Tab order is preserved. If focus reaches a clipped project, restore
  // the complete vertical document instead of moving or trapping keyboard focus.
  events.listen(root, 'focusin', event => {
    if (!enhanced) return;
    const panel = panels.find(item => item.contains(event.target));
    if (!panel) return;
    const bounds = panel.getBoundingClientRect(), viewport = stage.getBoundingClientRect();
    if (bounds.left < viewport.left - 1 || bounds.right > viewport.right + 1) {
      focusHeld = true; reconcile();
      event.target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
  });
  let observer;
  if (typeof win.ResizeObserver === 'function') {
    observer = new win.ResizeObserver(() => { if (enhanced) { measure(); schedule(); } });
    observer.observe(stage); observer.observe(track);
  }
  doc.fonts?.ready?.then(() => { if (!disposed) reconcile(); });
  reconcile();
  return {
    refresh: reconcile,
    getState: () => ({ state: enhanced ? 'enhanced' : 'static', reason, progress, travel }),
    destroy() {
      if (disposed) return;
      disposed = true; events.cleanup(); observer?.disconnect();
      if (frame !== null) win.cancelAnimationFrame(frame);
      root.classList.remove('horizontal-enhanced');
      restores.reverse().forEach(restore => restore());
    },
  };
}
