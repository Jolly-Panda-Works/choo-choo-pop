// Hooks for a store build: main has no store services. A store branch (bazaar) replaces this one file,
// so merging main into it stays clean.

/** Runs once before the first render. */
export const startPlatform = () => {};
/** Extra rows of the settings screen, same shape as the rows of Settings.jsx. */
export const usePlatformRows = () => [];
/** Popups of the store, on top of every screen. */
export const PlatformOverlay = () => null;
