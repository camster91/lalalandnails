import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(projectRoot, 'public', 'brand', 'submark.svg');
const targetDirectory = resolve(projectRoot, 'public', 'icons');

await mkdir(targetDirectory, { recursive: true });

async function createIcon(size, filename) {
  const markSize = Math.round(size * .68);
  const mark = await sharp(source).resize(markSize, markSize, { fit: 'contain' }).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#330505',
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(resolve(targetDirectory, filename));
}

await Promise.all([
  createIcon(180, 'apple-touch-icon.png'),
  createIcon(192, 'icon-192.png'),
  createIcon(512, 'icon-512.png'),
]);
