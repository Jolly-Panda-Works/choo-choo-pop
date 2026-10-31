import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// public/ also holds design deliverables (store graphics, previews, work files). They are not used by the game,
// so they are removed from dist/ to keep the APK small.
const NOT_FOR_THE_APP = [
  'choo-choo-pop-assets/_work',
  'choo-choo-pop-assets/store',
  'choo-choo-pop-assets/resources',
  'preview-en.png',
  'preview-fa.png',
  'panda-locomotive-logo-edited.png',
  'ChatGPT Image Oct 30, 2026, 09_20_24 AM.png',
  'README.txt',
  'asset-manifest.json',
  'version.json',
];
const pruneDist = () => ({
  name: 'prune-non-runtime-public-files',
  apply: 'build',
  closeBundle() {
    for (const p of NOT_FOR_THE_APP) rmSync(resolve('dist', p), { recursive: true, force: true });
  },
});

export default defineConfig({
  base: './',
  plugins: [react(), pruneDist()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
