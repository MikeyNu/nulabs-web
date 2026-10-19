# Nu Labs

A monochrome design and software studio site. The revised home page moves through four camera compositions, turns into a bounded horizontal work gallery, and returns to a bright editorial studio section.

## Local preview

Node 20 or later. No runtime dependencies or install step.

```powershell
npm run build
npx serve dist
```

Open http://localhost:3000. Rebuild after changing source files. Each route is its own directory with an index.html, so use a static server instead of opening files directly.

```powershell
npm test
npm run check
```

## Revision two

- Transparent, edge-to-edge opening navigation becomes solid after scrolling.
- Four distinct camera landings at 0, 4, 8 and 12 seconds.
- Flat semantic HTML overlays appear only over their matching presented video frames.
- A black gallery carries one introductory panel and three project panels horizontally, then releases into the studio section.
- Native vertical scrolling remains the sole scroll owner. No wheel interception or smooth-scroll engine.
- Narrow, portrait, short and reduced-motion layouts use complete normal-flow chapters.
- Static content remains available when JavaScript or video fails.
- Existing Work, Studio, Services, Contact and three project-detail routes remain available.
- The contact form prepares an enquiry locally. No email or live submission endpoint is configured.

The camera sequence is authored locally in Blender from the supplied symbol. Revision two uses no additional paid generation credits. Existing generated studio/application imagery remains labelled as illustrative concept work.

## Source map

| File | Purpose |
| --- | --- |
| src/content/site.json | Brand, service and project copy |
| src/content/media.json | Active camera media and verification status |
| scripts/build.mjs | Shared components and interior-page templates |
| scripts/home-v2.mjs | Four chapters, horizontal work and editorial home composition |
| src/styles/site.css | Shared typography and interior layouts |
| src/styles/home-v2.css | Revised home art direction and responsive treatments |
| src/scripts/site.mjs | Navigation, editorial entrance, filters and enquiry builder |
| src/scripts/journey-v2.mjs | Four-chapter media conductor and bounded horizontal travel |
| src/scripts/journey.mjs | Shared seek helpers and retained first-version implementation |
| docs/cinematic-storyboard-v2.json | Camera, reading-space and fallback contract |
| docs/v2-review-contract.md | Independent experience acceptance criteria |
| art/construction.py | Reproducible Blender scene and camera path |
| art/nu-labs-journey-v2.blend | Editable scene |
| art/README.md | Rendering, finishing and media evidence |

All headings and navigation remain real text. Concept projects do not imply clients or measured business outcomes.

## Browser QA

Use the existing Edge executable and Playwright Core module on the authorized desktop. No browser download or application dependency is required. The current harness is scripts/browser-qa-v2.mjs; scripts/browser-qa.mjs records the earlier two-chapter design and is retained as historical coverage.

The v2 review contract requires observing actual forward, reverse and interrupted camera movement, four settled compositions, horizontal traversal and release, responsive fallbacks, keyboard focus and navigation. Unit tests alone do not certify the art direction.

Earlier reports in docs/verification.md and docs/browser-qa-summary.json describe the first implementation. Refer to the v2 report for the revised site's evidence and limitations.

## Release

```powershell
node scripts/check.mjs --release
```

Live enquiry delivery remains unconfigured. The existing private hosted preview is the earlier design until explicitly refreshed; localhost contains the working revision.

For a repository subpath, set BASE_PATH consistently for build and check. Eight routes plus a 404 document are generated. No custom router is used.

## Attribution

Instrument Sans is distributed under the SIL Open Font License in public/assets/OFL-InstrumentSans.txt. Nu Labs identity and supplied brand assets remain the company's material. Generated images are illustrative and concept studies are labelled. The repository's original MIT licence remains unchanged.

### Run the current browser review on this desktop

With the local static server running:

```powershell
$env:NU_QA_PLAYWRIGHT = 'C:\Users\USER\AppData\Local\Temp\nulabs-web-qa-20261019\node_modules\playwright-core\index.mjs'
$env:NU_QA_BROWSER_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run qa:browser
```

Optional variables are NU_QA_URL, NU_QA_OUTPUT and NU_QA_CASES. The script records actual presented frames and writes screenshots plus a machine-readable report. Its success means the scenarios ran successfully; the separate visual judgment is recorded in docs/v2-verification.md.

## Revision two verification

The local Windows Edge review covers 64 passing unit tests and 14 browser scenarios, including actual presented-frame checks, four camera compositions, forward/reverse/interrupted scrubbing, horizontal travel and release, mobile/tablet/short layouts, reduced motion, media failure, no JavaScript, keyboard focus, history, navigation and the local enquiry builder. The final targeted rerun cleared the navigation diagnostic found in the first run. See docs/v2-verification.md for the visual judgment and exact run scope. Physical mobile devices, Safari and Firefox were not tested.
