# Verification record

Status: production media integration is verified within the documented Windows Edge scope. All 42 unit tests passed on Windows and Linux. The final browser run passed all 17 cases with zero failures. Live contact delivery remains the only release-gate failure.

## Source and production checks

- The build produced eight page routes plus a 404 document. Local resource, link, fragment, image markup and CSS checks passed for root and nested repository paths. Each page has one h1 and no duplicate IDs.
- The 42 unit tests cover progress mapping, reading holds, reverse traversal, coalesced seeking, lifecycle suspension, fallback modes, anchors, scroll restoration and cleanup. Independent source review, JavaScript syntax checks and Git whitespace checks passed.
- Three approved Higgsfield outputs completed without paid retries: a clean 4K background plate, a 4K studio image and a Seedance 2.5 camera shot. Fresh quoted prices totalled 136.50 credits. This records quotes, not an independent billing audit.
- The silent web video is 1920 × 1080, H.264/yuv420p, 193 frames at 24 fps, 8.041667 seconds and 3,553,215 bytes. Faststart encoding uses a keyframe every six frames, or 0.25 seconds. Actual media dimensions, derivatives and source roles are recorded in the manifests.
- Visual inspection covered 32 sampled frames at 4 fps and full-resolution frames 0, 96 and 192. Exact SVG branding is preserved.

## Final browser run

The user authorized testing through Desktop Commander on their Windows project copy. The isolated headless session used existing Edge **155.0.4283.62** and temporary Playwright Core **1.64.1**. No browser was installed.

| Evidence | Result |
| --- | --- |
| Run started | 2026-10-19T00:56:34.336Z |
| Run ended | 2026-10-19T00:56:59.694Z |
| Browser cases | 17 passed, 0 failed |
| Native video range responses | Seven HTTP `206` responses |
| Automated full-clip playback | 8.041667 seconds; 193 total frames, four dropped frames, 189 presented-frame callbacks |
| Viewports | Desktop widths 1440px and 1920px; phone width 390px; tablet width 768px; short height 600px |

The suite exercised forward, reverse and fast scrubbing, actual frame presentation gating, midpoint reload, native chapter anchors, Back and hash refresh, and exact footer scroll restoration. It also covered no-JavaScript, reduced motion, live preference changes, blocked video, menu focus, navigation, filters, local brief generation and download. Desktop and mobile opening/chapter-two screenshots, secondary routes and the below-fold studio crop were visually reviewed.

Final visual review also passed the restored footer, the second chapter after a midpoint reload, and the desktop studio crop with all four people, hands and full navigation visible.

Runtime fixes corrected native chapter-anchor positioning and restoration of settled scroll positions. Two apparent visual failures were isolated to the harness: the studio image required `image.decode()` and two animation frames before capture, and a locator click changed the footer scroll position through automatic scrolling. The final harness waits for image paint and clicks the observed visible pointer target. No CSS workaround was needed for either issue. All 17 cases passed after these changes.

The reproducible harness is `scripts/browser-qa.mjs`, invoked with `npm run qa:browser`. Set `NU_QA_ROOT` to the repository, `NU_QA_PLAYWRIGHT` to an existing Playwright Core `index.mjs`, and `NU_QA_BROWSER_PATH` to an existing browser executable. `NU_QA_OUTPUT` optionally changes the ignored `qa-output/` destination; `NU_QA_CASES` optionally selects comma-separated cases. Omit case selection for the full suite. See `docs/browser-qa-summary.json` for the machine-readable summary.

## Scope and release limits

- Media status `verified` describes the observed Edge integration and journey behaviour. Safari, Firefox, real phones/tablets and comprehensive accessibility conformance were not tested.
- Full-clip playback was automated. Visual review covered sampled frames and screenshots, not a continuous normal-speed viewing session. The observed dropped frames remain part of the record.
- No live form endpoint or verified company email address is configured. The local brief builder prepares information on the visitor's device and explicitly says nothing is sent. The release gate therefore correctly fails for contact delivery only.
- The owner-private Site refresh succeeded at [nu-labs-cinematic.mikeynu.chatgpt.site](https://nu-labs-cinematic.mikeynu.chatgpt.site). Hosting reported terminal success at `2026-10-19T00:58:45.484996Z` for Sites source commit `120e40267633bd465bbd1c4b5d2f21b464b9ebec`. GitHub PR #2 is merged.

Configure the owner's actual contact delivery before a full public launch. Concept projects remain labelled and can be replaced with verified client work when available.
