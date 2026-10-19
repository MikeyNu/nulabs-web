# Nu Labs software showcase revision

Status: six website-specific Higgsfield photographs have been generated, fitted with exact interface artwork and integrated. Final browser and placement review is recorded separately in software-showcase-qa.md.

## Positioning and evidence

Help business decision makers recognise Nu Labs as a software engineering and UI/UX company by showing useful software in the context of the devices people use. The founder supplied ERP, CRM, POS, AI, chatbot, cybersecurity and native Android/iOS capabilities, including in-house solutions. Present those capabilities directly. No product names, deployment numbers, certifications, testimonials or customer results were supplied.

The six newly drawn interface concepts use demo data. They are website-specific illustrations, not claimed screenshots of the existing in-house products. Business cards, apparel, reception imagery and generated office people from the CI have been removed from the active site and public asset set. Identity logos, typography and the approved hero video remain.

## Art direction

The user has selected cinematic device photography. Develop within that direction: controlled materials, a deliberate light source, a clear screen and calm surrounding space. The product's actual task must carry the image. No ornamental dashboards, fictitious impact graphs, neon hacker imagery, glass cards or generic glowing AI brains.

| Solution | Screen task | Photographic setting |
| --- | --- | --- |
| ERP | Prioritise inventory, purchase and order exceptions | Graphite laptop, warm-white surface, oblique morning light |
| CRM | See opportunity stage, activity and next action | Desktop monitor, quiet daylight and a single notebook |
| POS | Build a basket and review the sale | Countertop terminal and separate receipt printer |
| Mobile | Find the next field visit and open the job | One supported upright phone in a white architectural alcove |
| AI | Answer from a named source with human handoff | Silver laptop, restrained glass-partition background |
| Cybersecurity | Prioritise and investigate simulated incidents | Calm monitor setup, graphite desk, clear daylight |

`art/product-ui/build-ui.mjs` creates the exact SVG UI masters and an HTML review board. `art/product-ui/shot-requests.json` contains six complete GPT Image 2.5 Sunburst requests: 4K, max quality, 3:2, one output each. No reference images are needed for the blank device plates. Every device screen is deliberately neutral so the authored UI can be placed with exact lettering and icons. Inspect the generated device geometry before fitting the UI to its actual screen quadrilateral. Preserve a flat full-resolution screen as well as the staged scene. If the perspective becomes too strong for readable text, repair the shot rather than accepting illegibility.

## Production record

Six single-image submissions completed in Higgsfield using GPT Image 2.5 Sunburst, max quality and the 4K setting, with no repair generation, paid upscaling or video regeneration. The ERP plate was inspected and composited before the remaining five submissions. All six provider PNGs are 3504 x 2336 pixels at the requested 3:2 ratio. These are the actual native dimensions; the sources have not been enlarged to claim a 3840- or 4096-pixel width.

Original photographic plates, exact SVGs, measured screen quadrilaterals, native-size composites and the generation recipes are tracked under `art/product-ui/` and `public/assets/solutions/`. `production.json` records source hashes and dimensions. Account identifiers, provider delivery URLs and the spending audit remain private. The website serves 800-, 1600- and 2400-pixel WebP variants. Flat SVG links retain fully inspectable text and icon detail.

To edit the screen artwork, run `node art/product-ui/build-ui.mjs`, render it using `render-screens.mjs` with the existing Playwright and browser environment variables, then run `compose-scenes.py` and `register-assets.py` with Python and Pillow. These are optional authoring tools, not site runtime or build dependencies. The normal build consumes the already tracked exports and calls no image provider.

## Website structure and motion

Keep the approved four-chapter video and navigation handoff. Reword its overlays around software, operational clarity, engineering and extended capability. Keep the home horizontal rail bounded to three representative solutions: ERP, mobile and cybersecurity. The Solutions page covers all six areas with direct detail routes and category filters. Studio explains the engineering and design approach. Services and enquiry interests use the actual offering.

Product imagery is a quiet reading zone. The existing horizontal rail explains progression across the three examples; no additional parallax or decorative entrance timeline is needed. Mobile and reduced-motion layouts retain normal reading flow. Essential capabilities and captions remain HTML, never embedded only in a photographic screen.

## Acceptance gates

1. No CI-exclusive imagery appears in built pages or the deployable public asset set.
2. Each solution is recognisable from the UI task and adjacent copy; no unsupported company evidence or live-product claim.
3. Exact labels, coherent table rows, correct icons, no clipping, and readable essential UI at the intended placed size. Offer the flat UI study for full-detail inspection.
4. Generated scene: correct device geometry, corners, keys, stand/support, reflection, shadow and material. Inspect full composition and delivery-size crops, not just a thumbnail.
5. Verify actual image dimensions, master and web variants, decode and download budgets. A 4K setting is a request, not proof of delivered pixels.
6. All routes and filters, mobile menu, no-JS content, keyboard focus, enquiry honesty, reduced motion, forward/reverse scrubbing and header handoff remain functional.
7. Inspect desktop and mobile screenshots and temporal journey states. Build success alone does not certify art direction.

## Known independent launch limits

The contact destination is still unconfigured. The existing hero video remains candidate-review because the fourth shot returns towards its opening view. This asset revision does not resolve those separate limitations.
