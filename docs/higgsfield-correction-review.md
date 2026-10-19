# Higgsfield hero correction review

Status: provider generation complete; candidate only. The active hero is unchanged.

## Source and delivery

The approved original clean plate was supplied as the starting image to Higgsfield Seedance 2.5. One 12-second, 1080p generation was submitted under a separately approved 192-credit ceiling. No paid retry was submitted. The quote remains a reserved cost; account-level billing was not independently reconciled.

The delivered master is 1920 x 1080, 24 fps, 289 frames, 12.041667 seconds, HEVC Main10, BT.709 SDR and silent. SHA-256: bac0c8765c7e3f82c6a27f5e9af00ee1bdea466c070595583c238786588574b6.

A browser viewing copy preserves every source timestamp and all 289 frames. It is H.264/yuv420p, BT.709, GOP6, faststart, 7,492,871 bytes. SHA-256: c70cc04f928975c97c3af2a5e6bce77fdc7529362c7931919b5cd3bda02d0bc2. Every frame of both files decoded successfully. The HEVC master did not reach decoded readiness in the installed Edge environment; the H.264 copy played to completion at rate 1 in 12.0439 seconds, with no dropped frames, seeks, waits, stalls or browser errors.

## Visual acceptance

Opening fidelity passes visual comparison with the approved plate. The three camera moves are substantially stronger than the earlier slow lateral motion. Sampled transitions show coherent perspective and plausible fin occlusion, with no confirmed extra fin, hard cut, sudden disappearance or shape break. This is visual evidence, not a proof of rigid 3D geometry.

The fourth planned view fails: the camera returns toward the opening/front family rather than revealing the requested reverse-side perspective. The clip supports three distinct viewpoint families and a return. It must not be described as four distinct angles or marked fully approved against the storyboard. The Higgsfield Director QA rule rejects an unmet required shot instead of averaging it away with attractive imagery.

A separate local candidate demonstrates the actual footage in the four UI chapters at inspected times 0, 4.5, 8.25 and 11.75 seconds. It is an alternate for review, not a production replacement. Candidate-only overlay adjustments keep the opening title in pale space, give the third chapter a pale shaped panel, and separate the mobile title from the sculpture.

## Code preparation and checks

The repository now reads chapter poster assets, frame rate and exact inspected landing timestamps from media.json. Invalid or out-of-range timings produce readable static content instead of proportional retiming to unreviewed frames. The browser QA oracle reads the same media contract independently of runtime interpolation.

69 unit tests pass. Build and local resource checks pass. Targeted Edge checks on the unchanged active asset pass for desktop, mobile, reduced motion and blocked video, with zero errors or warnings. Evidence: qa-output/v2-config-wiring/report.json.

The isolated Higgsfield candidate passed desktop temporal QA with 38 captures and 49 presented-frame samples. Every reading hold presented its configured time and only the intended chapter was interactive. This technical pass does not waive the visual storyboard failure.

## Local review and preservation

- Active site: http://localhost:3000
- Isolated candidate: http://localhost:3001
- Candidate workspace: C:/Users/USER/AppData/Local/Temp/nulabs-higgsfield-candidate
- Master, viewing copy and eight reading posters: art/renders/higgsfield-correction-20261019/
- Normal-speed playback evidence: C:/Users/USER/AppData/Local/Temp/nulabs-provider-video-inspection/normal-speed-h264-review

The paid source is preserved locally and excluded from publication with the render intermediates. No original assets were overwritten, no additional paid generations were requested, and no push to main was performed.

Final candidate UI review: inspected desktop at 1440 x 900 and mobile at 390 x 844 after the overlay adjustments. Opening and Craft copy no longer cross dark fins; mobile closing hero line sits below the image. Clarity and Possibility remain readable. No clipping or horizontal overflow was found at those sizes. Opening header computed background is transparent, without the scrolled class. Candidate source and CSS are preserved with the archived media configuration; the candidate is suitable for alternate review, not full storyboard approval.
