"""Convert the original ASCII GIF into the portrait's delivery assets.

Requires Pillow and ffmpeg (or --ffmpeg /path/to/ffmpeg).
"""
import argparse
from pathlib import Path
import shutil
import subprocess
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
args = parser.parse_args()
if not args.ffmpeg:
    parser.error('Install ffmpeg or provide its path with --ffmpeg.')
root = Path(__file__).resolve().parents[1]
source = root / 'raw/portrait/MeASCII.gif'
output = root / 'public/images/portrait-ascii.mp4'
poster = root / 'public/images/portrait-ascii.webp'
with Image.open(source) as image:
    size = (720, round(image.height * 720 / image.width / 2) * 2)
    image.convert('RGB').resize(size, Image.Resampling.LANCZOS).save(poster, quality=85, method=6)
subprocess.run([
    args.ffmpeg, '-v', 'error', '-y', '-i', str(source),
    '-vf', f'scale={size[0]}:{size[1]}:flags=lanczos', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output),
], check=True)
print(f'Original: {source.stat().st_size:,} bytes')
print(f'MP4: {output.stat().st_size:,} bytes; poster: {poster.stat().st_size:,} bytes')
