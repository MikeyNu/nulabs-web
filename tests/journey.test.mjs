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
function lifecycleHarness({ source = true, reduced = false, narrow = false, short = false, frameAPI = true } = {}) {
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
    setAttribute(name, value) { this.attrs.set(name, String(value)); }
    removeAttribute(name) { this.attrs.delete(name); }
    toggleAttribute(name, force) { if (force) this.setAttribute(name, ''); else this.removeAttribute(name); }
    querySelector(selector) { return this.queries.get(selector) ?? null; }
    querySelectorAll(selector) { return this.queries.get(selector) ?? []; }
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
  win.location = { hash: '' };
  doc.hidden = false;
  doc.activeElement = null;
  doc.defaultView = win;
  doc.getElementById = () => null;
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
  chapters.forEach((chapter, index) => { chapter.dataset.chapter = String(index); });
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
    root, video, control, chapters, win, doc,
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
  for (const options of [{ source: false }, { frameAPI: false }, { reduced: true }, { narrow: true }, { short: true }]) {
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
