/** Portable Windows/Linux QA runner. Uses an existing browser and Playwright.
 * Required: NU_QA_ROOT (checkout or dist), NU_QA_PLAYWRIGHT (module file/path).
 * Optional: NU_QA_BROWSER_PATH, NU_QA_OUTPUT, NU_QA_HEADLESS=false,
 * NU_QA_CASES (comma-separated scenario names).
 * Artifacts are evidence for review, never a substitute for visual inspection.
 */
import http from 'node:http';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { stat, mkdir, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const required = name => { assert(process.env[name], `${name} is required`); return process.env[name]; };
let root = path.resolve(required('NU_QA_ROOT'));
try { await stat(path.join(root, 'index.html')); } catch { root = path.join(root, 'dist'); }
await stat(path.join(root, 'index.html'));
const output = path.resolve(process.env.NU_QA_OUTPUT || path.join(root, '..', 'qa-output'));
await mkdir(output, { recursive: true });
const modulePath = required('NU_QA_PLAYWRIGHT');
const playwright = /\.(?:mjs|js|cjs)$/.test(modulePath)
  ? await import(pathToFileURL(path.resolve(modulePath)).href)
  : createRequire(import.meta.url)(modulePath);
const { chromium } = playwright.default || playwright;
assert(chromium, 'Playwright Chromium API is unavailable');
const report = { startedAt: new Date().toISOString(), root, browserPath: process.env.NU_QA_BROWSER_PATH,
  browserVersion: null, automatedOnly: true, visualReviewRequired: true, cases: [], requests: [] };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    let info;
    let status = 200;
    try {
      info = await stat(file);
      if (info.isDirectory()) { file = path.join(file, 'index.html'); info = await stat(file); }
    } catch { file = path.join(root, '404.html'); info = await stat(file); status = 404; }
    const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    let start = 0; let end = info.size - 1;
    if (req.headers.range && status === 200) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return; }
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    report.requests.push({ path: pathname, method: req.method, status, range: req.headers.range || null });
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || !info.size) { res.end(); return; }
    const stream = createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) { if (!res.headersSent) res.writeHead(500); res.end(String(error.message)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
report.baseURL = base;
let browser;
const slug = value => value.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
async function saveReport() { await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); }
async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-journey]');
    const video = document.querySelector('[data-journey-video]');
    const bounds = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
    return { url: location.href, scrollY, historyState: history.state,
      navigationType: performance.getEntriesByType('navigation')[0]?.type,
      viewport: { width: innerWidth, height: innerHeight },
      overflow: document.documentElement.scrollWidth - innerWidth,
      journey: root ? { classes: root.className, state: root.dataset.journeyState, reason: root.dataset.journeyReason,
        status: root.dataset.mediaStatus, bounds: bounds(root), stage: bounds(root.querySelector('[data-journey-stage]')) } : null,
      video: video ? { currentTime: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : null,
        width: video.videoWidth, height: video.videoHeight, readyState: video.readyState, seeking: video.seeking,
        paused: video.paused, src: video.getAttribute('src'), error: video.error?.message || null } : null,
      chapters: [...document.querySelectorAll('[data-chapter]')].map(el => ({ chapter: el.dataset.chapter, hidden: el.hidden,
        inert: el.inert, opacity: Number(getComputedStyle(el).opacity), position: getComputedStyle(el).position, bounds: bounds(el) })),
      posterOpacity: root ? getComputedStyle(root.querySelector('[data-journey-poster]')).opacity : null,
      frames: window.__NU_QA_FRAMES__ || [] };
  });
}
async function capture(page, item, label, fullPage = false) {
  await page.waitForFunction(() => [...document.images].filter(image => { const r=image.getBoundingClientRect(); return r.width>0 && r.height>0 && r.bottom>0 && r.top<innerHeight && r.right>0 && r.left<innerWidth; }).every(image => image.complete && image.naturalWidth>0), null, { timeout:10000 });
  // Page-world asynchronous callbacks do not run with JavaScript disabled.
  // The no-JS case uses loaded image dimensions and the browser's native paint.
  if (item.javaScriptEnabled !== false) await page.evaluate(async () => {
    const visibleImages = [...document.images].filter(image => {
      const r = image.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    });
    await Promise.all(visibleImages.map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const file = `${slug(item.name)}-${slug(label)}.png`;
  await page.screenshot({ path: path.join(output, file), fullPage, timeout: 15000 });
  item.screenshots.push(file);
  item.observations.push({ label, ...await snapshot(page) });
}
async function checkOverflow(page) {
  const excess = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(excess <= 2, `Horizontal overflow: ${excess}px`);
}
async function go(page, route = '/') {
  const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
  assert(response?.status() === 200, `Navigation ${route} returned ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  await checkOverflow(page);
}
async function scrollProgress(page, progress) {
  await page.evaluate(p => {
    const root = document.querySelector('[data-journey]');
    const stage = root.querySelector('[data-journey-stage]');
    const rect = root.getBoundingClientRect();
    window.scrollTo({ top: rect.top + scrollY + p * (rect.height - stage.getBoundingClientRect().height), behavior: 'instant' });
  }, progress);
}
async function frameAt(page, time, chapter = null) {
  await page.waitForFunction(({ time, chapter }) => {
    const video = document.querySelector('[data-journey-video]');
    const frame = window.__NU_QA_FRAMES__?.at(-1);
    const el = chapter === null ? null : document.querySelector(`[data-chapter="${chapter}"]`);
    return video && !video.seeking && Math.abs(video.currentTime - time) < 0.12
      && frame && Math.abs(frame.mediaTime - time) < 0.12
      && (!el || (!el.hidden && !el.inert && Number(getComputedStyle(el).opacity) > 0.99));
  }, { time, chapter }, { timeout: 15000 });
}
async function normalFlow(page) {
  await page.waitForFunction(() => !document.querySelector('[data-journey]').classList.contains('journey-enhanced'));
  const state = await snapshot(page);
  assert(state.chapters.length === 2 && state.chapters.every(c => !c.hidden && !c.inert && c.opacity > 0.99), 'All normal-flow chapters must be readable');
  assert(state.chapters.every(c => !['fixed', 'absolute'].includes(c.position)), 'Static chapters must be in document flow');
  assert(state.chapters[1].bounds.y >= state.chapters[0].bounds.bottom - 2, 'Static chapters must not overlap');
  await checkOverflow(page);
}
async function scenario(name, options, run) {
  if (process.env.NU_QA_CASES && !process.env.NU_QA_CASES.split(',').includes(name)) return;
  const item = { name, status: 'running', startedAt: new Date().toISOString(), screenshots: [], observations: [], console: [], errors: [], failedRequests: [], network: [] };
  report.cases.push(item);
  const { blockedVideo = false, allow404 = false, ...contextOptions } = options;
  item.javaScriptEnabled = contextOptions.javaScriptEnabled !== false;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...contextOptions });
  await context.addInitScript(() => {
    window.__NU_QA_FRAMES__ = [];
    const original = HTMLVideoElement.prototype.requestVideoFrameCallback;
    if (original) HTMLVideoElement.prototype.requestVideoFrameCallback = function (callback) {
      return original.call(this, (now, metadata) => {
        window.__NU_QA_FRAMES__.push({ at: now, mediaTime: metadata.mediaTime, presentedFrames: metadata.presentedFrames, currentTime: this.currentTime });
        if (window.__NU_QA_FRAMES__.length > 400) window.__NU_QA_FRAMES__.shift();
        callback(now, metadata);
      });
    };
  });
  if (blockedVideo) await context.route('**/*.mp4', route => route.abort('failed'));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('console', msg => { if (msg.type() === 'error') item.console.push({ text: msg.text(), location: msg.location() }); });
  page.on('pageerror', error => item.errors.push({ message: error.message, stack: error.stack }));
  page.on('request', req => item.network.push({ url: req.url(), method: req.method(), type: req.resourceType() }));
  page.on('requestfailed', req => item.failedRequests.push({ url: req.url(), error: req.failure()?.errorText,
    expected: blockedVideo && /\.mp4(?:\?|$)/.test(req.url()) }));
  let deadline;
  try {
    await Promise.race([run(page, item, context), new Promise((_, reject) => {
      deadline = setTimeout(() => reject(new Error('Scenario exceeded its 90-second deadline')), 90000);
    })]);
    const unexpectedConsole = item.console.filter(e => !(blockedVideo && /ERR_FAILED|ERR_ABORTED/.test(e.text)) && !(allow404 && /404/.test(e.text)));
    assert.equal(item.errors.length, 0, `Page errors: ${JSON.stringify(item.errors)}`);
    assert.equal(unexpectedConsole.length, 0, `Console errors: ${JSON.stringify(unexpectedConsole)}`);
    assert.equal(item.failedRequests.filter(r => !r.expected && !/ERR_ABORTED/.test(r.error || '')).length, 0, 'Unexpected failed requests');
    item.status = 'passed';
  } catch (error) {
    item.status = 'failed'; item.failure = { message: error.message, stack: error.stack };
    try { await capture(page, item, 'FAILURE'); } catch (captureError) { item.captureFailure = captureError.message; }
  } finally {
    clearTimeout(deadline);
    item.finishedAt = new Date().toISOString();
    await context.close(); await saveReport();
    console.log(`${item.status.toUpperCase()} ${name}${item.failure ? ': ' + item.failure.message : ''}`);
  }
}
try {
  browser = await chromium.launch({ headless: process.env.NU_QA_HEADLESS !== 'false', executablePath: process.env.NU_QA_BROWSER_PATH || undefined,
    args: ['--no-first-run', '--no-default-browser-check'] });
  report.browserVersion = browser.version();
  await scenario('desktop-1440-motion', {}, async (page, item) => {
    await go(page);
    await page.waitForFunction(() => document.querySelector('[data-journey]').classList.contains('journey-enhanced'), null, { timeout: 25000 });
    await scrollProgress(page, 0); await frameAt(page, 0, 0); await capture(page, item, 'opening');
    let state = await snapshot(page);
    assert(state.video.width >= 1920 && state.video.height >= 1080, 'Video must decode at the delivered 1080p size');
    assert(state.video.duration >= 7.8 && state.video.duration <= 8.2, `Unexpected duration ${state.video.duration}`);
    assert(state.frames.length > 0 && Number(state.posterOpacity) < 0.01, 'Poster must yield only after an actual presented frame');
    await scrollProgress(page, 0.08); await frameAt(page, 0, 0);
    await scrollProgress(page, 0.43); await frameAt(page, 3.95); await capture(page, item, 'mid-travel');
    await scrollProgress(page, 0.82); await frameAt(page, 7.9, 1); await capture(page, item, 'chapter-two');
    await scrollProgress(page, 0.95); await frameAt(page, 7.9, 1);
    await scrollProgress(page, 0.43); await frameAt(page, 3.95); await capture(page, item, 'reverse-midpoint');
    for (const p of [0.9, 0.2, 0.85, 0]) { await scrollProgress(page, p); await page.evaluate(() => new Promise(r => requestAnimationFrame(r))); }
    await frameAt(page, 0, 0); await capture(page, item, 'fast-reversal-settled');
    await page.keyboard.press('PageDown'); await page.waitForFunction(() => scrollY > 0, null, { timeout: 3000 });
    await page.locator('.site-footer').scrollIntoViewIfNeeded(); await capture(page, item, 'released-footer');
    state = await snapshot(page); assert(state.journey.stage.bottom <= 2, 'The stage must release before the footer');
    await checkOverflow(page);
  });
  await scenario('desktop-1920', { viewport: { width: 1920, height: 1080 } }, async (page, item) => {
    await go(page); await page.waitForFunction(() => document.querySelector('[data-journey]').classList.contains('journey-enhanced'), null, { timeout: 25000 });
    await scrollProgress(page, 0); await frameAt(page, 0, 0); await capture(page, item, 'opening');
    await scrollProgress(page, 0.82); await frameAt(page, 7.9, 1); await capture(page, item, 'chapter-two'); await checkOverflow(page);
  });
  await scenario('isolated-video-playback-decode', {}, async (page, item) => {
    await go(page);
    // This visible, temporary probe tests browser decoding of the delivered
    // asset independently of the paused, scroll-owned website renderer.
    await page.evaluate(async () => {
      const source = document.querySelector('[data-journey-video]').dataset.src;
      const toggle = document.querySelector('[data-motion-toggle]');
      if (toggle && !toggle.hidden) toggle.click();
      const video = document.createElement('video'); video.id = 'qa-playback';
      video.muted = true; video.playsInline = true; video.controls = true; video.src = source;
      video.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#111;z-index:2147483647';
      document.body.append(video); window.__NU_QA_PLAYBACK__ = [];
      const collect = (_now, data) => { window.__NU_QA_PLAYBACK__.push(data.mediaTime); if (!video.ended) video.requestVideoFrameCallback(collect); };
      video.requestVideoFrameCallback(collect); await video.play();
    });
    await page.waitForFunction(() => document.querySelector('#qa-playback')?.ended, null, { timeout: 15000 });
    item.playback = await page.evaluate(() => {
      const v = document.querySelector('#qa-playback'); const quality = v.getVideoPlaybackQuality();
      return { duration: v.duration, currentTime: v.currentTime, width: v.videoWidth, height: v.videoHeight,
        samples: window.__NU_QA_PLAYBACK__, totalFrames: quality.totalVideoFrames, droppedFrames: quality.droppedVideoFrames };
    });
    assert(item.playback.samples.length > 2 && item.playback.samples[0] < 1 && item.playback.samples.at(-1) > 7.5,
      'Actual presented frames must progress across the complete clip');
    await capture(page, item, 'isolated-decoder-probe-end');
  });
  for (const [name, options] of [
    ['mobile-390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
    ['tablet-768', { viewport: { width: 768, height: 1024 }, hasTouch: true }],
    ['short-desktop', { viewport: { width: 1440, height: 600 } }],
    ['reduced-motion', { reducedMotion: 'reduce' }],
    ['no-js-desktop', { javaScriptEnabled: false }],
    ['no-js-mobile', { javaScriptEnabled: false, viewport: { width: 390, height: 844 } }],
  ]) await scenario(name, options, async (page, item) => {
    await go(page); await normalFlow(page); await capture(page, item, 'opening');
    assert.equal(await page.locator('[data-journey-video]').getAttribute('src'), null, 'Static mode must not attach the video source');
    await page.locator('[data-chapter="1"]').scrollIntoViewIfNeeded(); await capture(page, item, 'chapter-two'); await checkOverflow(page);
    if (options.javaScriptEnabled === false) {
      assert(await page.locator('.no-js-nav').isVisible(), 'No-JS navigation must be visible');
      await page.locator('.no-js-nav a[href$="/contact/"]').click();
      await page.waitForURL('**/contact/');
      assert(await page.locator('[data-enquiry-form] [type="submit"]').isDisabled(), 'No-JS form must not accidentally send data');
    }
  });
  await scenario('live-reduced-motion', {}, async (page, item) => {
    await go(page); await page.waitForFunction(() => document.querySelector('[data-journey]').classList.contains('journey-enhanced'), null, { timeout: 25000 });
    await scrollProgress(page, 0.82); await frameAt(page, 7.9, 1);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await normalFlow(page);
    await page.evaluate(() => scrollTo(0, 0)); await capture(page, item, 'motion-removed');
    assert(await page.locator('video').evaluate(video => video.paused), 'Reduced motion must leave video paused');
  });
  await scenario('blocked-video', { blockedVideo: true }, async (page, item) => {
    await go(page);
    await page.waitForFunction(() => document.querySelector('[data-journey]').dataset.mediaStatus === 'error', null, { timeout: 20000 });
    await normalFlow(page); await capture(page, item, 'readable-fallback');
    assert(item.failedRequests.some(r => r.expected), 'The test must actually block a video request');
  });
  await scenario('routes-navigation-and-filter', { reducedMotion: 'reduce', allow404: true }, async (page, item) => {
    await go(page);
    for (const route of ['services', 'studio', 'work', 'contact']) {
      await page.locator(`.desktop-nav a[href$="/${route}/"]`).click(); await page.waitForURL(`**/${route}/`);
      assert(await page.locator('main h1').isVisible(), `${route} heading must be visible`); await checkOverflow(page); await capture(page, item, route);
    }
    await page.locator('.desktop-nav a[href$="/work/"]').click(); await page.waitForURL('**/work/');
    const total = await page.locator('[data-project-category]').count(); assert(total >= 3, 'Expected project collection');
    await page.locator('[data-filter="Identity"]').click();
    assert.equal(await page.locator('[data-project-category]:visible').count(), 1);
    assert.match(await page.locator('.filter-announcement').textContent(), /1 project shown/);
    await page.locator('[data-filter="All"]').click(); assert.equal(await page.locator('[data-project-category]:visible').count(), total);
    const projectLinks = await page.locator('.project-art').evaluateAll(links => links.map(a => a.getAttribute('href')));
    for (const href of projectLinks) { await page.locator(`.project-art[href="${href}"]`).click(); await page.waitForURL(base + href); assert(await page.locator('h1').isVisible()); await checkOverflow(page); await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Solutions', exact: true }).click(); await page.waitForURL('**/work/'); }
    const response = await page.goto(base + '/not-a-real-page/', { waitUntil: 'domcontentloaded' }); assert.equal(response.status(), 404);
    assert(await page.locator('h1').isVisible()); await page.locator('main a').click(); await page.waitForURL(base + '/');
  });
  await scenario('mobile-menu-and-focus', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async (page, item) => {
    await go(page); const toggle = page.locator('.menu-toggle');
    await toggle.click(); assert.equal(await toggle.getAttribute('aria-expanded'), 'true'); assert(await page.locator('.mobile-menu').isVisible());
    await page.keyboard.press('Escape'); assert.equal(await toggle.getAttribute('aria-expanded'), 'false'); assert(await toggle.evaluate(el => el === document.activeElement));
    await toggle.click(); await page.locator('.mobile-menu a[href$="/work/"]').click(); await page.waitForURL('**/work/');
    await toggle.click(); await page.locator('.mobile-menu a').first().focus();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('.mobile-menu').hidden);
    assert(await page.evaluate(() => document.activeElement?.closest('.desktop-nav') !== null), 'Resize must preserve navigation focus');
    await capture(page, item, 'desktop-after-mobile'); await checkOverflow(page);
  });
  await scenario('local-enquiry', {}, async (page, item) => {
    await go(page, '/contact/'); const form = page.locator('[data-enquiry-form]');
    await form.locator('[name="name"]').fill('   '); await form.locator('[name="email"]').fill('qa@example.test'); await form.locator('[name="message"]').fill('   ');
    await form.locator('[type="submit"]').click(); assert(await page.locator('[data-enquiry-result]').isHidden(), 'Whitespace-only content must not produce an enquiry');
    const networkBefore = item.network.length;
    await form.locator('[name="name"]').fill('QA Reviewer'); await form.locator('[name="company"]').fill('Test project');
    await form.locator('[name="message"]').fill('A synthetic browser QA brief. No real contact request.'); await form.locator('[type="submit"]').click();
    assert(await page.locator('[data-enquiry-result]').isVisible());
    assert.match(await page.locator('[data-enquiry-text]').inputValue(), /QA Reviewer/);
    assert.match(await page.locator('[data-enquiry-status]').textContent(), /Nothing has been sent/);
    assert(await page.locator('#enquiry-title').evaluate(el => el === document.activeElement));
    const downloadPromise = page.waitForEvent('download'); await page.locator('[data-download-enquiry]').click();
    const download = await downloadPromise; const downloaded = path.join(output, 'synthetic-enquiry.txt'); await download.saveAs(downloaded);
    assert.match(await readFile(downloaded, 'utf8'), /synthetic browser QA brief/);
    const later = item.network.slice(networkBefore); assert(later.every(r => ['GET', 'HEAD'].includes(r.method)), 'The enquiry must not POST data');
    assert(!later.some(r => /QA%20Reviewer|qa%40example|synthetic/.test(r.url)), 'Form data must not enter network URLs');
    await capture(page, item, 'prepared-locally'); await checkOverflow(page);
  });
  await scenario('anchors-history', {}, async (page, item) => {
    const openServices = async () => {
      // Locator auto-scrolling moves this sticky navigation before activation.
      // Use the observed visible hit area so history records the user's position.
      const box = await page.locator('.desktop-nav a[href$="/services/"]').boundingBox();
      assert(box && box.y >= 0 && box.y + box.height < page.viewportSize().height);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForURL('**/services/');
    };
    const headingOnScreen = async () => page.waitForFunction(() => {
      const box = document.querySelector('#shape-title').getBoundingClientRect();
      return box.top >= 100 && box.bottom < innerHeight;
    }, null, { timeout: 5000 });
    await go(page); await page.waitForFunction(() => document.querySelector('[data-journey]').classList.contains('journey-enhanced'));
    await page.locator('.scroll-cue').click(); await page.waitForURL('**/#shape'); await normalFlow(page);
    await headingOnScreen(); await capture(page, item, 'clicked-chapter-anchor');
    await openServices();
    await page.goBack({waitUntil:'domcontentloaded'}); await page.waitForURL('**/#shape'); await normalFlow(page); await headingOnScreen();
    await page.reload({waitUntil:'domcontentloaded'}); await normalFlow(page); await headingOnScreen();
    await capture(page, item, 'refreshed-chapter-anchor');
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await capture(page,item,'hash-reading-position-before-leaving');
    const footerReadingY = await page.evaluate(() => scrollY);
    item.footerReadingY = footerReadingY;
    await openServices();
    await page.goBack({waitUntil:'domcontentloaded'}); await page.waitForURL('**/#shape'); await normalFlow(page);
    await page.waitForFunction(y => Math.abs(scrollY - y) < 4, footerReadingY);
    await page.reload({waitUntil:'domcontentloaded'}); await normalFlow(page);
    await page.waitForFunction(y => Math.abs(scrollY - y) < 4, footerReadingY);
    await capture(page,item,'hash-reading-position-restored');
  });
  await scenario('journey-reload', {}, async (page,item) => {
    await go(page); await page.waitForFunction(() => document.querySelector('[data-journey]').classList.contains('journey-enhanced'));
    await scrollProgress(page,.82); await frameAt(page,7.9,1);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('[data-journey]').classList.contains('journey-enhanced'));
    await frameAt(page,7.9,1); await capture(page,item,'refreshed-mid-journey');
  });
  await scenario('below-fold-layouts', {reducedMotion:'reduce'}, async (page,item) => {
    for(const [route,selector,label] of [
      ['/','.built-section','home-services'],['/','.project-grid','home-work'],['/','.studio-teaser','home-studio'],
      ['/studio/','.studio-wide','studio-image'],['/services/','.service-detail','service-detail'],['/services/','.process-section','process'],
      ['/contact/','.enquiry-form','contact-form']]) {
      await go(page,route); await page.locator(selector).first().scrollIntoViewIfNeeded(); await capture(page,item,label); await checkOverflow(page);
    }
    await page.setViewportSize({width:390,height:844});
    for(const [route,selector,label] of [['/','.studio-teaser','mobile-studio'],['/work/','.project-grid','mobile-work'],['/services/','.faq-section','mobile-faq'],['/contact/','.enquiry-form','mobile-contact']]) {
      await go(page,route); await page.locator(selector).first().scrollIntoViewIfNeeded(); await capture(page,item,label); await checkOverflow(page);
    }
  });
} catch (error) { report.fatal = { message: error.message, stack: error.stack }; }
finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  report.finishedAt = new Date().toISOString(); report.summary = { total: report.cases.length,
    passed: report.cases.filter(c => c.status === 'passed').length, failed: report.cases.filter(c => c.status === 'failed').length,
    servedVideoRanges: report.requests.filter(r => r.status === 206 && /\.mp4$/.test(r.path)).length };
  await saveReport(); console.log(JSON.stringify({ report: path.join(output, 'report.json'), ...report.summary, fatal: report.fatal?.message }, null, 2));
  if (report.fatal || report.summary.failed || report.summary.total === 0) process.exitCode = 1;
}
