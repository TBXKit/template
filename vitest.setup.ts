import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// @testing-library/react only auto-registers its own afterEach(cleanup) when
// it detects a *global* afterEach. This project imports `afterEach` from
// "vitest" explicitly per-file rather than enabling `test.globals`, so that
// auto-detection never fires — do it explicitly here instead, once, for
// every test file. Without this, DOM from every previous test in a file
// accumulates instead of unmounting, and text queries in later tests can
// spuriously match leftover elements from earlier ones.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement `window.matchMedia` at all — anything that reads
// it (e.g. checkout-panel.tsx's `prefers-reduced-motion` check) throws
// without this. Defaults to "doesn't match" for every query; a test that
// needs the opposite overrides `window.matchMedia` itself for that one case.
window.matchMedia =
  window.matchMedia ??
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
