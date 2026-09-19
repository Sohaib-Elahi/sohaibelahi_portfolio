from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
root=Path(__file__).resolve().parents[1]
for source,target in [('Geist-VariableFont_wght.ttf','geist-sans'),('GeistPixel-Regular-VariableFont_ELSH.ttf','geist-pixel')]:
 font=TTFont(root/'raw/fonts'/source)
 axes=[(a.axisTag,a.minValue,a.defaultValue,a.maxValue) for a in font['fvar'].axes]
 options=subset.Options(); options.flavor='woff2'; options.desubroutinize=True
 sub=subset.Subsetter(options=options); sub.populate(unicodes=list(range(32,256))+[0x2013,0x2019,0x2022,0x2197]); sub.subset(font)
 font.flavor='woff2'; out=root/'public/fonts'/f'{target}.woff2'; font.save(out)
 print(target, 'axes:',axes, 'bytes:',out.stat().st_size)
