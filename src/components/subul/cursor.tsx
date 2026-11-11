import { useEffect, useRef, useState } from "react";

export function SageCursor() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [logo, setLogo] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let x = -100;
    let y = -100;
    let frame = 0;
    let lastActive: boolean | null = null;
    let lastLogo = false;

    const paint = () => {
      frame = 0;
      const wrap = wrapRef.current;
      if (wrap) wrap.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);

      const t = e.target as HTMLElement | null;
      const onLogo = !!t?.closest("[data-logo]");
      const onInteractive = !!t?.closest("a,button,[data-interactive]");
      if (onLogo !== lastLogo) {
        lastLogo = onLogo;
        setLogo(onLogo);
      }
      if (onInteractive !== lastActive || onLogo !== lastLogo) {
        lastActive = onInteractive;
        const dot = dotRef.current;
        if (dot) {
          const size = onLogo ? 40 : onInteractive ? 14 : 26;
          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.backgroundColor = onInteractive && !onLogo ? "var(--sage)" : "transparent";
        }
      }
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden will-change-transform md:block"
      aria-hidden="true"
    >
      <div
        ref={dotRef}
        className="flex items-center justify-center rounded-full border border-sage text-sage"
        style={{
          width: 26,
          height: 26,
          backgroundColor: "transparent",
          transition: "width .28s cubic-bezier(.16,1,.3,1), height .28s cubic-bezier(.16,1,.3,1), background-color .2s ease",
        }}
      >
        {logo && (
          <svg viewBox="0 0 24 40" className="h-5 w-5" fill="none" stroke="currentColor">
            <path d="M12 12v27" strokeWidth="1.4" strokeLinecap="round" />
            <path
              d="M12 12C8.6 9.4 4.8 9 1.6 11.4M12 12C9.6 8.2 6 6.2 2.2 6.6M12 12c-1-4 0-7.6 2.6-9.6M12 12c2.6-3.4 6.4-4.6 9.6-3.2M12 12c3.4-1 7 0 9.4 2.8"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
