import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Scoped-down port of agency's lib/nav.ts `useAppNavigate` for this
 * repo's 3-route site: given a target like "/#features" or "/articles",
 * navigates there if we're on a different route, or smooth-scrolls if
 * already there. No scroll-spy/active-state tracking or i18n key
 * indirection — agency's IntersectionObserver machinery is out of scope
 * here (see docs/plans/articles-page.md's Follow-ups).
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (path: string) => {
      const hashIndex = path.indexOf("#");
      if (hashIndex === -1) {
        if (location.pathname === path) {
          scrollToTop();
        } else {
          navigate(path);
        }
        return;
      }

      const pathname = path.slice(0, hashIndex) || "/";
      const hash = path.slice(hashIndex + 1);

      if (location.pathname === pathname) {
        scrollToId(hash);
      } else {
        navigate(path);
        // The target route's section may not have mounted yet (React
        // hasn't committed the new route on this tick) — poll across
        // frames, bounded, rather than guessing a fixed number of rAFs.
        let attempts = 0;
        const tryScroll = () => {
          if (document.getElementById(hash)) {
            scrollToId(hash);
          } else if (attempts++ < 60) {
            requestAnimationFrame(tryScroll);
          }
        };
        requestAnimationFrame(tryScroll);
      }
    },
    [navigate, location.pathname],
  );
}
