# Mobile camera scrubbing

## Request and cause

Mobile visitors should get the scroll-controlled Higgsfield camera journey. The previous shared motion policy disabled both the video and horizontal gallery below 1000 pixels, below 650 pixels high, or in portrait-like aspect ratios. At 390 × 844 the baseline browser recorded readyState 0, no video URL and four static chapters. This was an explicit policy, not a failed video download.

## Change

- Separate the cinema policy from the work rail's compact layout policy. Native touch scrolling now controls the video on phone and tablet viewports.
- Keep the original inspected camera times: 0, 4.5, 8.25 and 11.75 seconds. Coalesce seeks and show copy only at its decoded reading frame.
- Prefer video-frame callbacks. When that API is absent, wait for loadeddata/completed seeking and two animation frames before revealing the decoded image. Metadata alone never enables the effect.
- Keep the complete video composition above mobile reading panels. Short landscape screens use media and copy side by side. The navigation remains transparent until the pinned video stage releases.
- Preserve relative chapter progress on a width change such as rotation. Stable viewport units avoid remapping the timeline whenever mobile browser chrome changes height.
- Select one video before loading and retain it through rotation. The 960 × 540 mobile derivative is 2,327,794 bytes, compared with the original browser clip's 7,492,871 bytes. All 289 timestamps match the source master; no audio, H.264, faststart and a maximum six-frame GOP.
- Preserve complete normal-flow content for reduced motion, unavailable media and no JavaScript. The mobile work gallery remains stacked.

The approved Higgsfield source and its existing art-direction review status are unchanged. `scripts/encode-mobile-video.py` records reproducible encoding parameters; `art/higgsfield/mobile-video-verification.json` records measured output and hashes. PyAV is an optional authoring dependency, not a build or website dependency.

## Executed verification

| Check | Result |
| --- | --- |
| Unit tests | 81 passed |
| Production build and generated links/resources/SEO | Passed |
| Chromium 153 mobile and responsive suite | 10 scenarios passed |
| WebKit 26.6 mobile suite | 5 scenarios passed |
| Existing Edge browser regressions | 7 scenarios passed |
| Visual review | Opening, reading panels, portrait, landscape and desktop captures inspected |

The dedicated suite covers 360 × 640, 390 × 844, 430 × 932, 768 × 1024, 844 × 390, 1440 × 900 and 1280 × 600. It checks actual decoded pixels at reading holds and transition frames in both directions, a native touch swipe sequence in Chromium, rotation, live reduced-motion changes, reload restoration, menu behavior, transparent navigation handoff, blocked/missing video, no JavaScript, overflow and footer access. The existing suite covers the desktop cinematic journey, mobile/tablet/short layouts, mobile navigation, anchors/history and keyboard entry into the gallery.

WebKit's Windows media loading does not appear in Playwright request events. Its checks use observed source changes, decoded pixel samples and a real missing-file response for failure handling. Chromium additionally checks the media request set. Initial failed runs identified a real rotation jump, then were resolved. One reverse-header assertion was corrected to wait for the existing 220 ms CSS transition, and reload checks wait for the controller's 150 ms history-save debounce.

These are real browser-engine tests with emulated mobile viewports, not tests on a physical iPhone or Android phone. They do not establish thermal, battery, low-power-mode or cellular-network performance. Normal-flow fallbacks remain available if media cannot be decoded.

## Repeat

Use the existing `NU_QA_PLAYWRIGHT`, `NU_QA_URL` and optional `NU_QA_BROWSER_PATH` variables documented in the README.

```powershell
node scripts/mobile-scrub-qa.mjs
$env:NU_QA_ENGINE = 'webkit'
node scripts/mobile-scrub-qa.mjs
```

`NU_QA_OUTPUT` chooses the local capture folder. Browser screenshots and verbose reports stay in ignored `qa-output/`; a compact committed summary is in `docs/mobile-scrub-verification.json`.

## API references

- https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime
- https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari
