# Software showcase QA

Date: 19 October 2026. Baseline: 1905418. Implementation branch: revision/software-solutions.

The website now uses six newly generated Higgsfield device photographs with exact authored UI artwork. Business-card, apparel, reception and office-people images from the CI are removed from the active site and deployable assets. Service copy covers ERP, CRM, POS, AI/chatbots, cybersecurity software and native Android/iOS development.

## Source and export checks

- Six single-image Higgsfield jobs completed using GPT Image 2.5 Sunburst, max quality and the 4K setting. ERP was inspected and composited before the remaining five jobs. No repair generation, paid upscaling or new video.
- Every original PNG is **3504 x 2336 pixels**. The actual dimensions are recorded, not relabelled as a 3840- or 4096-pixel source.
- Original plates, exact SVG UI, measured screen corners, native-size WebP masters, generation recipes and reproducible composition scripts are tracked. Source/master hashes and variant sizes are in `art/product-ui/production.json`.
- Eighteen web variants are delivered at 800, 1600 and 2400 pixels wide. The 1600-pixel exports range from approximately 113 to 209 KB.
- Inspected all six staged compositions at 1800 x 1200. Screen alignment, device support, keyboard/stand geometry, light direction, typography and demo-data consistency were reviewed. No consequential visible defects remained at the reviewed sizes.
- Exact SVG text is independently editable. CRM counts reconcile, POS basket arithmetic is correct, and all software activity is explicitly illustrative.
- Increased the mobile time badge after visual review. Small dashboard text is naturally not fully readable in thumbnail placements; every solution detail page links to its flat SVG study for close inspection.

## Executed checks

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Unit suite | PASS | 69 tests on local Windows Node 26 |
| Build and resource validation | PASS | 11 pages plus 404; local links, fragments, image markup and CSS resources |
| Browser regression | PASS | Edge, 8 scenarios, 72 captures, zero console errors or warnings: desktop, mobile, reduced motion, no-JS mobile, routes/filter, mobile menu, local enquiry and horizontal focus |
| Gallery refinement | PASS | Repeated desktop, short viewport and horizontal-focus scenarios after changing panel width: 48 captures, zero errors or warnings |
| Photographic placement | PASS | All six detail routes at 1440 x 1000 and 390 x 844; 12 decoded image placements, correct responsive WebP selection, uncropped contain fit, full-detail links and no horizontal document overflow |
| Visual website inspection | PASS for inspected views | Desktop gallery at multiple travel positions, solution grid and ERP detail; mobile solution detail views, grid and Studio |
| Independent review | PASS for reviewed scope | Fresh reviewer inspected six final composites and integrated desktop/mobile captures; source-level mobile time-badge finding corrected |
| CI-exclusive imagery removal | PASS | No active references to the eight retired card, apparel, reception or office image variants |
| Original motion behaviour | PASS in executed scope | Four video landings, reverse/interrupted scroll, keyboard access, bounded horizontal gallery and transparent-to-solid home header handoff |
| Retired project redirects | Configured; hosted check NOT RUN | Three previous showcase URLs redirect to /work/ through vercel.json |
| Production deployment | NOT RUN | Local QA and repository delivery do not certify a hosted deployment |

## Corrections made from actual renders

1. CRM card text overlap was removed in the UI preparation stage.
2. POS item pictures were replaced with distinct notebook, pen, bag, mug, planner and gift-card artwork.
3. The phone's time label was enlarged after native-size composite review.
4. Horizontal gallery panels were resized around the staged photographs, removing large empty side bands while retaining the native scrolling architecture.
5. The long Cybersecurity detail heading was resized on narrow screens after a 9-pixel document overflow was detected at 390 pixels.
6. Interior-page navigation was made fully opaque so content does not show through it while scrolling. Home navigation still shares the hero background throughout the video journey.

The placement harness was also corrected to select only the Studio photograph, and to respect density-corrected `naturalWidth` for width-descriptor srcsets. Those were inspection-script errors, not missing website images. The final placement run completed successfully.

## Reproduction and scope

Raw local captures/reports are in `qa-output/software-showcase-final`, `qa-output/software-showcase-refinement`, `qa-output/showcase-placement` and `qa-output/showcase-composites`. These large working artifacts are ignored by Git. `scripts/showcase-qa.mjs` reproduces the photographic placement checks using the existing Playwright/Edge environment variables. Browser harness success certifies its assertions; the visual inspection above is a separate review of the actual renders.

The contact destination remains unconfigured, so the enquiry form prepares a local brief. The existing hero video remains marked candidate-review because its fourth shot returns toward the opening view. Those pre-existing release limits were not silently marked resolved. The software interfaces are illustrative concepts using demo data, not screenshots of existing customer deployments.
