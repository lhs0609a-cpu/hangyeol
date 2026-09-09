"""Prepare a smaller shareable PDF while preserving selectable Korean and English text."""
from pathlib import Path
import pymupdf

source = Path('output/design-review/samat-first-steps-workbook.pdf')
target = source.with_name('samat-first-steps-workbook-compact.pdf')
document = pymupdf.open(source)
texts = [page.get_text() for page in document]
for index, page in enumerate(document):
    page.insert_textbox(pymupdf.Rect(48, page.rect.height - 31, page.rect.width - 48, page.rect.height - 15), f'SAMAT First Steps | {index + 1:02d} / {len(document)}', fontsize=8, fontname='helv', color=(0.25, 0.35, 0.30), align=1)
# Re-encode image objects in place. Whole-document image rewriting can discard
# Chromium's tiling-pattern resources (used for print decoration and artwork).
seen = set()
for page in document:
    for image in page.get_images(full=True):
        xref, mask, width, height = image[:4]
        if xref in seen or mask or width < 600 or height < 300:
            continue
        seen.add(xref)
        pixels = pymupdf.Pixmap(document, xref)
        if pixels.alpha or pixels.colorspace is None:
            continue
        if pixels.colorspace.n != 3:
            pixels = pymupdf.Pixmap(pymupdf.csRGB, pixels)
        page.replace_image(xref, stream=pixels.tobytes('jpeg', jpg_quality=86))
document.save(target, garbage=4, deflate=True, use_objstms=1)
check = pymupdf.open(target)
assert len(check) == len(texts)
assert all(original in page.get_text() for original, page in zip(texts, check)), 'PDF text changed during optimization'
assert all(page.get_text().strip() for page in check), 'Unexpected blank page'
pymupdf.TOOLS.reset_mupdf_warnings()
for page in check:
    page.get_pixmap(matrix=pymupdf.Matrix(0.25, 0.25))
assert not pymupdf.TOOLS.mupdf_warnings(), 'PDF renderer reported missing resources'
for index, name in [(0, 'pdf-cover'), (1, 'pdf-lesson')]:
    check[index].get_pixmap(matrix=pymupdf.Matrix(1.2, 1.2)).save(source.parent / f'{name}.png')
print(f'{len(check)} pages; {source.stat().st_size:,} → {target.stat().st_size:,} bytes; all text preserved')
