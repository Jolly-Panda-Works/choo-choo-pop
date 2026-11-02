import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// public/ also holds design deliverables (store graphics, previews, work files). They are not used by the game,
// so they are removed from dist/ to keep the APK small.
const NOT_FOR_THE_APP = [
  'choo-choo-pop-assets/_work',
  ...['sky', 'rose', 'lime', 'grape'].flatMap((look) => [`choo-choo-pop-assets/art/track/${look}/curve.png`, `choo-choo-pop-assets/art/track/${look}/stub.png`]),
  'choo-choo-pop-assets/store',
  'choo-choo-pop-assets/resources',
  'preview-en.png',
  'preview-fa.png',
  'panda-locomotive-logo-edited.png',
  'ChatGPT Image Oct 30, 2026, 09_20_24 AM.png',
  'README.txt',
  'asset-manifest.json',
  'version.json',
  'choo-choo-pop-assets/art/bg/sky.png', // the sky is now home-sky.webp
  // map tiles of stages that are not built yet
  ...['green-2', 'green-3', 'green-4', 'green-5', 'desert-2', 'candy-2', 'cloud-1', 'gradient'].map((n) => `choo-choo-pop-assets/art/map/bg/${n}.webp`),
];
const pruneDist = () => ({
  name: 'prune-non-runtime-public-files',
  apply: 'build',
  closeBundle() {
    for (const p of NOT_FOR_THE_APP) rmSync(resolve('dist', p), { recursive: true, force: true });
  },
});

// Which store this build is for (VITE_STORE): only that store's code goes in the bundle, see src/services/platform.jsx.
const STORE = process.env.VITE_STORE || 'bazaar';
if (!['bazaar', 'myket'].includes(STORE)) throw new Error(`Unknown VITE_STORE: ${STORE}`);

export default defineConfig({
  base: './',
  plugins: [react(), pruneDist()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '#store-platform': resolve(`src/services/platform.${STORE}.jsx`) } },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
