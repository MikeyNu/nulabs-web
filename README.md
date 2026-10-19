# Nu Labs

A bright, monochrome studio website built around the approved three-part sculptural identity. Exact SVG branding and live Instrument Sans typography sit above the cinematic background. The first two desktop chapters share one camera journey; the rest of the site returns to editorial reading.

## Current state

This branch contains a **verified Windows Edge review build**. Production media and browser regression checks pass. Live enquiry delivery remains the release blocker.

- Eight static pages: Home, Work, Studio, Services, Contact, and three project details.
- Responsive layouts, project filters, mobile navigation, native FAQ disclosures, and a local project-brief builder.
- A bounded native-scroll video controller with coalesced seeking, reading holds, static fallbacks and motion controls.
- Exact approved logo vectors, a local variable WOFF2 font and responsive brand application images.
- The approved clean 4K background plate, 4K studio image and 1080p camera shot are generated and integrated. The silent H.264 web video is 3,553,215 bytes, with 193 frames at 24 fps and a keyframe every 0.25 seconds.
- All three approved generations completed without paid retries. Their fresh quoted prices totalled 136.50 credits, within the approved ceiling.
- All 42 unit tests passed on Windows and Linux, and all 17 Windows Edge browser cases passed. Actual video scrubbing, responsive layouts, history restoration, reduced motion, failure handling and local interactions were exercised. Desktop, mobile and secondary-route screenshots were inspected.
- No live enquiry delivery or verified company email address is configured. The form prepares a brief locally and clearly says that nothing is sent. It never reports a fictitious successful submission.

The fallback layout is designed to remain readable when motion is disabled or media is unavailable. No generated screenshot is substituted for the website, and no reference footage from MotionSites is shipped.

## Build

Node.js 20 or later. The website has no third-party JavaScript runtime dependencies. The optional browser QA harness uses an existing browser and an externally supplied Playwright Core module.

```sh
npm run build
npm test
npm run check
```

The build produces `dist/`. For a repository subpath, set the base consistently:

```sh
BASE_PATH=/nulabs-web npm run build
BASE_PATH=/nulabs-web npm run check
```

All routes have real HTML entry points, so direct links and browser history work without a custom router. Serve `dist/` with a static host that resolves directory `index.html` files. `dist/404.html` and `.nojekyll` are included.

## Browser QA

`scripts/browser-qa.mjs` runs 17 browser scenarios using the supplied local tools. It does not install a browser or add a project dependency. Set the environment variables below, build the site, then run:

```sh
npm run qa:browser
```

| Variable | Value |
| --- | --- |
| `NU_QA_ROOT` | Absolute path to this repository |
| `NU_QA_PLAYWRIGHT` | Absolute path to an existing Playwright Core `index.mjs` |
| `NU_QA_BROWSER_PATH` | Absolute path to an existing browser executable |
| `NU_QA_OUTPUT` | Optional output directory; defaults to the ignored `qa-output/` directory in this repository |
| `NU_QA_CASES` | Optional comma-separated case selection; omit for the full suite |

Use a controlled test session and inspect the generated evidence. A passing selected-case run does not substitute for the full suite or visual review. The recorded validation below covers Windows Edge only.

## Editing

| File | Purpose |
| --- | --- |
| `src/content/site.json` | Copy, projects, services and factual limits |
| `src/content/media.json` | Actual delivered media paths and release status |
| `scripts/build.mjs` | Shared HTML components and route composition |
| `src/styles/site.css` | Responsive type, layout, shapes and motion states |
| `src/scripts/journey.mjs` | Scroll-to-time mapping and video lifecycle |
| `src/scripts/site.mjs` | Menu, work filter and local enquiry behaviour |
| `public/assets/manifest.json` | Real image dimensions, derivatives and source roles |
| `docs/storyboard.json` | Camera, content, accessibility and verification contract |

Most copy is available in the content file. A few short composition-specific headings are authored directly in the build templates. Avoid treating unverified company facts or example projects as real client evidence.

## Media finishing

1. Completed: the approved clean architectural plate contains no baked interface.
2. Completed: one Seedance 2.5 shot was generated from the inspected clean plate.
3. Sampled visual inspection passed: 32 frames at 4 fps, plus full-resolution opening, midpoint and final frames. Automated full-clip playback in the final Edge run reported 193 total frames, four dropped frames and 189 presented-frame callbacks. Visual review covered sampled frames and screenshots, not continuous normal-speed playback.
4. Completed: silent H.264/yuv420p faststart encoding, 0.25-second keyframe intervals, matching opening and final stills, and responsive WebP studio images.
5. Completed: actual delivered files and dimensions are registered in the manifests. Media status is `verified` for the documented Windows Edge test scope.
6. All 17 browser cases passed, including desktop, phone, tablet and short viewports; forward, reverse and fast scrubbing; midpoint reload and history restoration; live reduced-motion changes; blocked video; and no-JavaScript fallback.

The runtime adds the tall sticky stage only after a frame is presented. Narrow screens, portrait tablets, short windows and reduced-motion users receive a normal-flow sequence. No smooth-scroll engine or wheel interception is used.

## Release gates

```sh
node scripts/check.mjs --release
```

This correctly fails only for the missing live contact destination. Media verification records the scoped browser evidence; it does not certify enquiry delivery. The local brief builder is functional, but does not send enquiries. The refreshed private review is deployed at [nu-labs-cinematic.mikeynu.chatgpt.site](https://nu-labs-cinematic.mikeynu.chatgpt.site), with hosting success confirmed. [GitHub PR #2](https://github.com/MikeyNu/nulabs-web/pull/2) is merged.

Browser evidence is limited to Windows Edge. Emulated phone and tablet viewports are not real-device tests; Safari, Firefox and full accessibility conformance have not been verified. See `docs/verification.md` and `docs/browser-qa-summary.json` for the recorded scope and results.

## Attribution

Instrument Sans is distributed under the SIL Open Font License in `public/assets/OFL-InstrumentSans.txt`. Nu Labs identity and supplied brand assets remain the company’s material. Generated images are illustrative; concept case studies are labelled. The original repository MIT licence remains unchanged.
