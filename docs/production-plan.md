# Nu Labs: production direction

## Chosen structure

One eight-second camera move serves two opening chapters. The camera starts at the approved sculpture composition and slowly trucks right along a shallow clockwise arc, pulling back slightly. The three fins remain rigid. Their silhouette shifts left, opening a pale reading region on the right.

1. **Ideas made real.** Split live headline in the opening negative space. The website holds the first video frame while visitors read.
2. **Clear thought. Working form.** The camera reveals the right reading area before the copy enters. The final frame holds while visitors read.
3. **Built to be used.** The sticky stage ends. Services, selected work, studio and contact continue in normal document flow.

The direction joins the company’s three-part symbol with three connected disciplines: strategy, design and development. Large typography establishes the main statements; small indices and rules provide orientation. One clipped editorial panel and one shaped studio crop supply variation without repeating a card treatment everywhere.

## Site map

- Home: two cinematic chapters, services introduction, project grid, studio perspective, enquiry invitation.
- Work: filterable internal brand study and two explicitly self-initiated concepts.
- Project details: question, direction, designed system, scope and concept status.
- Studio: working philosophy, human perspective and the stated ambition to make room for Black creative and technical excellence.
- Services: strategy, design, development, four-step process and useful questions.
- Contact: an honest local brief builder until real company contact delivery is supplied.

## Camera and interface

All UI is flat HTML/SVG. It never inherits perspective, scene lighting or shadows. The background creates space, then the copy enters. The camera, rather than the typography, supplies spatial travel.

Desktop progress holds the opening at 0–18%, moves the camera during 18–68%, and holds the final composition during 68–100%. The opening copy leaves before the move; the next copy enters after the camera settles. Inspected frames preserve the three forms, and the final composition leaves approximately 48% of the frame clear on the right. The runtime holds at 0 and 7.9 seconds. Sampled frame inspection and the final Windows Edge scrubbing checks passed. Opening and second-chapter screenshots were reviewed at desktop and mobile sizes.

Mobile, reduced motion, missing video and decoder errors return to a normal-flow layout. A visible motion control and skip link remain available in the enhanced desktop experience. Useful information is never available only in an intermediate animated frame.

## Completed asset production

The user approved a 136.50-credit ceiling. Exactly three submissions completed, each using its fresh quoted price. No paid retry was submitted. Quoted totals are not an independent account-billing audit.

| Asset | Route | Quoted credits |
| --- | --- | ---: |
| Clean architecture plate, all UI removed | GPT Image 2.5 Sunburst, high, 4K, 16:9, one image | 4.25 |
| One continuous camera shot | Seedance 2.5, 1080p, 8 seconds, silent, one clip | 128 |
| Black South African creative studio illustration | GPT Image 2.5 Sunburst, high, 4K, 16:9, one image | 4.25 |
| Production total | Three completed outputs, no paid retries | **136.50** |

The 12-second alternative was quoted at 192 credits for the video alone. The selected shorter shot reduces generation cost while preserving reading time through deterministic scroll holds.

The video used the completed, inspected clean plate as its actual first-frame reference. Its final quote was 128 credits. The original concept-image retry allocation was not reused. Production prompts, job identifiers and spending records remain outside the public repository.

The web video is 1920 × 1080, silent H.264/yuv420p, with 193 frames at 24 fps and a duration of 8.041667 seconds. The faststart file is 3,553,215 bytes and uses one keyframe every six frames, or 0.25 seconds. Visual inspection covered 32 sampled frames at 4 fps and full-resolution frames 0, 96 and 192. Final automated full-clip playback in Edge reported 193 total frames, four dropped frames and 189 presented-frame callbacks. Forward, reverse and fast scrubbing passed the final browser suite. Visual review did not include continuous normal-speed playback.

Existing approved stationery, apparel and SVG identity assets are reused. Opening and final stills come from the delivered video. The generated studio image illustrates a South African creative workplace; it does not identify actual employees or document a real Nu Labs office.

## Reference interpretation

[MotionSites](https://motionsites.ai/) informed the principle of stable, sparse UI over changing media. Public preview imagery was inspected as research. Exact scroll behaviour was not assumed from stills, and none of its assets or designs are included in the site.

The project applies [Web Motion Director](https://github.com/MikeyNu/Web-Motion-Director), [Graphic Design](https://github.com/MikeyNu/agent-graphic-designer), [Higgsfield Director](https://github.com/MikeyNu/agent-higgsfield), the Visual Asset Pipeline and Cinematic Scroll Director workflows.

## Acceptance

Required before cinematic release: clean UI-free plate; coherent three-form geometry throughout the clip; correct 1080p output; useful negative space; exact separate logo; readable desktop and mobile layouts; both scroll directions; actual presented frames; controlled media bytes and seeking; reduced-motion/live changes; keyboard, links and form states; clean video failure fallback. A build or unit test result is not visual verification.

The build produces nine HTML documents, including the 404 page. All 42 unit tests passed on Windows and Linux, and the final Windows Edge suite passed all 17 cases. Midpoint reload, native chapter anchors, history restoration and below-fold rendering were verified. Media status is `verified` for that documented scope. The studio capture required waiting for image decoding and paint in the harness, without a site CSS change.

The refreshed owner-private Site is deployed at [nu-labs-cinematic.mikeynu.chatgpt.site](https://nu-labs-cinematic.mikeynu.chatgpt.site), with hosting success confirmed. GitHub PR #2 is merged. The contact flow remains a local brief builder with no live email or backend delivery, and the final release check fails for that reason only. Browser evidence covers Windows Edge, not Safari, Firefox, real-device behaviour or full accessibility conformance. See `docs/verification.md` and `docs/browser-qa-summary.json` for the recorded evidence.
