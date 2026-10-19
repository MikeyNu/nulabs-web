# Nu Labs

A bright, monochrome studio website built around the approved three-part sculptural identity. Exact SVG branding and live Instrument Sans typography sit above the cinematic background. The first two desktop chapters share one camera journey; the rest of the site returns to editorial reading.

## Current state

This branch contains an **implementation draft**, not a completed cinematic release.

- Eight static pages: Home, Work, Studio, Services, Contact, and three project details.
- Responsive layouts, project filters, mobile navigation, native FAQ disclosures, and a local project-brief builder.
- A bounded native-scroll video controller with coalesced seeking, reading holds, static fallbacks and motion controls.
- Exact approved logo vectors, a local variable WOFF2 font and responsive brand application images.
- Production video, clean background plate and new studio image are awaiting a separately authorized Higgsfield allocation.
- Browser visual, temporal, responsive and accessibility verification is still required. Unit tests do not establish those results.
- No live enquiry delivery, verified email address or domain has been supplied. The form prepares a brief locally and clearly says that nothing is sent. It never reports a fictitious successful submission.

The fallback layout remains readable while media is absent. No generated screenshot is substituted for the website, and no reference footage from MotionSites is shipped.

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

1. Remove all baked UI from the approved still through the authorized image edit, preserving the architecture.
2. Inspect that plate, then submit the single approved 8-second Seedance 2.5 1080p camera move.
3. Inspect the whole clip, geometry, lighting and actual negative space. Set the final timeline and text positions from the result.
4. Preserve the source master outside the public output. Prepare a seek-friendly H.264/yuv420p derivative with faststart and a measured keyframe interval. Derive static desktop/mobile compositions from inspected frames.
5. Install the actual files and set their paths in `media.json`. Do not insert guessed output paths or set `verified` before temporal QA.
6. Inspect desktop/mobile/short screens, fast and reverse scrolling, focus, route entry, live reduced-motion changes, video failure and no-JavaScript fallback.

The runtime adds the tall sticky stage only after a frame is presented. Narrow screens and reduced-motion users receive a normal-flow sequence. No smooth-scroll engine or wheel interception is used.

## Release gates

```sh
node scripts/check.mjs --release
```

This intentionally fails until required media, verification status and a real contact destination exist. It supplements, rather than replaces, visual and temporal browser QA. The draft has not been deployed as a finished public site.

## Attribution

Instrument Sans is distributed under the SIL Open Font License in `public/assets/OFL-InstrumentSans.txt`. Nu Labs identity and supplied brand assets remain the company’s material. Generated images are illustrative; concept case studies are labelled. The original repository MIT licence remains unchanged.
