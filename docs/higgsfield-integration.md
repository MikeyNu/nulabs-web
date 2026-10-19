# Higgsfield integration

The repository now builds the Higgsfield version previously reviewed on localhost:3001. This integration was made following the owner's request to consolidate and push the complete files.

## Active files

- public/assets/video/journey-higgsfield.mp4: browser-ready H.264, 1920 x 1080, 24 fps, 289 frames, 12.041667 seconds, silent, 7,492,871 bytes.
- Eight journey-higgsfield WebP posters under public/assets/images, at desktop and 960px sizes.
- src/content/media.json: active media selection and actual landing times 0, 4.5, 8.25 and 11.75 seconds.
- src/styles/home-v2.css: the reviewed hero typography, pale shaped Craft panel and mobile spacing.
- public/assets/manifest.json: synchronized active video and poster metadata.
- art/higgsfield/journey-master.mp4: original unaltered HEVC provider master, with measured metadata and hashes beside it.

The web video SHA-256 is c70cc04f928975c97c3af2a5e6bce77fdc7529362c7931919b5cd3bda02d0bc2. The source master SHA-256 is bac0c8765c7e3f82c6a27f5e9af00ee1bdea466c070595583c238786588574b6.

All required runtime and build inputs are tracked. dist is generated. Optional QA dependencies and full screenshot reports are excluded from the shipped site. Private account data and credit ledgers are excluded.

## Preserved behavior

Navigation remains transparent throughout the pinned camera journey, becomes solid when the stage releases, and becomes transparent again when scrolling back. The four live HTML chapters, native scroll control, horizontal work sequence, fallback layouts and interior pages remain intact.

## Known limits

This clip delivers three distinct viewpoint families followed by a return toward the opening. It does not deliver the proposed fourth reverse-side shot. The candidate-review status deliberately preserves this unresolved visual requirement. Pushing the files does not reinterpret it as a fully passed storyboard.

The enquiry form prepares a message locally; no live contact destination is configured. The strict release gate therefore remains unmet. No hosted deployment is part of this push.

## Verification

- Every frame of the original and browser copy decoded during review, with identical frame timestamps.
- The H.264 copy played to completion at normal speed in Edge with 289 total frames, zero dropped frames and no stalls.
- The earlier isolated candidate passed actual frame presentation checks for all four reading holds.
- Desktop and mobile overlay reviews corrected text overlap and verified the final compositions.
- The navigation handoff passed 38 recorded states across both local versions, including reverse scroll, viewport changes, live reduced motion and the mobile menu.
- The integrated repository passed npm run build, npm run check and all 69 unit tests on 19 October 2026.

The current integrated browser run and clean-export build are recorded below when complete. Earlier reports in docs/v2-verification.md describe the historical Blender version. docs/higgsfield-correction-review.md preserves the generation review before this consolidation.

### Consolidated checkout checks

The focused integrated Edge run passed all four selected scenarios: desktop, mobile, reduced motion and blocked video. It recorded 57 captures with zero browser errors or warnings. The active URL was /assets/video/journey-higgsfield.mp4, and actual presented reading times matched 0, 4.5, 8.25 and 11.75 seconds. Forward, reverse and interrupted scrolling passed. Navigation remained transparent across all four holds and was solid in the following work section. Local evidence: qa-output/higgsfield-integrated-20261019/report.json.

The normal desktop and mobile compositions match the reviewed preview. The static desktop media-failure fallback retains a larger title that partially crosses the dark sculpture, a remaining fallback contrast limitation; complete semantic content is still available.

A clean export from the staged Git index, excluding the untracked package-lock.json, node_modules, temporary preview folders and ignored render directories, passed npm run build and npm run check. Its browser video hash matched the reviewed copy exactly. This verifies that the required build inputs and runtime assets are included in Git.
