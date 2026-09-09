import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// Keep generated PNG originals. WebP is a delivery encoding, not an artwork edit.
const directory = 'apps/teacher/public/photos/learning';
for (const file of await readdir(directory)) {
  if (!file.endsWith('-v1.png')) continue;
  const output = join(directory, file.replace(/\.png$/, '.webp'));
  await sharp(join(directory, file)).webp({ quality: 84, effort: 5 }).toFile(output);
  console.log(`${output}: ${Math.round((await stat(output)).size / 1024)} KB`);
}
