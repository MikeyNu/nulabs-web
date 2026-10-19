import test from 'node:test';
import assert from 'node:assert/strict';
import { CINEMA_TIMELINE, validateCinemaTimeline, cinemaTimes, cinemaVideoTime, cinemaChapterProgress, cinemaChapterPresentation, horizontalPresentation, initCinema, initHorizontal } from '../src/scripts/journey-v2.mjs';

const DURATION = 12.041667;

test('four reading holds preserve four distinct camera landings', () => {
  for (const [index, [start, end]] of CINEMA_TIMELINE.holds.entries()) {
    for (const p of [start, (start + end) / 2, end]) assert.equal(cinemaVideoTime(p, DURATION), CINEMA_TIMELINE.landings[index]);
  }
});
test('each of three camera travel segments interpolates only between neighbouring landings', () => {
  assert.ok(Math.abs(cinemaVideoTime(.21, DURATION) - 2) < 1e-12);
  assert.ok(Math.abs(cinemaVideoTime(.47, DURATION) - 6) < 1e-12);
  assert.ok(Math.abs(cinemaVideoTime(.73, DURATION) - 10) < 1e-12);
});
test('forward and reverse scroll positions reproduce identical camera and panel states', () => {
  const sample = p => ({ time: cinemaVideoTime(p, DURATION), panels: [0, 1, 2, 3].map(i => cinemaChapterPresentation(p, i, cinemaVideoTime(p, DURATION), DURATION)) });
  const positions = Array.from({ length: 201 }, (_, i) => i / 200);
  const forward = positions.map(sample), reversed = positions.reverse().map(sample).reverse();
  assert.deepEqual(forward, reversed);
  for (let i = 1; i < forward.length; i += 1) assert.ok(forward[i].time >= forward[i - 1].time);
});
test('metadata bounds all landings below the playable end and handles invalid values', () => {
  for (const duration of [0, -1, NaN, Infinity]) assert.deepEqual(cinemaTimes(duration), [0, 0, 0, 0]);
  for (const duration of [.01, 5, 8, 12, 20]) {
    for (const time of cinemaTimes(duration)) assert.ok(time >= 0 && time < duration);
  }
  assert.equal(cinemaVideoTime(-1, DURATION), 0);
  assert.equal(cinemaVideoTime(2, DURATION), 12);
});
test('copy is withheld during camera travel and before the actual safe frame is presented', () => {
  for (const p of [.21, .47, .73]) for (let i = 0; i < 4; i += 1) assert.equal(cinemaChapterPresentation(p, i, cinemaVideoTime(p, DURATION), DURATION).opacity, 0);
  for (let i = 0; i < 4; i += 1) {
    const p = cinemaChapterProgress(i);
    const safe = cinemaTimes(DURATION)[i];
    assert.equal(cinemaChapterPresentation(p, i, safe, DURATION).interactive, true);
    assert.equal(cinemaChapterPresentation(p, i, safe + .2, DURATION).opacity, 0);
    assert.equal(cinemaChapterPresentation(p, i, null, DURATION).opacity, 0);
  }
});
test('fast reversals cannot expose copy over a different camera composition', () => {
  assert.equal(cinemaChapterPresentation(0, 0, 12, DURATION).opacity, 0);
  assert.equal(cinemaChapterPresentation(.9, 3, 0, DURATION).opacity, 0);
  assert.equal(cinemaChapterPresentation(.6, 2, 4, DURATION).opacity, 0);
});
test('reading positions settle completely while entrances and exits are noninteractive', () => {
  for (let i = 0; i < 4; i += 1) assert.equal(cinemaChapterPresentation(cinemaChapterProgress(i), i, cinemaTimes(DURATION)[i], DURATION).opacity, 1);
  assert.equal(cinemaChapterPresentation(.30, 1, 4, DURATION).interactive, false);
  assert.equal(cinemaChapterPresentation(.38, 1, 4, DURATION).interactive, false);
  assert.equal(cinemaChapterPresentation(.85, 3, 12, DURATION).interactive, true);
});
test('horizontal travel uses measured overflow, clamps, and releases at the final panel', () => {
  assert.deepEqual(horizontalPresentation(.5, 4000, 1000, 4), { travel: 3000, x: -1500, index: 2 });
  assert.deepEqual(horizontalPresentation(1, 4000, 1000, 4), { travel: 3000, x: -3000, index: 3 });
  assert.equal(horizontalPresentation(3, 4000, 1000, 4).x, -3000);
  assert.equal(horizontalPresentation(-1, 4000, 1000, 4).x, -0);
  assert.equal(horizontalPresentation(.5, 800, 1000, 4).travel, 0);
});
test('incomplete markup returns safe disposable handles', () => {
  for (const init of [initCinema, initHorizontal]) { const instance = init(null); assert.equal(instance.getState().state, 'static'); instance.destroy(); instance.destroy(); }
});

// Minimal event/DOM doubles check lifecycle behavior. Actual presentation and
// visual readability are separately checked in the real Windows browser.
function harness({ reduced = false, compact = false, api = true, media = true, horizontal = false, hash = '', navigationType = 'navigate', historyState = null, timeline = CINEMA_TIMELINE, readyState = 2, duration = DURATION } = {}) {
  const raf = new Map(), timers = new Map(), videoCallbacks = new Map();
  let serial = 0;
  class Element extends EventTarget {
    constructor(tag = 'DIV') {
      super(); this.tagName = tag; this.attrs = new Map(); this.dataset = {}; this.children = []; this.queries = new Map(); this.textContent = ''; this.clientWidth = 1440; this.scrollWidth = 4320;
      const styles = new Map(), classes = new Set();
      this.style = { setProperty: (k, v) => styles.set(k, String(v)), removeProperty: k => styles.delete(k), getPropertyValue: k => styles.get(k) || '', getPropertyPriority: () => '' };
      this.classList = { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: name => classes.has(name) };
      this.rect = { top: 0, bottom: 900, left: 0, right: 1440, height: 900, width: 1440 };
    }
    setAttribute(k, v) { this.attrs.set(k, String(v)); }
    getAttribute(k) { return this.attrs.get(k) ?? null; }
    removeAttribute(k) { this.attrs.delete(k); }
    hasAttribute(k) { return this.attrs.has(k); }
    toggleAttribute(k, force) { force ? this.setAttribute(k, '') : this.removeAttribute(k); }
    querySelector(k) { return this.queries.get(k) || null; }
    querySelectorAll(k) { return this.queries.get(k) || []; }
    getBoundingClientRect() { return this.rect; }
    contains(target) { return this === target || this.children.some(child => child.contains(target)); }
    scrollIntoView() { this.scrolled = true; }
    focus() { doc.activeElement = this; }
    blur() { if (doc.activeElement === this) doc.activeElement = null; }
  }
  const root = new Element(), stage = new Element(), video = new Element('VIDEO'), track = new Element();
  const chapters = Array.from({ length: 4 }, (_, i) => { const el = new Element('SECTION'); el.dataset.cinemaChapter = String(i); el.id = ['arrival', 'clarity', 'craft', 'possibility'][i]; return el; });
  const toggle = new Element('BUTTON'), index = new Element('SPAN'), progress = new Element('PROGRESS');
  const doc = new EventTarget(), win = new EventTarget();
  const queries = new Map();
  doc.defaultView = win; doc.hidden = false; doc.activeElement = null; doc.querySelectorAll = selector => selector === '[data-cinema-toggle]' ? [toggle] : [];
  doc.getElementById = id => chapters.find(ch => ch.id === id) || null;
  root.ownerDocument = doc; root.rect.height = 5400; root.rect.bottom = 5400;
  root.queries.set('[data-cinema-stage]', stage); root.queries.set('[data-cinema-video]', video); root.queries.set('[data-cinema-chapter]', chapters);
  root.queries.set('[data-cinema-index]', [index]); root.queries.set('[data-cinema-progress]', [progress]);
  root.queries.set('[data-horizontal-stage]', stage); root.queries.set('[data-horizontal-track]', track); root.queries.set('[data-horizontal-panel]', chapters);
  root.queries.set('[data-horizontal-index]', [index]); root.queries.set('[data-horizontal-progress]', [progress]);
  root.children = chapters;
  win.innerWidth = 1440; win.innerHeight = 900; win.scrollY = 0;
  root.getBoundingClientRect = () => ({ ...root.rect, top: -win.scrollY, bottom: root.rect.height - win.scrollY });
  win.location = { href: 'https://example.test/', origin: 'https://example.test', pathname: '/', search: '', hash };
  win.history = { state: historyState, replaceState(state) { this.state = state; }, pushState(state, _, hash) { this.state = state; win.location.hash = hash; } };
  win.performance = { getEntriesByType: () => [{ type: navigationType }] };
  win.scrollTo = ({ top }) => { win.scrollY = top; };
  win.matchMedia = query => {
    const q = new EventTarget(); q.matches = query.includes('prefers-reduced') ? reduced : query.includes('max-width') ? compact : false;
    queries.set(query, q); return q;
  };
  win.requestAnimationFrame = fn => { const id = ++serial; raf.set(id, fn); return id; };
  win.cancelAnimationFrame = id => raf.delete(id);
  win.setTimeout = fn => { const id = ++serial; timers.set(id, fn); return id; };
  win.clearTimeout = id => timers.delete(id);
  video.pause = () => { video.paused = true; };
  video.load = () => { video.loads = (video.loads || 0) + 1; };
  video.readyState = readyState; video.duration = duration; video.currentTime = 0; video.seeking = false; video.muted = false;
  if (media) video.setAttribute('data-src', '/assets/video/journey-v2.mp4');
  Object.defineProperty(video, 'src', { get: () => video.getAttribute('src') || '', set: value => video.setAttribute('src', value) });
  if (api) video.requestVideoFrameCallback = fn => { const id = ++serial; videoCallbacks.set(id, fn); return id; };
  video.cancelVideoFrameCallback = id => videoCallbacks.delete(id);
  const instance = horizontal ? initHorizontal(root) : initCinema(root, { timeline });
  return {
    root, stage, video, track, chapters, toggle, index, progress, doc, win, instance, raf, timers, videoCallbacks,
    flush() { const pending = [...raf.values()]; raf.clear(); pending.forEach(fn => fn()); },
    present(time) { const pending = [...videoCallbacks.values()]; videoCallbacks.clear(); pending.forEach(fn => fn(0, { mediaTime: time })); },
    preference(value) { const q = queries.get('(prefers-reduced-motion: reduce)'); q.matches = value; q.dispatchEvent(new Event('change')); },
    emit(name, target = win) { target.dispatchEvent(new Event(name)); },
  };
}
test('cinema does not pin or reveal video before an actual presented frame', () => {
  const h = harness();
  assert.equal(h.instance.getState().state, 'loading');
  assert.equal(h.root.classList.contains('cinema-enhanced'), false);
  h.present(0); h.flush();
  assert.equal(h.instance.getState().state, 'enhanced');
  assert.equal(h.root.classList.contains('cinema-frame-ready'), true);
  assert.equal(h.chapters[0].getAttribute('aria-hidden'), 'false');
  assert.equal(h.chapters[1].hasAttribute('inert'), true);
  h.instance.destroy();
});
test('reduced motion, compact screens and unsupported video remain complete without a media request', () => {
  for (const config of [{ reduced: true }, { compact: true }, { api: false }, { media: false }]) {
    const h = harness(config);
    assert.equal(h.instance.getState().state, 'static');
    assert.equal(h.video.getAttribute('src'), null);
    assert.ok(h.chapters.every(chapter => !chapter.hasAttribute('inert')));
    h.instance.destroy();
  }
});
test('live reduced motion restores all chapters and preserves a focused motion control', () => {
  const h = harness(); h.present(0); h.flush(); h.doc.activeElement = h.toggle; h.preference(true);
  assert.equal(h.instance.getState().reason, 'reduced-motion');
  assert.ok(h.chapters.every(chapter => !chapter.hasAttribute('inert')));
  assert.equal(h.toggle.hidden, false);
  assert.equal(h.toggle.getAttribute('aria-disabled'), 'true');
  h.instance.destroy();
});
test('media failure restores all semantic content and removes the presented-frame class', () => {
  const h = harness(); h.present(0); h.flush(); h.emit('error', h.video);
  assert.equal(h.instance.getState().reason, 'media-error');
  assert.equal(h.root.classList.contains('cinema-enhanced'), false);
  assert.equal(h.root.classList.contains('cinema-frame-ready'), false);
  assert.ok(h.chapters.every(chapter => !chapter.hasAttribute('inert')));
  h.instance.destroy();
});
test('scrolling cannot hide a focused link inside the active cinema chapter', () => {
  const h = harness(); h.present(0); h.flush();
  h.doc.activeElement = h.chapters[0]; h.win.scrollY = 2700; h.emit('scroll'); h.flush();
  assert.equal(h.instance.getState().reason, 'keyboard-focus');
  assert.ok(h.chapters.every(chapter => !chapter.hasAttribute('inert')));
  assert.equal(h.doc.activeElement, h.chapters[0]);
  h.instance.destroy();
});
test('destroy cancels callbacks and timers, restores attributes and releases controller-owned media', () => {
  const h = harness(); h.present(0); h.flush(); h.win.scrollY = 1500; h.emit('scroll');
  h.instance.destroy(); h.instance.destroy();
  assert.equal(h.raf.size, 0); assert.equal(h.timers.size, 0); assert.equal(h.videoCallbacks.size, 0);
  assert.equal(h.root.classList.contains('cinema-enhanced'), false);
  assert.equal(h.video.getAttribute('src'), null);
  h.emit('scroll'); h.emit('loadeddata', h.video); assert.equal(h.raf.size, 0);
});
test('horizontal pin is bounded by actual overflow and restores under reduced motion', () => {
  const h = harness({ horizontal: true });
  assert.equal(h.instance.getState().state, 'enhanced');
  assert.equal(h.instance.getState().travel, 2880);
  assert.equal(h.root.style.getPropertyValue('--horizontal-height'), '3780px');
  h.win.scrollY = 2880; h.emit('scroll'); h.flush();
  assert.equal(h.track.style.getPropertyValue('--horizontal-x'), '-2880px');
  assert.equal(h.index.textContent, '04');
  h.preference(true);
  assert.equal(h.instance.getState().state, 'static');
  assert.equal(h.track.style.getPropertyValue('--horizontal-x'), '');
  assert.equal(h.root.classList.contains('horizontal-enhanced'), false);
  h.instance.destroy();
});
test('keyboard entry into a clipped horizontal panel reveals the full normal-flow document without moving focus', () => {
  const h = harness({ horizontal: true });
  const panel = h.chapters[3]; panel.rect = { ...panel.rect, left: 3000, right: 4400 };
  const event = new Event('focusin'); Object.defineProperty(event, 'target', { value: panel });
  h.doc.activeElement = panel; h.root.dispatchEvent(event);
  assert.equal(h.instance.getState().reason, 'keyboard-focus');
  assert.equal(panel.scrolled, true); assert.equal(h.doc.activeElement, panel);
  h.instance.destroy(); assert.equal(h.raf.size, 0);
});

test('a direct chapter fragment waits for presentation then targets its settled reading position', () => {
  const h = harness({ hash: '#craft' });
  assert.equal(h.win.scrollY, 0);
  h.present(0); h.flush(); h.flush(); h.flush();
  assert.ok(Math.abs(h.win.scrollY - 2700) < 1e-9);
  assert.ok(Math.abs(h.instance.getState().progress - .6) < 1e-12);
  h.instance.destroy();
});
test('reload restores saved journey progress after enhancement expands the document', () => {
  const h = harness({ navigationType: 'reload', historyState: { __nuLabsCinemaV2: { version: 1, href: 'https://example.test/', region: 'cinema', progress: .6, index: 2 } } });
  h.present(0); h.flush(); h.flush(); h.flush();
  assert.ok(Math.abs(h.win.scrollY - 2700) < 1e-9);
  assert.ok(Math.abs(h.instance.getState().progress - .6) < 1e-12);
  h.instance.destroy();
});
test('an explicit user gesture cancels deferred history restoration', () => {
  const h = harness({ navigationType: 'reload', historyState: { __nuLabsCinemaV2: { version: 1, href: 'https://example.test/', region: 'cinema', progress: .6, index: 2 } } });
  h.present(0); h.emit('wheel'); h.flush(); h.flush();
  assert.equal(h.win.scrollY, 0);
  h.instance.destroy();
});
test('horizontal position is remeasured after preceding cinema changes document height', () => {
  const h = harness({ horizontal: true });
  h.root.getBoundingClientRect = () => ({ ...h.root.rect, top: 1000 - h.win.scrollY, bottom: 6400 - h.win.scrollY });
  h.win.scrollY = 2440; h.emit('scroll'); h.flush();
  assert.equal(h.track.style.getPropertyValue('--horizontal-x'), '-1440px');
  h.instance.destroy();
});

test('intentional chapter navigation retains motion and focuses the destination only when readable', () => {
  const h = harness(); h.present(0); h.flush();
  const link = new EventTarget();
  link.hasAttribute = () => false; link.getAttribute = () => '#clarity'; link.closest = () => link;
  h.doc.activeElement = h.chapters[0];
  const click = new Event('click', { cancelable: true });
  Object.defineProperties(click, { target: { value: link }, button: { value: 0 } });
  h.doc.dispatchEvent(click);
  assert.equal(click.defaultPrevented, true);
  assert.equal(h.doc.activeElement, null);
  h.flush(); h.flush(); h.flush();
  assert.equal(h.instance.getState().state, 'enhanced');
  assert.equal(h.doc.activeElement, null);
  h.present(4); h.flush();
  assert.equal(h.doc.activeElement, h.chapters[1]);
  assert.equal(h.chapters[1].getAttribute('aria-hidden'), 'false');
  h.emit('wheel');
  assert.equal(h.doc.activeElement, null);
  h.win.scrollY = 2700; h.emit('scroll'); h.flush();
  assert.equal(h.instance.getState().state, 'enhanced');
  h.instance.destroy();
  assert.equal(h.chapters[1].getAttribute('tabindex'), null);
});

test('nonuniform inspected camera times are preserved exactly and interpolate between those shots', () => {
  const timeline = { ...CINEMA_TIMELINE, landings: [0, 2.875, 6.125, 10.75], fps: 24 };
  assert.equal(validateCinemaTimeline(timeline, 11), null);
  assert.deepEqual(cinemaTimes(11, timeline), timeline.landings);
  assert.deepEqual(cinemaTimes(18, timeline), timeline.landings);
  assert.ok(Math.abs(cinemaVideoTime(.21, 11, timeline) - 1.4375) < 1e-12);
  assert.ok(Math.abs(cinemaVideoTime(.47, 11, timeline) - 4.5) < 1e-12);
  assert.ok(Math.abs(cinemaVideoTime(.73, 11, timeline) - 8.4375) < 1e-12);
  assert.equal(cinemaChapterPresentation(.6, 2, 6.125, 11, timeline).interactive, true);
  assert.equal(cinemaChapterPresentation(.6, 2, 8, 11, timeline).interactive, false);
});

test('invalid timelines and unavailable camera landings are rejected instead of silently rescaled', () => {
  for (const landings of [null, [0, 4, 8], [0, 4, 4, 10], [-1, 3, 6, 9], [0, 4, NaN, 10], [0, 7, 3, 10]]) {
    assert.equal(validateCinemaTimeline({ ...CINEMA_TIMELINE, landings }), 'invalid-timeline');
  }
  for (const fps of [0, -24, NaN]) assert.equal(validateCinemaTimeline({ ...CINEMA_TIMELINE, fps }), 'invalid-timeline');
  assert.equal(validateCinemaTimeline(CINEMA_TIMELINE, 8), 'media-timeline-mismatch');
  assert.deepEqual(cinemaTimes(8), [0, 0, 0, 0]);
  const endNearBoundary = { ...CINEMA_TIMELINE, landings: [0, 3, 7, 11.96], fps: 30 };
  assert.equal(validateCinemaTimeline(endNearBoundary, 12), null);
  assert.equal(validateCinemaTimeline({ ...endNearBoundary, fps: 24 }, 12), 'media-timeline-mismatch');
});

test('malformed configured timing prevents the video request and leaves all chapters readable', () => {
  const h = harness({ timeline: { ...CINEMA_TIMELINE, landings: null } });
  assert.equal(h.instance.getState().state, 'static');
  assert.equal(h.instance.getState().reason, 'invalid-timeline');
  assert.equal(h.video.getAttribute('src'), null);
  assert.ok(h.chapters.every(chapter => !chapter.hasAttribute('inert')));
  h.instance.destroy();
});

test('actual media metadata that cannot contain inspected timings forces complete static flow', () => {
  const h = harness({ readyState: 0, duration: NaN });
  assert.equal(h.instance.getState().state, 'loading');
  h.video.readyState = 1; h.video.duration = 8;
  h.emit('loadedmetadata', h.video);
  assert.equal(h.instance.getState().state, 'static');
  assert.equal(h.instance.getState().reason, 'media-timeline-mismatch');
  assert.ok(h.chapters.every(chapter => !chapter.hasAttribute('inert')));
  assert.equal(h.root.classList.contains('cinema-enhanced'), false);
  h.instance.destroy();
});

test('nonuniform configuration drives the real lifecycle seek and waits for the inspected frame', () => {
  const timeline = { ...CINEMA_TIMELINE, landings: [0, 2.875, 6.125, 10.75], fps: 24 };
  const h = harness({ timeline, duration: 11 });
  h.present(0); h.flush();
  h.win.scrollY = 2700; h.emit('scroll'); h.flush(); h.flush();
  assert.equal(h.instance.getState().targetTime, 6.125);
  assert.equal(h.chapters[2].getAttribute('aria-hidden'), 'true');
  h.present(6.125); h.flush();
  assert.equal(h.chapters[2].getAttribute('aria-hidden'), 'false');
  h.instance.destroy();
});
