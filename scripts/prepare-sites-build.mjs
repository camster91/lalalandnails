import { access, copyFile, cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverDirectory = resolve(projectRoot, 'dist', 'server');
const drizzleDirectory = resolve(projectRoot, 'drizzle');
const packagedDrizzleDirectory = resolve(projectRoot, 'dist', '.openai', 'drizzle');

await copyFile(
  resolve(serverDirectory, 'entry.mjs'),
  resolve(serverDirectory, 'index.js'),
);

try {
  await access(drizzleDirectory);
  await mkdir(packagedDrizzleDirectory, { recursive: true });
  await cp(drizzleDirectory, packagedDrizzleDirectory, { recursive: true });
} catch {
  // A build without schema changes has no migrations to package.
}
