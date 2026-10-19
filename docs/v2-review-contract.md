# Nu Labs v2 review contract

Status: direction selected; integrated experience awaiting review.
Target: the existing Windows checkout and local Edge browser.
This is an acceptance contract, not a claim of completed QA or client approval.

## Direction and reason

Help prospective clients recognise Nu Labs as a studio that turns ideas into useful design and software through a spatial opening, an editorial project gallery and a grounded human studio section.

| Direction | Strength | Risk | Decision |
| --- | --- | --- | --- |
| Continuous full-site 3D gallery | Strong visual continuity | Sustained movement competes with reading, forms and project detail | Rejected |
| Four-shot spatial opening, black horizontal work chapter, bright studio | Distinct camera journey and a meaningful change of axis and pace | Requires careful timing and a clean release from both sticky regions | Selected |
| Separate animated poster sections | Light and maintainable | Does not fulfil the requested camera journey | Rejected |

Preserve the supplied logo, Instrument Sans, black and white identity, strong typography and truthful concept labels. Do not imply generated people are employees or internal studies are commissioned client projects.

## Observed baseline

Fresh Edge screenshots at 1440 x 900 showed a solid 112px navigation band separating the hero. The hero then occupied a full viewport below that band, clipping lower supporting information. The studio section was readable but repeated the same paper background rhythm. These are observations of the previous version, not findings about v2.

## Choreography contract

| Chapter | Scroll reading hold | Camera landing | Composition |
| --- | --- | --- | --- |
| arrival | 0 to .14 | 0 seconds | Opening view, split headline, navigation over the scene |
| clarity | .28 to .40 | 4 seconds | Objects right, readable copy left |
| craft | .54 to .66 | 8 seconds | Elevated viewpoint, objects left, readable panel right |
| possibility | .80 to 1 | approximately 11.95 seconds | Wider composition with generous quiet space |

Camera travel occurs between reading holds. Native vertical scrolling owns progress. The UI remains flat HTML. Clear the outgoing text before the principal sweep, reveal the next group after its composition settles, and preserve a reading interval without moving the background behind body copy.

Camera movement must visibly change viewpoint, depth and object overlap. A flat crop shift or uniform pan does not meet the brief. The three moves should form one continuous place and one coherent motion vocabulary.

The portfolio is a bounded horizontal chapter, followed by normal vertical flow. Measure actual track overflow. Present three real project destinations, retain vertical wheel and keyboard control, reverse naturally and release at the final panel.

## Experience gates

1. At scroll position zero, navigation sits at the top edge across the hero with a transparent background and no detached outer card or margin. After scrolling it becomes a solid readable surface. All essential opening content fits its intended viewport.
2. Every camera landing has a distinct, intentional composition. Inspect actual renders for geometry, lighting, object continuity and text-safe space.
3. No large heading or dense paragraph drifts over the scene during the principal sweep. Incoming text must arrive after the new composition is presented, not merely after a target timestamp was assigned.
4. All four holds provide readable, still content with clear hierarchy, convincing spacing and unobstructed destinations.
5. The horizontal gallery visibly changes the direction of travel. Its first, middle and last panels have resolved crops, readable captions and working links. Entering, leaving and reversing create no blank seam or page-wide horizontal overflow.
6. The rhythm changes visibly from bright architecture to black gallery to bright human studio. Do not add unrelated effects simply to increase animation count.
7. Mobile is deliberately recomposed. It must preserve every chapter and project without a long unusable desktop pin. Reduced motion removes camera travel and large translations, with complete normal-flow content.
8. Anchors, reload, Back/Forward, keyboard focus, menus, the contact brief flow and the footer remain usable. Invisible content must not receive focus.

## Evidence required

Run the real build and relevant automated checks, then inspect the delivered local site in the existing Edge installation. Keep test results separate from design judgment.

Capture:
- opening and scrolled navigation;
- all four reading holds;
- early, middle and late states of each sweep;
- a slow forward pass, a rapid pass, a reverse pass and an interrupted move;
- gallery entry, intermediate positions, final panel and release;
- a phone, tablet and short desktop composition;
- reduced motion and a live preference change;
- missing video, direct anchors, history and keyboard traversal.

For video, record actual requestVideoFrameCallback presentation times where available. A CSS class, desired timestamp or video.currentTime alone does not prove visible presentation. Inspect temporal screenshots as a sequence, not only isolated hero stills.

Record browser version, viewport, source revision or dirty state, build time, evidence paths, defects and rechecks. Expected media failures must be distinguished from unexpected application errors.

## Review language and release gate

Use PASS, FAIL, NOT RUN or BLOCKED for concrete checks. Assess fit, communication, distinctiveness, craft and coherence with visible reasons, not invented aesthetic scores.

A successful build or automation suite is not design approval. Do not describe the v2 experience as motion-verified until its actual temporal evidence has been inspected. Fix material clipping, illegibility, continuity, focus and release defects before handoff. User review remains the final creative judgment.
