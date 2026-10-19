# Nu Labs

Software showcase revision: six website-specific Higgsfield device photographs now present ERP, CRM, POS, native mobile, AI and cybersecurity concepts with exact authored interfaces. Copy reflects Nu Labs software capabilities, and CI-only mockups have been removed. See [the revision direction](docs/software-showcase-direction.md) and [QA record](docs/software-showcase-qa.md).

A monochrome software engineering website with a Higgsfield camera journey, live HTML overlays, a bounded horizontal work gallery and a bright editorial studio section.

## Build and preview

Node 20 or later. The site has no runtime dependencies and needs no install step.

~~~powershell
npm run build
npx serve dist
~~~

Open http://localhost:3000. Rebuild after editing source files. Each route has its own index.html, so use a static server instead of opening HTML directly.

~~~powershell
npm test
npm run check
~~~

All assets required by the build, including the Higgsfield video, eight chapter posters, six staged software scenes, exact UI studies, fonts and logos, are tracked in this repository. A clean checkout does not depend on a temporary preview folder. The generated dist directory is excluded from Git.

## Current experience

- Navigation stays transparent throughout the pinned video journey. Its solid background appears when the pinned stage releases into the next section and disappears on reverse scrolling.
- Four HTML chapters use inspected video times 0, 4.5, 8.25 and 11.75 seconds.
- Copy appears over the corresponding presented frame, with space cleared during the main camera moves.
- The work gallery carries an introductory panel and three project panels horizontally, then returns to normal vertical flow.
- Native scrolling is the sole scroll owner. No wheel interception or smooth-scroll engine.
- Phones and tablets scrub the same Higgsfield camera journey using a 960 × 540 H.264 derivative. Rotation preserves the chapter position.
- Reduced motion, unavailable media and no JavaScript retain complete normal-flow chapters. The mobile work gallery remains in normal flow.
- Solutions, Studio, Services, Contact and six solution-detail routes are available.
- The contact form prepares an enquiry locally. Live delivery is not configured.

The active background is the reviewed 1080p Seedance 2.5 output generated through Higgsfield from the original approved starting plate. The clip delivers three distinct viewpoint families and a return toward the opening view. Its final camera angle does not match the proposed reverse-side shot. This limitation is retained in the media review status; repository publication does not certify full storyboard compliance.

## Source map

| File | Purpose |
| --- | --- |
| src/content/site.json | Brand, services and project copy |
| src/content/media.json | Active video, chapter posters and inspected times |
| scripts/build.mjs | Shared components and interior templates |
| scripts/home-v2.mjs | Four chapters, horizontal work and home composition |
| src/styles/home-v2.css | Home art direction and Higgsfield overlay placement |
| src/scripts/site.mjs | Navigation handoff, menus, filters and enquiry builder |
| src/scripts/journey-v2.mjs | Presented-frame coordination and horizontal travel |
| public/assets/video/journey-higgsfield.mp4 | Browser-ready H.264 video |
| public/assets/manifest.json | Active asset metadata |
| public/assets/solutions/ | Responsive device photographs and exact SVG UI studies |
| art/product-ui/ | Generation recipes, original plates, composition tools and native-size masters |
| art/product-ui/production.json | Actual dimensions, hashes and delivered web variants |
| art/higgsfield/journey-master.mp4 | Original provider master |
| art/higgsfield/media-verification.json | Source and delivery hashes and measurements |
| docs/higgsfield-integration.md | Current verification and known limits |

Earlier Blender authoring sources and video versions remain available as historical material. They are not selected by the current media configuration. All headings and navigation remain real HTML text. Concept projects do not imply clients or measured business outcomes.

## Browser QA

The optional browser harness uses Playwright Core and an existing browser supplied through environment variables. These are QA tools, not website runtime dependencies.

~~~powershell
$env:NU_QA_PLAYWRIGHT = 'C:\path\to\playwright-core\index.mjs'
$env:NU_QA_BROWSER_PATH = 'C:\path\to\msedge.exe'
$env:NU_QA_URL = 'http://localhost:3000'
npm run qa:browser
~~~

Run `node scripts/mobile-scrub-qa.mjs` with the same environment variables for touch, rotation, presented frames and mobile fallbacks. Set `NU_QA_ENGINE=webkit` for WebKit checks. See [mobile scrubbing verification](docs/mobile-scrub-qa.md) for the scope and physical-device limitation.

NU_QA_OUTPUT and NU_QA_CASES optionally choose an evidence folder and scenario subset. The harness checks actual presented frames; its pass does not independently certify visual art direction. See docs/higgsfield-integration.md for the executed scope.

## Search and sharing

The production origin is `https://www.nulabs.co.za`, verified against the connected Vercel project. Each page has unique search copy, a canonical URL, Open Graph/Twitter metadata and truthful structured data. The build generates robots.txt and sitemap.xml. Vercel previews and custom review environments emit noindex; a production build remains indexable.

Edit `meta_title` and `meta_description` in `src/content/site.json`. The optional `SITE_URL` override must be an HTTPS origin. Use `SEO_NOINDEX=1` for a non-Vercel staging build; leave `BASE_PATH` unset on Vercel. Keep Vercel system environment variables enabled. Search Console sitemap submission is a separate owner/account step.

`npm run check` now checks generated SEO output as well as local resources. `npm run qa:seo` uses the existing NU_QA_PLAYWRIGHT, NU_QA_BROWSER_PATH, NU_QA_URL and NU_QA_OUTPUT settings to crawl all pages without JavaScript and inspect desktop/mobile rendering. See [the audit and maintenance guide](docs/seo-audit.md) for findings, evidence and remaining business requirements.

The seven social PNG previews are generated from editable layouts in `art/social/render.mjs`; rendering them is an optional authoring operation, not a build dependency. Webpage photography remains WebP and the interface studies remain editable SVG.

## Release limits

~~~powershell
node scripts/check.mjs --release
~~~

The strict release gate remains blocked by the documented media review status and the unconfigured enquiry destination. A repository push is not a hosted deployment or evidence that those requirements have been completed.

For a repository subpath, set BASE_PATH consistently for build and check. Eleven routes plus a 404 document are generated.

## Attribution

Instrument Sans uses the SIL Open Font License included in public/assets/OFL-InstrumentSans.txt. Nu Labs identity and supplied brand assets remain the company's material. The six website-specific interface studies use demo data and are labelled as illustrative. CI-only apparel, stationery, reception and office imagery is excluded from the website. The original MIT licence remains unchanged.

## Vercel

Import this repository with Framework Preset **Other** and repository root as Root Directory. `vercel.json` skips installation, runs tests/build/output checks, and serves `dist` with folder-based routes. Select Node.js 24.x and leave BASE_PATH unset. See [Vercel deployment](docs/vercel-deployment.md) for import settings, hosted verification and the existing launch limitations. No Vercel deployment is created by these configuration files alone.
