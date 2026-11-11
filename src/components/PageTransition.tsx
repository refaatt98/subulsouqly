import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to top on route change (keeps in-page #hash anchors working). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}

/** Soft fade + rise whenever the route changes, so a new page feels like a new place. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    first.current = false;
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      key={pathname}
      data-shown={shown}
      className="page-transition"
    >
      {children}
    </div>
  );
}
