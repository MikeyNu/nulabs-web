# Nu Labs

A bright, monochrome studio website built around the approved three-part sculptural identity. Exact SVG branding and live Instrument Sans typography sit above the cinematic background. The first two desktop chapters share one camera journey; the rest of the site returns to editorial reading.

## Current state

This branch contains an **integrated review draft**. Production media is installed; browser verification and live enquiry delivery remain release gates.

- Eight static pages: Home, Work, Studio, Services, Contact, and three project details.
- Responsive layouts, project filters, mobile navigation, native FAQ disclosures, and a local project-brief builder.
- A bounded native-scroll video controller with coalesced seeking, reading holds, static fallbacks and motion controls.
- Exact approved logo vectors, a local variable WOFF2 font and responsive brand application images.
- The approved clean 4K background plate, 4K studio image and 1080p camera shot are generated and integrated. The silent H.264 web video is 3,553,215 bytes, with 193 frames at 24 fps and a keyframe every 0.25 seconds.
- All three approved generations completed without paid retries. Their fresh quoted prices totalled 136.50 credits, within the approved ceiling.
- Browser visual, temporal, responsive and accessibility verification is still required. Unit tests do not establish those results.
- No live enquiry delivery, verified email address or domain has been supplied. The form prepares a brief locally and clearly says that nothing is sent. It never reports a fictitious successful submission.

The fallback layout is designed to remain readable when motion is disabled or media is unavailable. No generated screenshot is substituted for the website, and no reference footage from MotionSites is shipped.

## Build

Node.js 20 or later. There are no third-party JavaScript dependencies.

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
2. Completed: one Seedance2.5 shot was generated from the inspected clean plate.
3. Sampled sequence inspection passed: 32 frames at 4 fps, plus full-resolution opening, midpoint and final frames. Normal-speed playback remains unverified.
4. Completed: silent H.264/yuv420p faststart encoding, 0.25-second keyframe intervals, matching opening and final stills, and responsive WebP studio images.
5. Completed: actual delivered files and dimensions are registered in the manifests. Status remains `integrated-awaiting-browser-qa`.
6. Inspect desktop/mobile/short screens, fast and reverse scrolling, focus, route entry, live reduced-motion changes, video failure and no-JavaScript fallback.

The runtime adds the tall sticky stage only after a frame is presented. Narrow screens, portrait tablets, short windows and reduced-motion users receive a normal-flow sequence. No smooth-scroll engine or wheel interception is used.

## Release gates

```sh
node scripts/check.mjs --release
```

This intentionally fails until required media, verification status and a real contact destination exist. It supplements, rather than replaces, visual and temporal browser QA. The private review is deployed at https://nu-labs-cinematic.mikeynu.chatgpt.site, with success confirmed by the hosting service. [GitHub PR #1](https://github.com/MikeyNu/nulabs-web/pull/1) remains a draft until browser QA and live enquiry delivery are completed.

## Attribution

Instrument Sans is distributed under the SIL Open Font License in `public/assets/OFL-InstrumentSans.txt`. Nu Labs identity and supplied brand assets remain the company’s material. Generated images are illustrative; concept case studies are labelled. The original repository MIT licence remains unchanged.
