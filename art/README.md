# Nu Labs camera journey, version 2

A deterministic 3D gallery, rendered locally with Blender 5.1.2 EEVEE. The three sculptural profiles are sampled from the existing owner-supplied SVG symbol. This is authored 3D artwork, not documentary photography. No external generation service or paid credits are used.

## Source and controls

- construction.py rebuilds the editable scene and all 289 camera samples.
- nu-labs-journey-v2.blend preserves geometry, materials, lights and camera animation.
- camera-manifest.json records positions, look targets, lenses and reading times.
- validate-camera.py checks the camera against evaluated scene geometry and records projected sculpture bounds.
- finalize-media.py remuxes the native H.264 output for faststart, decodes every frame, verifies encoding, and derives posters from actual encoded frames.
- make-study.py assembles the seven inexpensive camera study images.

Meaningful controls are grouped in construction.py: the material declarations, area light calls, poses, routes, render resolution and sample count. The source SVG scale is 100 SVG units per metre. Every cubic outline is sampled deterministically with 12 subdivisions. Fin extrusion is 0.68 m, with a 0.045 m bevel.

The camera is keyed at each frame. Three curved routes use quintic acceleration and deceleration without overshooting. Camera travel is continuous, with no cuts, dissolves, shape changes, text, or UI baked into the render. The website independently holds the reading positions and overlays semantic HTML.

## Reading compositions

| Chapter | Video time | Composition | UI area |
| --- | --- | --- | --- |
| Arrival | 0 s | Frontal hero symbol, centered | Above 23% height or left of 30% width; lower-right below 73% height |
| Clarity | 4 s | Low side perspective, sculpture on right | Left 4% to 48% |
| Craft | 8 s | Elevated diagonal view, sculpture on left | Right 55% to 95% |
| Possibility | 12 s | Reverse wide view, sculpture on left | Right 56% to 95% |

Coordinates refer to the full 16:9 frame. A cover crop changes their screen position, so browser overlay checks remain necessary. Mobile and reduced motion use the complete reading stills with content in normal flow.

## Rebuild

Run from the repository with the installed Blender executable:

~~~powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python art/construction.py -- --preview
py art/make-study.py
~~~

Inspect the study before the full render:

~~~powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python art/construction.py -- --render
py art/finalize-media.py
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup art/nu-labs-journey-v2.blend --python art/validate-camera.py
~~~

The finalizer uses the existing workstation PyAV and Pillow packages. These are authoring tools, not website dependencies. Intermediates and full decoded contact sheets remain in art/renders/ and are excluded from Git. Source scripts, the editable scene and verification manifests are retained.

## Output contract

- public/assets/video/journey-v2.mp4: silent 1920x1080 H.264, 24 fps, 289 frames, 12.041667 seconds.
- Last readable time: 12 seconds, frame index 288.
- Reading posters: journey-v2-arrival.webp, journey-v2-clarity.webp, journey-v2-craft.webp and journey-v2-possibility.webp.
- Each poster also has a -960.webp derivative.
- media-verification.json records measured codec, dimensions, pixel format, full decode count, keyframe intervals, MP4 atom order, sizes and SHA-256 hashes.
- camera-verification.json records actual evaluated surface clearance and landing frame bounds.

Do not infer browser smoothness from encoding checks alone. The actual website must verify frame presentation during forward, reverse and rapid scrolling, including reduced motion and failed media.
