import { mkdir, writeFile } from 'node:fs/promises';

const directory = 'packages/ui/fonts';
await mkdir(directory, { recursive: true });
const fonts = [
  ['dm-sans.ttf', 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf'],
  ['dm-sans-OFL.txt', 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt'],
  ['noto-sans-kr.ttf', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf'],
  ['noto-sans-kr-OFL.txt', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt'],
];
for (const [filename, url] of fonts) {
  console.log(`Downloading ${filename}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(`${directory}/${filename}`, buffer);
  console.log(`Saved ${filename}: ${buffer.length} bytes`);
}
