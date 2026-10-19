# Verification record

Status: production media integrated; browser and temporal interaction QA blocked. The release status remains `integrated-awaiting-browser-qa`.

## Performed

- Node build produced eight page routes plus a 404 document.
- Local resource, link, fragment, image markup and CSS resource checks passed.
- Root deployment and nested repository-path deployments passed the same checks.
- Each generated page has one h1 and no duplicate IDs.
- All 26 runtime unit tests passed. Coverage includes deterministic progress, reading holds, reverse traversal, coalesced seeking, metadata gates, lifecycle suspension, fallback modes and cleanup.
- Independent source reviews examined runtime/markup integration, mobile menu focus, local form behaviour, delivered media dimensions, chapter typography and studio crops. The final review found a mobile ancestor-visibility rule that could hide a focused motion control; that rule was removed and build checks passed.
- Existing image derivatives were decoded, visually inspected and hashed; dimensions and source roles are recorded in the asset manifest. The exact identity vectors are preserved.
- Git whitespace check and JavaScript syntax checks passed.
- Three approved Higgsfield generations completed: a clean 4K background plate, a 4K studio image and a Seedance 2.5 camera shot. Their fresh quoted prices totalled 136.50 credits, within the approved ceiling. No paid retries were submitted; this is a quote record, not an independent billing audit.
- The delivered web video was decoded and measured: 1920 × 1080, H.264/yuv420p, silent, 193 frames at 24 fps, 8.041667 seconds and 3,553,215 bytes. Faststart encoding places a keyframe every six frames, or 0.25 seconds.
- Sampled visual inspection passed for 32 frames at 4 fps, plus full-resolution frames 0, 96 and 192. This supports the sampled geometry, lighting and composition checks, but does not establish continuous playback quality.
- The production files, matching stills and responsive image derivatives are integrated and recorded in the media manifests.

## Not performed / blocked

- Normal-speed video playback has not been inspected.
- The required managed preview browser skill is not available in this session. Desktop/mobile screenshots, actual animation timing, frame presentation, touch and keyboard behaviour, reduced-motion rendering, overflow and real browser performance are unverified. The managed preview instructions prohibit substituting another browser automation route.
- No live form endpoint or verified email address is configured. The local brief builder prepares information on the visitor's device and explicitly states that nothing is sent.
- The owner-private Site deployed successfully at https://nu-labs-cinematic.mikeynu.chatgpt.site. Deployment success was confirmed by the native hosting result. GitHub PR #2 remains a draft because browser and live enquiry checks are outstanding.
- The source checks do not prove visual fidelity, video continuity, accessibility conformance or performance.

## Remaining release checks

1. Inspect normal-speed playback of the delivered video.
2. Run temporal browser QA at representative desktop, tablet, phone and short-height sizes, including reverse/fast scroll and failed media. Check overlay placement against the actual displayed crops.
3. Verify reduced motion and live preference changes, focus/Tab order, anchors, direct routes and Back/Forward.
4. Configure the owner’s actual contact delivery. Replace concept project content with verified client work when available.

Only after those checks should `src/content/media.json` use `status: "verified"` and the branch be treated as a finished cinematic release.
