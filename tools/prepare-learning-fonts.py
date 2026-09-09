"""Encode the upstream OFL fonts as WOFF2; keep all glyphs and source files."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

for name in ('dm-sans', 'noto-sans-kr'):
    source = Path('packages/ui/fonts') / f'{name}.ttf'
    font = TTFont(source)
    instantiateVariableFont(font, {'wght': (400, 600)}, inplace=True)
    font.flavor = 'woff2'
    output = source.with_suffix('.woff2')
    font.save(output)
    print(f'{output}: {output.stat().st_size} bytes')
