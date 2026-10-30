export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// Two builds from one code base: "en" (Choo Choo Pop) and "fa" (هو هو چی چی).
// Chosen at build time:  VITE_EDITION=fa npm run build   (see package.json scripts)
export const EDITION = import.meta.env.VITE_EDITION === 'fa' ? 'fa' : 'en';

export * from './game/constants.js';
