"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const AUTO_DISMISS_MS = 5000;

const ToastContext = createContext<
  ((message: string, tone: ToastTone) => void) | null
>(null);

/**
 * Single-slot, non-blocking confirmation for a basket mutation that happens
 * somewhere the visitor might not be looking — quick-add-button.tsx's grid
 * cards, primarily, where a mutation's own inline feedback can be scrolled
 * out of view. Deliberately not a queue: this app mutates the basket one
 * action at a time, so a newer toast simply replaces whatever's showing
 * rather than stacking. Wrap the part of the tree that needs `useToast()`
 * with this — it renders its own fixed-position region as a sibling of
 * `children`, so it can sit anywhere in the tree without affecting layout.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((message: string, tone: ToastTone) => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        // A plain div with an explicit role, not <output>: verified live in
        // Chromium (via Playwright, not just jsdom) that <output>'s implicit
        // ARIA role isn't reliably exposed in the real accessibility tree
        // despite the spec — a role query that finds it in this component's
        // own jsdom-based tests silently found nothing in a real browser.
        // biome-ignore lint/a11y/useSemanticElements: <output> is the suggested element, but doesn't reliably carry the implied role in real Chromium — see comment above
        <div
          role="status"
          aria-live={toast.tone === "error" ? "assertive" : "polite"}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg sm:inset-x-auto sm:right-4"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="shrink-0 leading-none text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

/**
 * Returns a `(message, tone) => void` function that shows a toast. Falls
 * back to a no-op outside a `ToastProvider` rather than throwing, so a
 * component using this hook stays renderable/testable standalone, without
 * every test needing to wrap its render in a `ToastProvider`.
 */
export function useToast(): (message: string, tone: ToastTone) => void {
  const show = useContext(ToastContext);
  return show ?? (() => {});
}
