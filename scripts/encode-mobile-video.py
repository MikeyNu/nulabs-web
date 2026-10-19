"""Optional authoring task: PyAV with libx264, no website runtime dependency.

Derive a seek-friendly mobile clip from the unchanged Higgsfield master.
Preserve every timestamp so desktop/mobile use the same reviewed landings.
"""
from pathlib import Path
from fractions import Fraction
import av
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/higgsfield/journey-master.mp4'
TARGET = ROOT / 'public/assets/video/journey-higgsfield-mobile.mp4'
TEMP = TARGET.with_suffix('.inprogress.mp4')
if TARGET.exists() or TEMP.exists():
    raise SystemExit('Output already exists. Preserve it before creating a new derivative.')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
source_hash = sha(SOURCE)
timestamps = []
with av.open(str(SOURCE)) as source, av.open(str(TEMP), 'w', options={'movflags': '+faststart'}) as output:
    video = source.streams.video[0]
    assert video.average_rate == 24
    stream = output.add_stream('libx264', rate=24)
    stream.width, stream.height, stream.pix_fmt = 960, 540, 'yuv420p'
    stream.time_base = stream.codec_context.time_base = Fraction(1, 24)
    stream.codec_context.gop_size = 6
    stream.codec_context.max_b_frames = 0
    stream.codec_context.color_primaries = stream.codec_context.color_trc = stream.codec_context.colorspace = 1
    stream.codec_context.color_range = 1
    stream.options = {'crf': '20', 'preset': 'medium', 'profile': 'baseline',
                      'x264-params': 'keyint=6:min-keyint=6:scenecut=0:bframes=0'}
    for index, frame in enumerate(source.decode(video)):
        timestamp = Fraction(frame.pts) * frame.time_base
        assert timestamp == Fraction(index, 24)
        timestamps.append(timestamp)
        frame = frame.reformat(width=960, height=540, format='yuv420p')
        frame.pts, frame.time_base, frame.duration, frame.pict_type = index, Fraction(1, 24), 1, 0
        for packet in stream.encode(frame):
            output.mux(packet)
    for packet in stream.encode():
        output.mux(packet)
seen, keys = [], []
with av.open(str(TEMP)) as media:
    stream = media.streams.video[0]
    assert len(media.streams.audio) == 0
    assert (stream.width, stream.height, stream.average_rate) == (960, 540, 24)
    assert stream.codec_context.name == 'h264'
    for i, frame in enumerate(media.decode(stream)):
        seen.append(Fraction(frame.pts) * frame.time_base)
        if frame.key_frame:
            keys.append(i)
    duration = float(stream.duration * stream.time_base)
assert len(seen) == 289 and seen == timestamps
assert max(b - a for a, b in zip(keys, keys[1:])) <= 6
data, offset, atoms = TEMP.read_bytes(), 0, []
while offset + 8 <= len(data):
    size, kind = struct.unpack('>I4s', data[offset:offset + 8])
    if size == 1:
        size = struct.unpack('>Q', data[offset + 8:offset + 16])[0]
    if size == 0:
        size = len(data) - offset
    assert size >= 8
    atoms.append(kind.decode())
    offset += size
assert atoms.index('moov') < atoms.index('mdat')
assert sha(SOURCE) == source_hash
TEMP.rename(TARGET)
report = {'source': str(SOURCE.relative_to(ROOT)), 'sourceSha256': source_hash,
          'output': str(TARGET.relative_to(ROOT)), 'sha256': sha(TARGET),
          'bytes': TARGET.stat().st_size, 'width': 960, 'height': 540,
          'codec': 'h264', 'pixelFormat': 'yuv420p', 'fps': 24,
          'framesFullyDecoded': len(seen), 'timestampsEqualToMaster': True,
          'durationSeconds': duration, 'maximumGop': 6, 'audioStreams': 0,
          'faststart': True, 'crf': 20}
(ROOT / 'art/higgsfield/mobile-video-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
