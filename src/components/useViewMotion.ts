"use client";

import { useEffect, useRef, type RefObject } from "react";

/** State and focus commit immediately; motion is cancellable presentation only. */
export function useViewMotion(ref: RefObject<HTMLElement | null>, viewKey: string) {
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const changed = previous.current !== null && previous.current !== viewKey;
    previous.current = viewKey;
    if (!changed) return;
    const focusFrame = requestAnimationFrame(() => {
      // Preserve fields focused by the editor, but route navigation into the new content.
      const active = document.activeElement;
      if (element.inert || document.querySelector('.modal[role="dialog"]') ||
        (active && element.contains(active) && active.matches('input,textarea,select,[contenteditable="true"]'))) return;
      const target = element.querySelector<HTMLElement>("h1") || element;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animation = !reduced.matches && !document.hidden ? element.animate([
      { opacity: 0.65, transform: "translateY(6px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 210, easing: "cubic-bezier(.22,1,.36,1)" }) : undefined;
    const cancelIfReduced = () => { if (reduced.matches) animation?.cancel(); };
    const cancelIfHidden = () => { if (document.hidden) animation?.cancel(); };
    reduced.addEventListener("change", cancelIfReduced);
    document.addEventListener("visibilitychange", cancelIfHidden);
    return () => {
      cancelAnimationFrame(focusFrame);
      animation?.cancel();
      reduced.removeEventListener("change", cancelIfReduced);
      document.removeEventListener("visibilitychange", cancelIfHidden);
    };
  }, [ref, viewKey]);
}
