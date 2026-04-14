"use client";

import { useEffect } from "react";
import { loadThemePreference } from "./lib/storage";

export function ThemeRegistrar() {
  useEffect(() => {
    let cancelled = false;
    let mediaQuery: MediaQueryList | null = null;
    let listener: ((event: MediaQueryListEvent) => void) | null = null;

    const apply = (preference: "system" | "dark" | "light") => {
      if (preference === "dark" || preference === "light") {
        document.documentElement.dataset.theme = preference;
        return;
      }
      const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
    };

    (async () => {
      try {
        const preference = await loadThemePreference();
        if (cancelled) return;
        apply(preference);
      } catch {
        // ignore
      }
    })();

    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      listener = () => {
        loadThemePreference()
          .then((preference) => {
            if (!cancelled && preference === "system") apply("system");
          })
          .catch(() => {});
      };
      mediaQuery.addEventListener?.("change", listener);
    }

    return () => {
      cancelled = true;
      if (mediaQuery && listener) {
        mediaQuery.removeEventListener?.("change", listener);
      }
    };
  }, []);

  return null;
}
