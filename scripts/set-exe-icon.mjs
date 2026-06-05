/**
 * Post-build script: embed icon.ico into the Windows exe using rcedit.
 *
 * Usage:
 *   node scripts/set-exe-icon.mjs
 *
 * Prerequisites:
 *   pnpm add -D rcedit
 *
 * This script finds the built exe in dist/ and sets its icon resource
 * so Windows Explorer shows the app icon.
 */
import rcedit from 'rcedit';
import { existsSync } from 'fs';
import { resolve } from 'path';

const exePath = resolve('dist/json-spotlight-editor/json-spotlight-editor-win_x64.exe');
const icoPath = resolve('icons/icon.ico');

if (!existsSync(exePath)) {
  console.error('Exe not found. Run `pnpm neu:build` first.');
  process.exit(1);
}

if (!existsSync(icoPath)) {
  console.error('icon.ico not found. Run `pnpm gen:icon` first.');
  process.exit(1);
}

try {
  await rcedit(exePath, {
    'icon': icoPath,
    'file-version': '1.0.0.0',
    'product-version': '1.0.0.0',
  });
  console.log(`Icon set on ${exePath}`);
} catch (err) {
  console.error('Failed to set exe icon:', err.message);
  process.exit(1);
}