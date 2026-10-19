# Nu Labs v2 verification

**PASS for local review. Client creative approval remains pending.**

Reviewed the v2 working tree on branch `revision/cinematic-journey-v2`, based on commit `92f15476b58ef130b2a68b392aab157eb52f6293`. The companion JSON records source hashes, run times and exact scope.

## Executed browser coverage

Existing Microsoft Edge 155.0.4283.62, served at http://localhost:3000. Viewports: 1440 x 900, 390 x 844, 768 x 1024 and 1440 x 600. The runner uses existing Playwright and Edge installations.

| Run | Result | Meaning |
| --- | --- | --- |
| v2-integrated-01 | 11 passed, 3 failed of 14 | Initial full suite. Route/filter, menu and history checks encountered cross-document ViewTransition diagnostics. |
| v2-integrated-02 | 4 passed, 0 failed | After removing optional ViewTransition rules: repeated desktop temporal capture and all three affected scenarios. |

All 14 unique scenarios passed across the initial run and targeted recheck. This is not a claim that the full suite was rerun twice. The targeted rerun had zero unexpected console errors and zero video settle warnings.

Coverage includes four camera holds, sweep samples, reverse travel, interrupted scrolling, horizontal gallery travel and release, rail keyboard focus, mobile/tablet/short layouts, reduced motion, live preference changes, blocked video, no JavaScript, navigation, project filters and routes, menu focus, direct anchors, Back/reload and the local enquiry brief flow.

The enquiry test used synthetic values, verified that nothing was sent and checked the downloaded brief.

## Actual visual and temporal findings

The media decoded at 1920 x 1080 with a 12.041667-second duration. Browser presentation callbacks confirmed the four reading positions at 0, 4, 8 and 12 seconds. The desktop rerun recorded 49 frame callbacks, alongside real-time forward and interrupted-scroll observations.

Independent visual inspection covered the four camera compositions, selected sweep frames, the media contact sheet, gallery entry/middle/end/release, mobile chapter compositions and the tablet craft composition. There were 98 screenshots in the first run and 51 in the targeted rerun. Those totals describe captured evidence; they do not imply every screenshot received a separate manual critique.

| Gate | Result | Visible evidence |
| --- | --- | --- |
| Spatial journey | PASS | Side, elevated and reverse views change object overlap, depth and safe space. They are distinct views rather than a shifted flat crop. |
| UI choreography | PASS | Flat HTML holds alternate left and right. Copy clears during principal sweeps and reappears at presented landings. |
| Navigation | PASS | Opening navigation shares the scene; the scrolled navigation has a solid readable surface. |
| Contrast and rhythm | PASS | Bright architecture transitions into a black horizontal gallery, then a bright studio section. |
| Horizontal chapter | PASS | Project panels travel across a bounded stage, reverse and release into normal content. |
| Static presentations | PASS | Phone and tablet retain all chapters with separate images and readable text. Reduced motion and failure cases retain complete content. |

The design is suitable for the user's next local review. These judgments concern the observed implementation and brief. They do not predict client approval or audience response.

## Defect log

1. **Resolved:** optional cross-document ViewTransition rules caused browser diagnostics when navigating to routes without matching opt-in. Removed the rules and reran the three affected cases plus the desktop temporal case.
2. **Closed without application change:** some inline PNG previews appeared to omit fixed navigation. Converting the exact existing screenshot to JPEG, without a new browser capture, showed the full header already present in its pixels. Fresh JPEG comparisons showed the header with and without compositor promotion. No CSS workaround was justified.

## Evidence and limits

Machine-local evidence remains in the Windows temporary QA directory under `nulabs-web-qa-20261019/v2-integrated-01` and `v2-integrated-02`. Repository files retain the contract, portable runner and compact summary.

This review did not test Safari, Firefox or physical mobile hardware. It is not a complete accessibility certification. The contact page still prepares a brief locally because live enquiry delivery is not configured. Generated studio imagery and internal project studies remain labelled truthfully.
