from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]
existing={row['src']:row.get('alt','') for row in json.loads((root/'src/content/images.json').read_text())}
seen={}; rows=[]; gallery=[]
for path in sorted((root/'raw').rglob('*')):
 if path.suffix.lower() not in ('.png','.webp','.jpg','.jpeg'): continue
 data=path.read_bytes(); digest=hashlib.sha256(data).hexdigest()
 with Image.open(path) as im:
  w,h=im.size
  duplicate=seen.get(digest)
  rows.append(f'| {path.relative_to(root)} | {w} × {h} | {w/h:.3f} | {len(data):,} | '+(f'Duplicate of {duplicate}' if duplicate else ('Under 1200px wide' if w<1200 else ''))+' |')
  if duplicate: continue
  seen[digest]=str(path.relative_to(root))
  if path.parent != root/'raw/images' and path != root/'raw/portrait/me.webp': continue
  stem='portrait' if path.parent.name=='portrait' else 'work-'+str(len(gallery)+1).zfill(2)
  im=im.convert('RGB'); im.thumbnail((1600,1600))
  im.save(root/f'public/images/{stem}.avif',quality=65)
  im.save(root/f'public/images/{stem}.webp',quality=82,method=6)
  small=im.resize((min(im.width,640),round(im.height*min(im.width,640)/im.width)),Image.Resampling.LANCZOS)
  small.save(root/f'public/images/{stem}-small.avif',quality=58)
  small.save(root/f'public/images/{stem}-small.webp',quality=78,method=6)
  if stem!='portrait': gallery.append({'src':f'/images/{stem}','width':im.width,'height':im.height,'alt':existing.get(f'/images/{stem}','')})
# Portrait may be a duplicate encountered earlier; create explicitly.
with Image.open(root/'raw/portrait/me.webp') as im:
 im=im.convert('RGB'); im.thumbnail((1000,1000))
 im.save(root/'public/images/portrait.avif',quality=70)
 im.save(root/'public/images/portrait.webp',quality=85)
(root/'docs').mkdir(exist_ok=True)
(root/'docs/assets.md').write_text('# Raw asset inventory\n\nSHA-256 identifies exact duplicates. Source files remain untouched. Portfolio derivatives preserve aspect ratio, cap their longest edge at 1600px and ship AVIF with WebP fallback. Files under 1200px wide are flagged, not upscaled. The gallery uses all unique supplied portfolio images.\n\n| File | Dimensions | Aspect | Bytes | Notes |\n| --- | --- | --- | --- | --- |\n'+'\n'.join(rows)+'\n\nFonts: supplied Geist Sans wght TTF and Geist Pixel ELSH TTF; self-hosted web fonts are in public/fonts/. Résumé: raw/resume/sohaib-resume-2026.pdf.\n')
(root/'src/content/images.json').write_text(json.dumps(gallery,indent=2)+'\n')
print('Unique gallery images:',len(gallery)); print('Derivative bytes:',sum(p.stat().st_size for p in (root/'public/images').iterdir()))
