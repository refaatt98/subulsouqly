import { useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- single palm, line art matching logo stroke weight ---------- */
export function Palm({
  className = "",
  strokeWidth = 1.1,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 40"
      className={`palm-glyph ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 12v27" />
      <path d="M12 12C8.6 9.4 4.8 9 1.6 11.4" />
      <path d="M12 12C9.6 8.2 6 6.2 2.2 6.6" />
      <path d="M12 12c-1-4 0-7.6 2.6-9.6" />
      <path d="M12 12c2.6-3.4 6.4-4.6 9.6-3.2" />
      <path d="M12 12c3.4-1 7 0 9.4 2.8" />
      <path d="M9.6 39h4.8" />
    </svg>
  );
}

/* ---------- the signature: a horizontal row of palms ---------- */
export function PalmRow({
  count = 22,
  className = "",
  animate = true,
}: {
  count?: number;
  className?: string;
  animate?: boolean;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`flex w-full items-end justify-between gap-1 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Palm
          key={i}
          className="h-8 w-auto shrink-0 origin-bottom"
          strokeWidth={1.4}
          {...({
            style: {
              opacity: animate ? (shown ? 1 : 0) : 1,
              transform: animate ? (shown ? "scaleY(1)" : "scaleY(0.2)") : undefined,
              transition: "opacity .6s ease, transform .8s cubic-bezier(.16,1,.3,1)",
              transitionDelay: `${i * 45}ms`,
            },
          } as { style: React.CSSProperties })}
        />
      ))}
    </div>
  );
}

export function PalmRail({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-between gap-6 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Palm key={i} className="h-16 w-auto" strokeWidth={1.2} />
      ))}
    </div>
  );
}

/* ---------- wordmark: elongated سُبـل with palm on the letter ---------- */
export function Wordmark({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  return (
    <svg
      viewBox="0 0 460 150"
      className={className}
      fill="none"
      aria-label="سُبّل — Subul Coffee"
      role="img"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          draw
            ? {
                strokeDasharray: 1400,
                strokeDashoffset: 1400,
                animation: "drawStroke 2.6s cubic-bezier(.16,1,.3,1) forwards",
              }
            : undefined
        }
      >
        {/* extended baseline stroke, thick to thin, stretching left like a horizon */}
        <path d="M18 96c14 12 38 14 74 14h236" strokeWidth="12" />
        {/* the closing sin bowl on the right */}
        <path d="M328 110c26 0 40-10 40-28 0-10-4-18-12-24" strokeWidth="12" />
        <path d="M368 82c6-8 16-12 26-9" strokeWidth="9" />
        {/* shadda + damma marks */}
        <path d="M282 62c6-7 13-7 19 0" strokeWidth="6.5" />
        <path d="M292 50c5-6 11-6 16 0" strokeWidth="4" />
        <path d="M404 44c8-8 18-6 18 4 0 7-7 10-14 8" strokeWidth="6" />
        {/* ba dot */}
        <path d="M262 124h1" strokeWidth="12" />
      </g>
      {/* palm growing out of the letter */}
      <g
        transform="translate(206 18) scale(1.7)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M12 12v28" />
        <path d="M12 12C8.6 9.4 4.8 9 1.6 11.4" />
        <path d="M12 12C9.6 8.2 6 6.2 2.2 6.6" />
        <path d="M12 12c-1-4 0-7.6 2.6-9.6" />
        <path d="M12 12c2.6-3.4 6.4-4.6 9.6-3.2" />
        <path d="M12 12c3.4-1 7 0 9.4 2.8" />
      </g>
    </svg>
  );
}

export function LatinCaption({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} dir="ltr">
      <span className="block h-px w-8 bg-current opacity-70" />
      <span className="caption-latin text-[0.7rem] md:text-xs">Subul Coffee</span>
      <span className="block h-px w-8 bg-current opacity-70" />
    </div>
  );
}

/* ---------- reveal hook, RTL-aware (transform set in CSS utility) ---------- */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, shown };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-shown={shown}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
