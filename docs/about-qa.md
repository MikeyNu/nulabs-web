# About page release review

Reviewed on 19 October 2026 against main `4e98e8169399e6e026f0bb6e28b3e0194e79a9a5`, in an isolated Windows worktree. The user's primary checkout was not changed.

## Asset verification

One user-approved Higgsfield GPT Image 2.5 Sunburst generation completed. The quote was 15 credits; no paid retry was submitted. The generation response did not separately expose the final debit.

The requested setting was 4K, maximum quality, transparent. The actual delivered master is **2880 × 2880 RGBA**, 7,312,377 bytes. It has genuine zero-alpha surroundings and native soft alpha on the object, with core alpha values of 251 to 254. The source was not artificially upscaled or described as 4096px. Hashes and export details are recorded in `art/about/production.json`.

| Export | Dimensions | Bytes | Alpha |
| --- | --- | ---: | --- |
| computer-800.webp | 800 × 800 | 72,410 | Verified |
| computer-1400.webp | 1400 × 1400 | 152,138 | Verified |
| computer-2200.webp | 2200 × 2200 | 318,496 | Verified |

The master and all three exports were visually inspected on contrasting backgrounds. The complete computer and keyboard, casing perspective, blank key rows, glass and silhouette are coherent at the delivery sizes. No lettering or logo was generated. These are transparent raster files, not editable vector geometry. The vector blockout is retained only as an authoring study and is not shipped in the public page.

## Automated gates

Commands ran against the final files using Node 26 on Windows, with Edge controlled through Playwright. No runtime dependencies were introduced.

| Gate | Result |
| --- | --- |
| `npm test` | 79 passed; 0 failed |
| `npm run build` | 11 pages generated |
| `npm run check` | 12 HTML routes, links, fragments, assets, metadata, schema and sitemap passed |
| `npm run qa:about` | All seven viewport and fallback cases passed; no browser errors |
| `npm run qa:seo` | 11 routes crawled without JavaScript; no orphan routes; canonical, schema, indexing and real 404 checks passed; eight rendered views passed |

About cases: 1440 × 1000 desktop, 390 × 844 mobile, 320 × 740 narrow mobile, 820 × 1180 tablet, 1440 × 700 short desktop, reduced-motion desktop and no-JavaScript mobile. Checks cover company facts, heading count and bounds, real font loading, horizontal overflow, responsive image loading, deep links, browser back, mobile navigation and Escape.

The horizontal chapter was exercised forward at 0, 25, 50, 75 and 100 percent, then backward to 50 and 0 percent. Its counter follows the nearest card centre. Live reduced-motion switching restores normal flow and keeps the active card in view. Mobile, tablet, short viewport and reduced-motion presentations use stacked cards. Motion is scroll-driven and contains no autoplay loop.

## Visual review and resolved defects

The primary author and a separate visual reviewer inspected actual browser screenshots. The review covered the generated object, desktop and mobile openings, tablet, narrow mobile, dark binary section, horizontal sequence, remote section and reduced-motion layout. The final independent review reported no remaining visual blocker in the inspected views.

Resolved before release:

- Narrow-screen headline clipping and tablet computer/type overlap.
- Distracting binary ornament beside the mobile headline.
- Chapter counter advancing before the dominant card changed.
- Crowded mobile typographic artwork.
- Missing space in the horizontal chapter heading.
- An irrelevant demo-interface footer qualifier on the About page.

The header's settled background was inspected after its existing transition. Essential copy remains live HTML. Legal name, founding year, remote working model and Fourways location match the user's supplied facts. No physical office, staff identities, client results or certifications are invented.

## Performance interpretation and limits

The local browser diagnostic records zero layout-shift entries throughout ordinary loading and forward/reverse scrolling in the tested cases. Changing the reduced-motion preference while inside the horizontal chapter deliberately recomposes it into vertical flow; the diagnostic sum becomes 0.77475 at that step only. This simple observer sum is not a standardized session-window CLS result, a Lighthouse score or field data.

The desktop run observed one long task; the mobile run observed none. Local LCP observations are not published as real-world performance claims. There was no human audience study, assistive-technology audit or full cross-browser device lab. Screenshots and deterministic scroll states support the recorded visual conclusions; they do not establish that every possible interaction or display is defect-free.

Reproducible browser script: `scripts/about-browser-qa.mjs`. Local evidence remains in the ignored `qa-output/about-final/` and `qa-output/about-seo/` directories. The automated report leaves `visualReview` unasserted; the separate review is documented here rather than misrepresented as an automated pass.
