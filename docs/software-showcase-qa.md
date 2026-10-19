# Software showcase draft QA

Date: 19 October 2026. Baseline: 1905418. Branch: revision/software-solutions.

This records the copy and exact UI preparation stage only. Higgsfield device imagery has not been generated. Final photographic composition, realism, delivered resolution and website integration are NOT RUN and remain required.

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Existing unit suite | PASS | 69 tests on local Windows Node 26 |
| Build and resource checks | PASS | 11 pages plus 404; local URLs, fragments, CSS and image resources |
| Existing browser harness | PASS | Edge, 7 scenarios, 70 captures, zero errors/warnings; desktop, mobile, reduced motion, routes/filter, mobile menu, local enquiry, horizontal focus |
| Exact UI text bounds | PASS | Rendered all six SVGs in Edge at 1600x1000 desktop or 768x1536 mobile; no text outside the viewport |
| UI visual review | PASS for draft | Inspected each native-size image; corrected CRM overlapping text; replaced generic POS icons with item illustrations; checked demo arithmetic and explanatory labels |
| Page visual review | PASS for inspected draft states | Desktop opening, horizontal introduction, Studio and Services masthead; mobile ERP card and Studio. Final staged imagery still pending |
| Fresh review | PASS for draft | Independent review of six SVGs, claims, routes and asset mappings; owner-context wording corrected to match the CRM study |
| CI-only image removal | PASS | Four asset groups/eight variants removed from public assets; no active references to stationery, apparel, reception or office scenes |
| Runtime motion preservation | PASS in executed browser scope | Existing four video landings, reverse/interrupted scroll, horizontal rail and transparent header handoff retained |
| Old project URL redirects | Configured, hosted check NOT RUN | Three retired showcase URLs point to /work/ in vercel.json |
| Final asset and public launch approval | NOT RUN | Paid images awaiting allocation; independent contact and hero-video release limits remain |

Raw browser evidence is local under qa-output/software-showcase and qa-output/software-showcase-ui. The original mobile Studio capture was taken during the existing reveal transition; a settled JPEG was inspected separately. Visual review must distinguish transient animation states from permanent missing content.

No paid generation, new video, production deployment or main-branch publication occurred during this preparation stage. The next step is to approve a bounded image allocation, refresh the exact quotes, run the Higgsfield preflight and generate one ERP plate before committing the remaining shots.
