import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getScrollProgress,
  progressToVideoTime,
  chapterPresentation,
  chapterAtPresentedFrame,
  createLatestSeekController,
  initJourney,
} from '../src/scripts/journey.mjs';

test('native scroll positions clamp and use measured sticky travel', () => {
  assert.equal(getScrollProgress(400, 500, 3000, 1000), 0);
  assert.equal(getScrollProgress(1500, 500, 3000, 1000), 0.5);
  assert.equal(getScrollProgress(2500, 500, 3000, 1000), 1);
  assert.equal(getScrollProgress(9000, 500, 3000, 1000), 1);
  assert.equal(getScrollProgress(100, 100, 500, 500), 0);
  assert.equal(getScrollProgress(NaN, 0, 1000, 500), 0);
});

test('opening and ending reading holds do not advance the camera', () => {
  for (const p of [0, 0.05, 0.1, 0.18]) assert.equal(progressToVideoTime(p, 8), 0);
  for (const p of [0.68, 0.8, 0.95, 1]) assert.equal(progressToVideoTime(p, 8), 7.9);
  assert.ok(Math.abs(progressToVideoTime(0.43, 8) - 3.95) < 1e-10);
});

test('reversing direction reproduces identical time and UI, without hysteresis', () => {
  const positions = Array.from({ length: 101 }, (_, index) => index / 100);
  const sample = (p) => ({ time: progressToVideoTime(p, 8), ui: [chapterPresentation(p, 0), chapterPresentation(p, 1)] });
  const forward = positions.map(sample);
  const reverse = [...positions].reverse().map(sample).reverse();
  assert.deepEqual(reverse, forward);
  for (let i = 1; i < forward.length; i += 1) assert.ok(forward[i].time >= forward[i - 1].time);
});

test('invalid or short metadata never produces an invalid seek or the end boundary', () => {
  for (const duration of [0, -3, NaN, Infinity]) assert.equal(progressToVideoTime(1, duration), 0);
  assert.ok(progressToVideoTime(1, 5) < 5);
  assert.equal(progressToVideoTime(1, 0.01), 0);
  assert.equal(progressToVideoTime(-10, 8), 0);
  assert.equal(progressToVideoTime(10, 8), 7.9);
});

test('chapters settle for reading and the second waits for its safe area', () => {
  assert.deepEqual(chapterPresentation(0.14, 0), { opacity: 1, translateY: -0, visible: true });
  assert.equal(chapterPresentation(0.18, 0).visible, false);
  assert.equal(chapterPresentation(0.68, 1).visible, false);
  assert.deepEqual(chapterPresentation(0.72, 1), { opacity: 1, translateY: 0, visible: true });
  assert.deepEqual(chapterPresentation(1, 1), chapterPresentation(0.72, 1));
});

test('a fast jump cannot reveal final copy before its safe camera frame is displayed', () => {
  assert.equal(chapterAtPresentedFrame(1, 1, 0, 8).visible, false);
  assert.equal(chapterAtPresentedFrame(1, 1, 5, 8).visible, false);
  assert.equal(chapterAtPresentedFrame(1, 1, 7.9, 8).opacity, 1);
  assert.equal(chapterAtPresentedFrame(1, 1, null, 8).visible, false);
});

test('fast reversal keeps opening copy hidden until the opening frame is presented', () => {
  assert.equal(chapterAtPresentedFrame(0, 0, 7.9, 8).visible, false);
  assert.equal(chapterAtPresentedFrame(0, 0, 2, 8).visible, false);
  assert.equal(chapterAtPresentedFrame(0, 0, 0, 8).opacity, 1);
});

function seekHarness() {
  let clock = 0;
  let time = 0;
  let ready = true;
  let mediaSeeking = false;
  let throwOnSeek = false;
  const queued = new Map();
  const seeks = [];
  const errors = [];
  const controller = createLatestSeekController({
    readTime: () => time,
    isReady: () => ready,
    isSeeking: () => mediaSeeking,
    seek: (target) => {
      if (throwOnSeek) throw new Error('Decoder unavailable');
      seeks.push(target);
      mediaSeeking = true;
    },
    requestFrame: (callback) => { clock += 1; queued.set(clock, callback); return clock; },
    cancelFrame: (id) => queued.delete(id),
    onError: (error) => errors.push(error),
  });
  return {
    controller, seeks, errors,
    get queued() { return queued.size; },
    setReady(value) { ready = value; },
    throwOnSeek() { throwOnSeek = true; },
    flush() {
      const current = [...queued.values()];
      queued.clear();
      for (const callback of current) callback();
    },
    complete(target = seeks.at(-1)) {
      time = target;
      mediaSeeking = false;
      controller.onSeeked();
    },
  };
}

test('rapid inputs coalesce to the newest target, with only one seek in flight', () => {
  const h = seekHarness();
  h.controller.setSuspended(false);
  h.controller.setTarget(1);
  h.controller.setTarget(2);
  h.controller.setTarget(3);
  assert.equal(h.queued, 1);
  h.flush();
  assert.deepEqual(h.seeks, [3]);
  h.controller.setTarget(5);
  h.controller.setTarget(7);
  h.flush();
  assert.deepEqual(h.seeks, [3]);
  assert.equal(h.queued, 0);
  h.complete(3);
  h.flush();
  assert.deepEqual(h.seeks, [3, 7]);
  h.complete(7);
  h.flush();
  assert.equal(h.queued, 0);
});

test('reverse direction during an in-flight seek drops the obsolete destination', () => {
  const h = seekHarness();
  h.controller.setSuspended(false);
  h.controller.setTarget(6);
  h.flush();
  h.controller.setTarget(7);
  h.controller.setTarget(2);
  h.complete(6);
  h.flush();
  assert.deepEqual(h.seeks, [6, 2]);
});

test('metadata gating waits for an event rather than running a polling loop', () => {
  const h = seekHarness();
  h.setReady(false);
  h.controller.setSuspended(false);
  h.controller.setTarget(4);
  h.flush();
  assert.deepEqual(h.seeks, []);
  assert.equal(h.queued, 0);
  h.setReady(true);
  h.controller.wake();
  h.flush();
  assert.deepEqual(h.seeks, [4]);
});

test('offscreen and hidden suspension cancels pending work and resumes at latest time', () => {
  const h = seekHarness();
  h.controller.setSuspended(false);
  h.controller.setTarget(1);
  h.controller.setSuspended(true);
  h.controller.setTarget(5);
  assert.equal(h.queued, 0);
  assert.deepEqual(h.seeks, []);
  h.controller.setSuspended(false);
  h.flush();
  assert.deepEqual(h.seeks, [5]);
});

test('frame tolerance stops redundant seeks after settling', () => {
  const h = seekHarness();
  h.controller.setSuspended(false);
  h.controller.setTarget(0.01);
  h.flush();
  assert.deepEqual(h.seeks, []);
  assert.equal(h.queued, 0);
});

test('a seek exception suspends work and reports failure once', () => {
  const h = seekHarness();
  h.throwOnSeek();
  h.controller.setSuspended(false);
  h.controller.setTarget(3);
  h.flush();
  assert.equal(h.errors.length, 1);
  assert.equal(h.controller.getState().suspended, true);
  h.controller.setTarget(4);
  assert.equal(h.queued, 0);
});

test('destroy cancels scheduled work and ignores subsequent media and scroll events', () => {
  const h = seekHarness();
  h.controller.setSuspended(false);
  h.controller.setTarget(3);
  h.controller.destroy();
  assert.equal(h.queued, 0);
  h.controller.setTarget(7);
  h.controller.onSeeked();
  h.controller.setSuspended(false);
  h.controller.wake();
  h.flush();
  assert.deepEqual(h.seeks, []);
  assert.equal(h.controller.getState().disposed, true);
});

test('missing markup is a safe static lifecycle handle', () => {
  const journey = initJourney(null);
  assert.equal(journey.getState().state, 'static');
  assert.equal(journey.getState().mediaStatus, 'missing');
  journey.destroy();
  journey.destroy();
});

// These event/DOM doubles exercise lifecycle decisions, not browser rendering.
// A real browser remains necessary to verify frame delivery and visual motion.
function lifecycleHarness({ source = true, reduced = false, narrow = false, short = false, compact = false, frameAPI = true,
  navigationType = 'navigate', historyState = null, historyWriteThrows = false, scrollEndSupported = true } = {}) {
  class Element extends EventTarget {
    constructor(tagName = 'DIV') {
      super();
      this.tagName = tagName;
      this.attrs = new Map();
      this.dataset = {};
      this.children = [];
      this.textContent = '';
      this.queries = new Map();
      const styles = new Map();
      this.style = {
        setProperty: (name, value) => styles.set(name, value),
        getPropertyValue: (name) => styles.get(name) || '',
        getPropertyPriority: () => '',
        removeProperty: (name) => styles.delete(name),
      };
      const classes = new Set();
      this.classList = {
        contains: (name) => classes.has(name),
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
      };
    }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    hasAttribute(name) { return this.attrs.has(name); }
    setAttribute(name, value) { this.attrs.set(name, String(value)); }
    removeAttribute(name) { this.attrs.delete(name); }
    toggleAttribute(name, force) { if (force) this.setAttribute(name, ''); else this.removeAttribute(name); }
    querySelector(selector) { return this.queries.get(selector) ?? null; }
    querySelectorAll(selector) { return this.queries.get(selector) ?? []; }
    closest(selector) { return selector === 'a[href]' && this.tagName === 'A' && this.hasAttribute('href') ? this : null; }
    contains(target) { return this === target || this.children.some((child) => child.contains(target)); }
    get hidden() { return this.attrs.has('hidden'); }
    set hidden(value) { this.toggleAttribute('hidden', value); }
    get disabled() { return this.attrs.has('disabled'); }
    set disabled(value) { this.toggleAttribute('disabled', value); }
  }
  const win = new EventTarget();
  const doc = new EventTarget();
  win.scrollY = 0;
  win.innerHeight = 900;
  win.location = new URL('https://nu-labs.test/');
  if (scrollEndSupported) win.onscrollend = null;
  const historyWrites = [];
  const scrollWrites = [];
  win.performance = { getEntriesByType: () => [{ type: navigationType }] };
  win.history = { state: historyState, replaceState(state) {
    if (historyWriteThrows) throw new Error('History access denied');
    this.state = state; historyWrites.push(state);
  } };
  win.scrollTo = options => { scrollWrites.push(options); win.scrollY = options.top; };
  doc.hidden = false;
  doc.activeElement = null;
  doc.defaultView = win;
  const ids = new Map();
  doc.getElementById = (id) => ids.get(id) || null;
  const frames = new Map();
  const timers = new Map();
  let nextId = 0;
  win.requestAnimationFrame = (callback) => { nextId += 1; frames.set(nextId, callback); return nextId; };
  win.cancelAnimationFrame = (id) => frames.delete(id);
  win.setTimeout = (callback) => { nextId += 1; timers.set(nextId, callback); return nextId; };
  win.clearTimeout = (id) => timers.delete(id);
  const queries = new Map();
  for (const [query, matches] of [
    ['(prefers-reduced-motion: reduce)', reduced],
    ['(max-width: 767px)', narrow],
    ['(max-height: 600px)', short],
    ['(max-aspect-ratio: 5/4)', compact],
  ]) {
    const target = new EventTarget();
    target.matches = matches;
    queries.set(query, target);
  }
  win.matchMedia = (query) => queries.get(query);
  const root = new Element();
  const stage = new Element();
  const video = new Element('VIDEO');
  const control = new Element('BUTTON');
  control.textContent = 'Motion';
  control.hidden = true;
  const chapters = [new Element('ARTICLE'), new Element('ARTICLE')];
  const anchorScrolls = [];
  chapters.forEach((chapter, index) => { chapter.dataset.chapter = String(index); });
  ids.set('shape', chapters[1]);
  chapters.forEach((chapter, index) => {
    chapter.scrollIntoView = (options) => {
      anchorScrolls.push({ index, options, enhanced: root.classList.contains('journey-enhanced'), hidden: chapter.hidden });
      win.scrollY = index === 1 ? 900 : 0;
    };
  });
  root.ownerDocument = doc;
  root.children = [stage, ...chapters];
  root.queries.set('[data-journey-stage]', stage);
  root.queries.set('[data-journey-video]', video);
  root.queries.set('[data-chapter]', chapters);
  root.queries.set('[data-journey-progress]', []);
  doc.querySelectorAll = () => [control];
  root.getBoundingClientRect = () => {
    const height = root.classList.contains('journey-enhanced') ? 3000 : 1600;
    return { top: -win.scrollY, bottom: height - win.scrollY, height };
  };
  stage.getBoundingClientRect = () => ({ height: 900 });
  if (source) video.setAttribute('data-src', '/assets/journey.mp4');
  for (const name of ['src', 'preload']) {
    Object.defineProperty(video, name, {
      get: () => video.getAttribute(name) || '',
      set: (value) => video.setAttribute(name, value),
    });
  }
  for (const [property, attribute] of [['autoplay', 'autoplay'], ['loop', 'loop'], ['defaultMuted', 'muted'], ['playsInline', 'playsinline']]) {
    Object.defineProperty(video, property, {
      get: () => video.attrs.has(attribute),
      set: (value) => video.toggleAttribute(attribute, value),
    });
  }
  video.muted = false;
  video.currentTime = 0;
  video.readyState = 0;
  video.duration = NaN;
  video.seeking = false;
  video.loadCalls = 0;
  video.load = () => { video.loadCalls += 1; };
  video.pause = () => {};
  const presentations = new Map();
  if (frameAPI) {
    video.requestVideoFrameCallback = (callback) => { nextId += 1; presentations.set(nextId, callback); return nextId; };
    video.cancelVideoFrameCallback = (id) => presentations.delete(id);
  }
  return {
    root, video, control, chapters, win, doc, anchorScrolls, historyWrites, scrollWrites,
    clickAnchor(href, options = {}) {
      const link = new Element('A'); link.setAttribute('href', href);
      const event = new Event('click', { cancelable: true });
      Object.defineProperties(event, { target: { value: link }, button: { value: options.button ?? 0 },
        ctrlKey: { value: options.ctrlKey || false } });
      if (options.prevented) event.preventDefault();
      doc.dispatchEvent(event);
      return event;
    },
    get pendingTimers() { return timers.size; },
    get pendingFrames() { return frames.size + presentations.size; },
    preference(query, matches) {
      queries.get(query).matches = matches;
      queries.get(query).dispatchEvent(new Event('change'));
    },
    metadata() {
      video.readyState = 2;
      video.duration = 8;
      video.dispatchEvent(new Event('loadedmetadata'));
      video.dispatchEvent(new Event('loadeddata'));
    },
    present(time = 0) {
      const callbacks = [...presentations.values()];
      presentations.clear();
      for (const callback of callbacks) callback(0, { mediaTime: time });
    },
    flushFrames() {
      for (let round = 0; frames.size && round < 10; round += 1) {
        const callbacks = [...frames.values()];
        frames.clear();
        for (const callback of callbacks) callback();
      }
      assert.equal(frames.size, 0, 'the runtime must settle without an animation loop');
    },
    fireTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      for (const callback of callbacks) callback();
    },
  };
}

test('normal-flow fallbacks make no video request and preserve every chapter', () => {
  for (const options of [{ source: false }, { frameAPI: false }, { reduced: true }, { narrow: true }, { short: true }, { compact: true }]) {
    const h = lifecycleHarness(options);
    const journey = initJourney(h.root);
    assert.equal(journey.getState().state, 'static');
    assert.equal(h.video.loadCalls, 0);
    assert.equal(h.root.classList.contains('journey-enhanced'), false);
    assert.equal(h.chapters.some((chapter) => chapter.hidden), false);
    assert.equal(h.control.hidden, true);
    journey.destroy();
  }
});

test('decoded data alone does not pin: only a presented-frame callback enables the journey', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.flushFrames();
  assert.equal(journey.getState().state, 'loading');
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.root.classList.contains('journey-frame-ready'), false);
  h.present();
  h.flushFrames();
  assert.equal(journey.getState().state, 'enhanced');
  assert.equal(journey.getState().displayedTime, 0);
  assert.equal(h.root.classList.contains('journey-frame-ready'), true);
  assert.equal(h.control.hidden, false);
  assert.equal(h.chapters[1].hidden, true);
  journey.destroy();
});

test('readiness deadlines pause in a hidden tab and resume without permanent rejection', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  assert.equal(h.pendingTimers, 1);
  h.doc.hidden = true;
  h.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.pendingTimers, 0);
  h.fireTimers();
  assert.equal(journey.getState().mediaStatus, 'loading');
  h.doc.hidden = false;
  h.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.pendingTimers, 1);
  h.metadata();
  h.present();
  assert.equal(journey.getState().state, 'enhanced');
  assert.equal(h.pendingTimers, 0);
  journey.destroy();
});

test('offscreen and live reduced-motion changes suspend presentation deadlines', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.win.scrollY = 5000;
  h.win.dispatchEvent(new Event('scroll'));
  assert.equal(h.pendingTimers, 0);
  h.win.scrollY = 0;
  h.win.dispatchEvent(new Event('scroll'));
  assert.equal(h.pendingTimers, 1);
  h.preference('(prefers-reduced-motion: reduce)', true);
  assert.equal(h.pendingTimers, 0);
  assert.equal(journey.getState().reason, 'reduced-motion');
  h.preference('(prefers-reduced-motion: reduce)', false);
  assert.equal(h.pendingTimers, 1);
  journey.destroy();
});

test('live motion-off and media failure restore all content without shifting focus', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.present();
  h.flushFrames();
  h.doc.activeElement = h.control;
  h.control.dispatchEvent(new Event('click'));
  assert.equal(journey.getState().reason, 'paused');
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.chapters.some((chapter) => chapter.hidden), false);
  assert.equal(h.doc.activeElement, h.control);
  assert.equal(h.control.textContent, 'Enable motion');
  h.control.dispatchEvent(new Event('click'));
  h.flushFrames();
  h.video.dispatchEvent(new Event('error'));
  assert.equal(journey.getState().mediaStatus, 'error');
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.chapters.some((chapter) => chapter.hidden), false);
  journey.destroy();
});

test('destroy restores original markup, live mute state, controls and all pending work', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  assert.equal(h.video.muted, true);
  assert.equal(h.control.hidden, false);
  journey.destroy();
  assert.equal(h.video.muted, false);
  assert.equal(h.video.getAttribute('src'), null);
  assert.equal(h.control.hidden, true);
  assert.equal(h.control.textContent, 'Motion');
  assert.equal(h.pendingTimers, 0);
  assert.equal(h.pendingFrames, 0);
  const state = journey.getState();
  h.video.dispatchEvent(new Event('error'));
  h.preference('(prefers-reduced-motion: reduce)', true);
  assert.deepEqual(journey.getState(), state);
});

test('portrait tablet ratio disables enhancement and restores readable normal flow live', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.present();
  h.flushFrames();
  assert.equal(journey.getState().state, 'enhanced');
  h.preference('(max-aspect-ratio: 5/4)', true);
  assert.equal(journey.getState().reason, 'compact-aspect');
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.chapters.some((chapter) => chapter.hidden), false);
  assert.equal(h.control.hidden, true);
  journey.destroy();
});

test('seeked without a matching presented frame cannot leave the journey empty indefinitely', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.present();
  h.flushFrames();
  h.win.scrollY = 2000;
  h.win.dispatchEvent(new Event('scroll'));
  h.flushFrames();
  assert.equal(journey.getState().targetTime, 7.9);
  h.video.dispatchEvent(new Event('seeked'));
  h.flushFrames();
  assert.equal(h.pendingTimers, 1, 'presentation must still have a bounded deadline');
  assert.equal(h.chapters[1].hidden, true);
  h.fireTimers();
  assert.equal(journey.getState().mediaStatus, 'error');
  assert.equal(h.chapters.some((chapter) => chapter.hidden), false);
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  journey.destroy();
});

test('stale frame callbacks keep waiting for the latest actual composition', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.present();
  h.flushFrames();
  h.win.scrollY = 2000;
  h.win.dispatchEvent(new Event('scroll'));
  h.flushFrames();
  h.video.dispatchEvent(new Event('seeked'));
  h.present(2);
  h.flushFrames();
  assert.equal(h.chapters[1].hidden, true);
  assert.equal(journey.getState().pendingPresentationTime, 7.9);
  h.present(7.9);
  h.flushFrames();
  assert.equal(journey.getState().pendingPresentationTime, null);
  assert.equal(h.chapters[1].hidden, false);
  assert.equal(h.pendingTimers, 0);
  journey.destroy();
});

test('barely visible panels cannot receive Tab focus during a settled partial fade', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.present();
  h.flushFrames();
  h.win.scrollY = 2100 * 0.6801;
  h.win.dispatchEvent(new Event('scroll'));
  h.flushFrames();
  h.video.dispatchEvent(new Event('seeked'));
  h.present(7.9);
  h.flushFrames();
  assert.equal(h.chapters[1].hidden, false, 'the panel may be visually fading in');
  assert.notEqual(h.chapters[1].getAttribute('inert'), null, 'it is not yet an interactive reading state');
  assert.equal(h.chapters[1].getAttribute('aria-hidden'), 'true');
  h.win.scrollY = 2100 * 0.73;
  h.win.dispatchEvent(new Event('scroll'));
  h.flushFrames();
  assert.equal(h.chapters[1].getAttribute('inert'), null);
  assert.equal(h.chapters[1].getAttribute('aria-hidden'), 'false');
  journey.destroy();
});

test('a live failure preserves the focused motion control until the user leaves it', async () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata();
  h.present();
  h.flushFrames();
  h.doc.activeElement = h.control;
  h.video.dispatchEvent(new Event('error'));
  assert.equal(h.doc.activeElement, h.control);
  assert.equal(h.control.hidden, false);
  assert.equal(h.control.disabled, false);
  assert.equal(h.control.getAttribute('aria-disabled'), 'true');
  h.control.dispatchEvent(new Event('click'));
  assert.equal(h.control.getAttribute('aria-pressed'), 'false', 'unavailable activation is ignored');
  h.doc.activeElement = null;
  h.control.dispatchEvent(new Event('blur'));
  await Promise.resolve();
  assert.equal(h.control.hidden, true);
  assert.equal(h.control.disabled, true);
  journey.destroy();
});

test('a native chapter link aligns the restored flow after layout, without rewriting URL or focus', () => {
  const h = lifecycleHarness();
  const journey = initJourney(h.root);
  h.metadata(); h.present(); h.flushFrames();
  h.doc.activeElement = h.control;
  const activation = h.clickAnchor('#shape');
  assert.equal(activation.defaultPrevented, false, 'the browser must retain native link handling');
  assert.equal(h.win.location.hash, '', 'the runtime must not write history or the fragment');
  assert.equal(h.root.classList.contains('journey-enhanced'), false);
  assert.equal(h.anchorScrolls.length, 0, 'alignment must wait until restored layout is available');
  h.win.location.hash = '#shape'; // The browser performs its native default action.
  h.win.dispatchEvent(new Event('hashchange'));
  h.win.scrollY = 49; // Reproduce the observed stale pinned-anchor position.
  h.flushFrames();
  assert.deepEqual(h.anchorScrolls, [{ index: 1, enhanced: false, hidden: false,
    options: { block: 'start', inline: 'nearest', behavior: 'instant' } }]);
  assert.equal(h.win.scrollY, 900, 'alignment uses the normal-flow destination');
  assert.equal(h.doc.activeElement, h.control, 'native focus must remain untouched');
  assert.equal(h.win.location.hash, '#shape');
  journey.destroy();
});

test('reactivating the same hash works even when the browser emits no hashchange', () => {
  const h = lifecycleHarness(); h.win.location.hash = '#shape';
  const journey = initJourney(h.root); h.flushFrames();
  h.anchorScrolls.length = 0; h.win.scrollY = 0;
  h.clickAnchor('#shape'); h.flushFrames();
  assert.equal(h.anchorScrolls.length, 1);
  assert.equal(h.win.scrollY, 900);
  journey.destroy();
});

test('direct chapter entry and pageshow restoration realign the readable static chapter', () => {
  const h = lifecycleHarness(); h.win.location.hash = '#shape';
  const journey = initJourney(h.root);
  assert.equal(journey.getState().reason, 'chapter-anchor');
  assert.equal(h.video.loadCalls, 0, 'direct chapter navigation does not load a motion sequence');
  h.flushFrames(); assert.equal(h.anchorScrolls.length, 1);
  h.win.scrollY = 49; h.win.dispatchEvent(new Event('pageshow'));
  h.flushFrames(); assert.equal(h.anchorScrolls.length, 2);
  assert.equal(h.win.scrollY, 900);
  journey.destroy();
});

test('deferred chapter alignment yields to a new hash, user gesture or teardown', () => {
  for (const interrupt of ['hash', 'wheel', 'destroy']) {
    const h = lifecycleHarness(); h.win.location.hash = '#shape';
    const journey = initJourney(h.root);
    if (interrupt === 'hash') { h.win.location.hash = '#built'; h.win.dispatchEvent(new Event('hashchange')); }
    if (interrupt === 'wheel') h.win.dispatchEvent(new Event('wheel'));
    if (interrupt === 'destroy') journey.destroy();
    h.flushFrames(); assert.equal(h.anchorScrolls.length, 0, `${interrupt} must cancel the stale correction`);
    journey.destroy();
  }
});

test('modified, cancelled and unrelated links keep their ordinary navigation behavior', () => {
  const h = lifecycleHarness(); const journey = initJourney(h.root);
  h.metadata(); h.present(); h.flushFrames();
  for (const [href, options] of [['#shape', { ctrlKey: true }], ['#shape', { prevented: true }],
    ['/services/#shape', {}], ['https://elsewhere.test/#shape', {}], ['#built', {}]]) {
    h.clickAnchor(href, options); h.flushFrames();
    assert.equal(journey.getState().state, 'enhanced');
    assert.equal(h.anchorScrolls.length, 0);
  }
  journey.destroy();
});

const savedJourney = { version: 1, href: 'https://nu-labs.test/', progress: 0.82 };

test('pagehide saves active progress once and preserves existing history state', () => {
  const h = lifecycleHarness({ historyState: { applicationState: 'preserve me' } });
  const journey = initJourney(h.root); h.metadata(); h.present(); h.flushFrames();
  h.win.scrollY = 1722; h.win.dispatchEvent(new Event('scroll')); h.flushFrames();
  assert.equal(h.historyWrites.length, 0, 'scroll events must not write history continuously');
  h.win.dispatchEvent(new Event('pagehide'));
  assert.equal(h.historyWrites.length, 1);
  assert.equal(h.win.history.state.applicationState, 'preserve me');
  assert.ok(Math.abs(h.win.history.state.__nuLabsJourney.progress - 0.82) < 1e-12);
  h.win.scrollY = 5000; h.win.dispatchEvent(new Event('pagehide'));
  assert.equal(h.win.history.state.__nuLabsJourney, undefined, 'leaving below the journey clears a stale pin position');
  assert.equal(h.win.history.state.applicationState, 'preserve me');
  journey.destroy();
});

test('reload and history return recover progress even when the temporary static wrapper is offscreen', () => {
  for (const navigationType of ['reload', 'back_forward']) {
    const h = lifecycleHarness({ navigationType, historyState: { __nuLabsJourney: savedJourney } });
    h.win.scrollY = 1722; // Static wrapper ends at1600; enhanced wrapper reaches3000.
    const journey = initJourney(h.root);
    assert.equal(h.video.loadCalls, 1, `${navigationType} must load despite the temporary offscreen layout`);
    assert.equal(h.pendingTimers, 1, 'offscreen restoration still has a bounded media deadline');
    h.win.dispatchEvent(new Event('scrollend'));
    assert.deepEqual(h.win.history.state.__nuLabsJourney, savedJourney, 'temporary layout must not erase saved intent');
    h.metadata(); h.present(); h.flushFrames();
    assert.equal(journey.getState().state, 'enhanced');
    assert.equal(h.scrollWrites.length, 1);
    assert.ok(Math.abs(h.win.scrollY - 1722) < 1e-9);
    assert.equal(journey.getState().targetTime, 7.9);
    assert.equal(h.win.location.href, 'https://nu-labs.test/');
    journey.destroy();
  }
});

test('motion-unavailable restoration preserves the reading chapter in normal flow', () => {
  for (const failure of ['reduced', 'media']) {
    const h = lifecycleHarness({ reduced: failure === 'reduced', navigationType: 'reload',
      historyState: { __nuLabsJourney: savedJourney } });
    h.win.scrollY = 1722; const journey = initJourney(h.root);
    if (failure === 'media') h.video.dispatchEvent(new Event('error'));
    h.flushFrames();
    assert.equal(journey.getState().state, 'static');
    assert.equal(h.anchorScrolls.at(-1).index, 1);
    assert.equal(h.anchorScrolls.at(-1).enhanced, false);
    assert.equal(h.chapters.some(chapter => chapter.hidden), false);
    assert.equal(h.scrollWrites.length, 0);
    journey.destroy();
  }
});

test('fresh navigation and stale URL records cannot force an offscreen restoration', () => {
  for (const options of [
    { navigationType: 'navigate', historyState: { __nuLabsJourney: savedJourney } },
    { navigationType: 'reload', historyState: { __nuLabsJourney: { ...savedJourney, href: 'https://nu-labs.test/other/' } } },
    { navigationType: 'reload', historyState: { __nuLabsJourney: { ...savedJourney, progress: 9 } } },
  ]) {
    const h = lifecycleHarness(options); h.win.scrollY = 1722;
    const journey = initJourney(h.root); h.flushFrames();
    assert.equal(h.video.loadCalls, 0);
    assert.equal(h.scrollWrites.length, 0);
    assert.equal(h.anchorScrolls.length, 0);
    journey.destroy();
  }
});

test('new user input cancels pending history restoration without moving their viewport', () => {
  const h = lifecycleHarness({ navigationType: 'reload', historyState: { __nuLabsJourney: savedJourney } });
  h.win.scrollY = 1722; const journey = initJourney(h.root);
  h.win.dispatchEvent(new Event('wheel')); h.win.scrollY = 1900;
  h.metadata(); h.present(); h.flushFrames();
  assert.equal(h.scrollWrites.length, 0);
  assert.equal(h.anchorScrolls.length, 0);
  assert.equal(h.win.scrollY, 1900);
  journey.destroy();
});

test('BFcache pageshow retains the existing enhanced DOM without replaying restoration', () => {
  const h = lifecycleHarness(); const journey = initJourney(h.root);
  h.metadata(); h.present(); h.flushFrames(); h.win.scrollY = 1722;
  h.win.dispatchEvent(new Event('pagehide'));
  const pageshow = new Event('pageshow'); Object.defineProperty(pageshow, 'persisted', { value: true });
  h.win.dispatchEvent(pageshow); h.flushFrames();
  assert.equal(journey.getState().state, 'enhanced');
  assert.equal(h.scrollWrites.length, 0);
  assert.equal(h.win.scrollY, 1722);
  journey.destroy();
});

test('history write restrictions do not break pagehide or the current experience', () => {
  const h = lifecycleHarness({ historyWriteThrows: true }); const journey = initJourney(h.root);
  h.metadata(); h.present(); h.flushFrames(); h.win.scrollY = 1722;
  assert.doesNotThrow(() => h.win.dispatchEvent(new Event('pagehide')));
  assert.equal(journey.getState().state, 'enhanced');
  journey.destroy();
});

test('BFcache return with an old chapter hash preserves a later native scroll position', () => {
  const h = lifecycleHarness(); h.win.location.hash = '#shape';
  const journey = initJourney(h.root); h.flushFrames();
  assert.equal(h.anchorScrolls.length, 1);
  h.win.scrollY = 5000;
  const pageshow = new Event('pageshow'); Object.defineProperty(pageshow, 'persisted', { value: true });
  h.win.dispatchEvent(pageshow); h.flushFrames();
  assert.equal(h.anchorScrolls.length, 1, 'persisted pageshow must not replay the old hash');
  assert.equal(h.win.scrollY, 5000);
  journey.destroy();
});

test('scrollend saves before a reload snapshot and duplicate lifecycle events do not rewrite it', () => {
  const h = lifecycleHarness(); const journey = initJourney(h.root);
  h.metadata(); h.present(); h.flushFrames();
  for (const position of [500, 1000, 1722]) {
    h.win.scrollY = position; h.win.dispatchEvent(new Event('scroll'));
  }
  assert.equal(h.historyWrites.length, 0, 'intermediate scroll events must not write state');
  h.win.dispatchEvent(new Event('scrollend'));
  assert.equal(h.historyWrites.length, 1);
  assert.ok(Math.abs(h.win.history.state.__nuLabsJourney.progress - 0.82) < 1e-12);
  h.win.dispatchEvent(new Event('scrollend')); h.win.dispatchEvent(new Event('pagehide'));
  assert.equal(h.historyWrites.length, 1, 'the same settled position is not written repeatedly');
  journey.destroy();
});

test('browsers without scrollend use one trailing save and cancel it on teardown', () => {
  const h = lifecycleHarness({ scrollEndSupported: false }); const journey = initJourney(h.root);
  h.metadata(); h.present(); h.flushFrames();
  for (const position of [500, 1000, 1722]) {
    h.win.scrollY = position; h.win.dispatchEvent(new Event('scroll'));
  }
  assert.equal(h.historyWrites.length, 0);
  assert.equal(h.pendingTimers, 1, 'one trailing deadline replaces earlier scroll deadlines');
  h.fireTimers(); assert.equal(h.historyWrites.length, 1);
  h.win.scrollY = 1800; h.win.dispatchEvent(new Event('scroll'));
  journey.destroy(); h.fireTimers();
  assert.equal(h.historyWrites.length, 1);
});

test('reload and non-BFcache history return with a chapter hash preserve native position', () => {
  for (const navigationType of ['reload', 'back_forward']) {
    const h = lifecycleHarness({ navigationType });
    h.win.location.hash = '#shape'; h.win.scrollY = 5000;
    const journey = initJourney(h.root); h.flushFrames();
    h.win.dispatchEvent(new Event('pageshow')); h.flushFrames();
    assert.equal(h.anchorScrolls.length, 0);
    assert.equal(h.scrollWrites.length, 0);
    assert.equal(h.win.scrollY, 5000);
    journey.destroy();
  }
});
