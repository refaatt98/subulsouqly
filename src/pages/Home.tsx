import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Palm, PalmRow, PalmRail, Reveal } from "@/components/subul/marks";
import { SageCursor } from "@/components/subul/cursor";
import { CartProvider, AddToCartButton } from "@/components/subul/cart";
import { Seo } from "@/components/Seo";
import { getSiteContent, mediaUrl, type SiteContent } from "@/lib/site-content";

import blurCup from "@/assets/blur-cup.jpeg";
import cupLeaves from "@/assets/cup-leaves.jpeg";
import handHold from "@/assets/hand-hold.png";
import subulLogo from "@/assets/subul-logo.png";

const contentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

/** Data-driven sections. Kept in their own Suspense so the hero paints instantly. */
function ContentSections() {
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <>
      <Menu categories={data.categories} />
      <Gallery shots={data.gallery} />
      <HandSection />
      <Space shots={data.space} />
    </>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <Seo
        title="سُبّل كافي | قهوة مختصة في بئر هداج"
        description="سُبّل كافي — قهوة تجمع الأصالة والذوق. مقهى مختص في بئر هداج، مذاق أصيل ودفء في كل كوب."
        ogTitle="سُبّل كافي | طريق المذاق الأصيل"
        ogDescription="قهوة مختصة في بئر هداج — أصالة، دفء، وتفاصيل لا تُنسى."
        ogImage={`https://subul.coffee${cupLeaves}`}
      />
      <main
        dir="rtl"
        lang="ar"
        className="relative overflow-x-hidden bg-cream text-espresso"
        style={{ paddingBottom: "var(--cart-bar-h, 0px)" }}
      >
        <SageCursor />
        <Hero />
        <Story />
        <Suspense
          fallback={
            <section className="flex min-h-[50vh] items-center justify-center text-espresso/50">
              جارٍ تحميل القائمة...
            </section>
          }
        >
          <ContentSections />
        </Suspense>
        <Contact />
        <Footer />
      </main>
    </CartProvider>
  );
}


/* ------------------------------- 1. HERO ------------------------------- */
function Hero() {
  const [drift, setDrift] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setDrift({
        x: (e.clientX / window.innerWidth - 0.5) * 26,
        y: (e.clientY / window.innerHeight - 0.5) * 18,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-cream px-6">
      {/* faint large-scale palm pattern with slow parallax drift */}
      <div
        className="pointer-events-none absolute inset-[-10%] flex flex-wrap items-center justify-center gap-16 text-sage opacity-[0.07]"
        style={{
          transform: `translate3d(${drift.x}px, ${drift.y}px, 0)`,
          transition: "transform 1.6s cubic-bezier(.16,1,.3,1)",
        }}
        aria-hidden="true"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <Palm key={i} className="h-56 w-auto" strokeWidth={0.7} />
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        <div
          data-logo
          className="opacity-0"
          style={{ animation: "fadeUp 1s ease-out 0.05s forwards" }}
        >
          <img
            src={subulLogo}
            alt="سُبّل كافي — Subul Coffee"
            decoding="async"
            fetchPriority="high"
            className="h-auto w-[min(78vw,560px)]"
          />

        </div>
      </div>

      <div
        className="relative mt-20 w-full max-w-4xl text-sage opacity-0"
        style={{ animation: "fadeUp 1.4s ease-out 2.8s forwards" }}
      >
        <PalmRow count={18} animate={false} className="opacity-70" />
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-3">
        <span className="scroll-cue block h-14 w-px bg-sage" />
      </div>
    </section>
  );
}

/* ------------------------------ 2. STORY ------------------------------ */
function Story() {
  const ref = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      const el = ref.current;
      const img = imgRef.current;
      if (!el || !img) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const p = 1 - r.top / window.innerHeight;
      img.style.transform = `translate3d(0, ${p * -60}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-espresso py-32 md:py-44">
      <img
        ref={imgRef}
        src={blurCup}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-[130%] w-full object-cover opacity-15 blur-sm will-change-transform"
      />

      <PalmRail className="absolute top-1/2 left-6 hidden -translate-y-1/2 text-cream/25 lg:flex" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 md:grid-cols-12">
        <Reveal className="md:col-span-7 md:col-start-6">
          <p className="caption-latin mb-8 text-[0.65rem] text-sage" dir="ltr">
            Our Story
          </p>
          <h2 className="font-display text-4xl leading-[1.7] text-cream md:text-6xl">
            أصالة، دفء، وتفاصيل
            <br />
            لا تُنسى
          </h2>
        </Reveal>

        <Reveal delay={180} className="md:col-span-5 md:col-start-3 md:mt-24">
          <p className="text-lg leading-[2.2] text-cream/80">
            سُبّل أكثر من مجرد مقهى. هو طريق يبدأ من كوب واحد — بسيط في شكله، عميق في أثره. نختار
            حبّتنا بعناية، ونحمّصها على مهل، ونقدّمها بطريقةٍ تشبه ضيافة أهلنا: بلا ضجيج، وبكثير من
            الاهتمام.
          </p>
          <p className="mt-8 text-lg leading-[2.2] text-cream/60">
            من بئر هداج انطلقنا، ومن نخيلها استعرنا رمزنا: صفٌّ من النخل يمشي على حافة كل كوب،
            يذكّرنا أن الجذور هي ما يمنح المذاق معناه.
          </p>
          <div className="mt-10 h-px w-24 bg-sage" />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- 3. MENU ------------------------------ */
type MenuItem = SiteContent["categories"][number]["items"][number];

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <Reveal delay={index * 60}>
      <Link
        to={`/product/${item.id}`}
        data-interactive
        className="sway-on-hover group flex h-full flex-col overflow-hidden rounded-lg border border-sage/30 bg-cream transition-shadow duration-500 hover:shadow-[0_18px_40px_-24px_var(--espresso)]"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {item.image_url ? (
            <img
              src={mediaUrl(item.image_url)}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-sage-soft" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
          <h3 className="font-display text-xl text-espresso md:text-2xl">{item.name}</h3>
          {item.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-espresso/55 md:text-sm">
              {item.description}
            </p>
          )}
          <div className="mt-auto pt-3">
            <span className="block text-right font-num text-base tabular-nums text-espresso/80 md:text-lg">
              {item.price} ₪
            </span>
            <span
              className="mt-2.5 block"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <AddToCartButton
                item={{
                  id: item.id,
                  ar: item.name,
                  price: item.price,
                  image: item.image_url ? mediaUrl(item.image_url) : undefined,
                }}
              />
            </span>
          </div>

        </div>
      </Link>
    </Reveal>
  );
}

function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
      {items.map((m, i) => (
        <MenuCard key={m.id} item={m} index={i} />
      ))}
    </div>
  );
}


function PourLine() {
  const { ref, shown } = usePathDraw();
  return (
    <svg
      ref={ref}
      viewBox="0 0 20 160"
      className="mx-auto my-16 h-40 w-6 text-sage"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 0c-4 26 4 40 0 62s-5 34 0 54 3 30 0 44"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: shown ? 0 : 200,
          transition: "stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)",
        }}
      />
    </svg>
  );
}

function usePathDraw() {
  const ref = useRef<SVGSVGElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setShown(true)),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Menu({ categories }: { categories: SiteContent["categories"] }) {
  const [first, ...rest] = categories;

  return (
    <section id="menu" className="relative bg-cream py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-sage/40 bg-sage-soft px-4 py-1.5 font-display text-sm text-olive">
            قائمة المشروبات
          </p>

          <h2 className="font-display text-5xl text-espresso md:text-7xl">
            {first?.name ?? "قهوتك"}
          </h2>
          {first?.subtitle && <p className="mt-6 max-w-md text-espresso/60">{first.subtitle}</p>}
        </Reveal>

        <div className="mt-16">
          <MenuGrid items={first?.items ?? []} />
        </div>

        {rest.map((cat) => (
          <div key={cat.id}>
            <PourLine />
            <Reveal>
              <p className="font-display text-3xl text-sage md:text-4xl">{cat.name}</p>
              {cat.subtitle && <p className="mt-2 text-sm text-espresso/60">{cat.subtitle}</p>}
            </Reveal>
            <div className="mt-8">
              <MenuGrid items={cat.items} />
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}

/* ------------------------------ 4. GALLERY ---------------------------- */
type Shot = { id: string; image_url: string; caption: string | null };

/** Drag / swipe / wheel horizontal scrolling for a snap track. */
function useDragScroll() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const atEnd = el.scrollLeft - (el.scrollWidth - el.clientWidth) <= 1;
      const atStart = el.scrollLeft >= -1;
      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return;
      e.preventDefault();
      el.scrollLeft -= e.deltaY;
    };

    let down = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // native touch scrolling handles this
      down = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.scrollSnapType = "none";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startScroll + (e.clientX - startX);
    };
    const onPointerUp = () => {
      if (!down) return;
      down = false;
      el.style.scrollSnapType = "";
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // RTL: "next" scrolls toward negative scrollLeft
  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 1 ? -amount : amount, behavior: "smooth" });
  };

  return { trackRef, nudge };
}

function ArrowButtons({ nudge }: { nudge: (dir: 1 | -1) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        data-interactive
        onClick={() => nudge(-1)}
        aria-label="السابق"
        className="sway-on-hover flex h-11 w-11 items-center justify-center rounded-full border border-sage/50 text-sage transition-colors hover:bg-sage hover:text-cream"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        data-interactive
        onClick={() => nudge(1)}
        aria-label="التالي"
        className="sway-on-hover flex h-11 w-11 items-center justify-center rounded-full border border-sage/50 text-sage transition-colors hover:bg-sage hover:text-cream"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="ms-2 text-xs text-espresso/40">أو اسحب يميناً ويساراً</span>
    </div>
  );
}

function Gallery({ shots }: { shots: Shot[] }) {
  const { trackRef, nudge } = useDragScroll();
  if (shots.length === 0) return null;

  return (
    <section className="bg-cream py-12">
      <div className="mx-auto max-w-6xl px-6 text-sage">
        <PalmRow count={20} className="opacity-60" />
      </div>

      <div
        ref={trackRef}
        className="no-bar mt-12 flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-6 active:cursor-grabbing"
      >
        {shots.map((s) => (
          <figure
            key={s.id}
            className="group relative w-[78vw] shrink-0 snap-center md:w-[38vw] lg:w-[30vw]"
          >
            <div className="overflow-hidden bg-muted">
              <img
                src={mediaUrl(s.image_url)}
                alt={s.caption ?? ""}
                loading="lazy"
                draggable={false}
                className="h-[58vh] w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
              />
            </div>
            {s.caption && (
              <figcaption className="mt-4 flex items-center gap-3 text-sm text-espresso/60">
                <Palm className="h-4 w-auto text-sage" />
                {s.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <div className="mx-auto flex max-w-6xl justify-center px-6">
        <ArrowButtons nudge={nudge} />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-8 text-sage">
        <PalmRow count={20} className="opacity-60" />
      </div>
    </section>
  );
}

/* ---------------------------- 4.5 HAND ------------------------------- */
function HandSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setP(Math.min(Math.max(1 - r.top / window.innerHeight, 0), 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={ref}
      className="relative z-10 overflow-hidden bg-sage md:flex md:min-h-[440px] md:items-center"
    >
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-around text-cream opacity-[0.08]"
        aria-hidden="true"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <PalmRow key={i} count={14} animate={false} />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-6 py-8 md:px-10 md:py-0 lg:px-16">
        <Reveal className="max-w-md md:mx-auto">
          <p className="caption-latin mb-5 text-[0.6rem] text-cream/70" dir="ltr">
            Take It With You
          </p>
          <h2 className="font-display break-words text-3xl leading-[1.7] text-cream sm:text-4xl lg:text-[2.75rem]">
            معك أينما كنت
          </h2>
          <p className="mt-5 max-w-xl break-words text-sm leading-[2.1] text-cream/85 md:text-base">
            كوبك جاهز يمشي معك — من كاونترنا إلى طريقك، نفس المذاق ونفس الدفء. اطلب واستلم، أو
            خلّينا نشوفك على الطاولة.
          </p>
          <div className="mt-8 h-px w-24 bg-cream/70" />
        </Reveal>
      </div>

      <img
        src={handHold}
        alt="يد تحمل كوب سُبّل"
        loading="lazy"
        className="relative z-10 me-auto block h-[300px] w-auto -mb-2 md:absolute md:bottom-0 md:right-0 md:mx-0 md:h-full md:mb-0"
        style={{
          filter: "drop-shadow(0 28px 44px rgba(77,54,46,0.35))",
          transform: `translateY(${(p - 0.5) * -18}px)`,
          transition: "transform .25s linear",
        }}
      />
    </section>
  );
}

/* ------------------------------ 5. SPACE ------------------------------ */
function Space({ shots }: { shots: Shot[] }) {
  const { trackRef, nudge } = useDragScroll();

  return (
    <section className="relative bg-sage-soft py-20 md:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:col-span-4">
          <p className="caption-latin mb-6 text-[0.65rem] text-sage" dir="ltr">
            The Space
          </p>
          <h2 className="font-display text-3xl leading-relaxed text-espresso sm:text-4xl md:text-5xl">
            المكان
            <br />
            بئر هداج
          </h2>
          <p className="mt-6 leading-[2.1] text-espresso/70 md:mt-8">
            جدران بلون الطين، كراسي خيزران، ومظلة زيتونية تكسر الشمس. ندخلك من قوس واسع إلى ضوءٍ
            دافئ معلّق فوق الطاولات.
          </p>
          <div className="mt-8 flex items-center gap-4 text-espresso">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-sage"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
            >
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            <span className="text-lg">بئر هداج</span>
          </div>
        </Reveal>

        <div className="lg:col-span-8">
          <div
            ref={trackRef}
            className="no-bar -mx-6 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 active:cursor-grabbing lg:mx-0 lg:px-0"
          >
            {shots.map((s) => (
              <figure
                key={s.id}
                className="group relative w-[80%] shrink-0 snap-center sm:w-[55%] lg:w-[46%]"
              >
                <div className="overflow-hidden bg-muted">
                  <img
                    src={mediaUrl(s.image_url)}
                    alt={s.caption ?? ""}
                    loading="lazy"
                    draggable={false}
                    className="h-[46vh] w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105 md:h-[54vh]"
                  />
                </div>
                {s.caption && (
                  <figcaption className="mt-3 flex items-center gap-2 text-sm text-espresso/60">
                    <Palm className="h-4 w-auto text-sage" />
                    {s.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
          <div className="mt-4">
            <ArrowButtons nudge={nudge} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- 6. CONTACT ----------------------------- */
function Contact() {
  return (
    <section className="relative overflow-hidden bg-cream py-32 md:py-44">
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-around text-sage opacity-[0.12]"
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <PalmRow key={i} count={16} animate={false} />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <Reveal>
          <p className="caption-latin text-[0.65rem] text-sage" dir="ltr">
            Taste the moment
          </p>
          <h2 className="mt-8 font-display text-4xl leading-[1.8] text-espresso md:text-6xl">
            سُبّل — طريق المذاق الأصيل
          </h2>
        </Reveal>

        <Reveal delay={150} className="mt-14">
          <a
            href="tel:0546700285"
            className="sway-on-hover group inline-flex items-center gap-5 text-espresso"
          >
            <Palm className="h-10 w-auto text-sage" />
            <span className="font-num text-3xl tracking-[0.2em] md:text-5xl" dir="ltr">
              054 670 0285
            </span>
          </a>
          <p className="mt-4 text-sm text-espresso/50">اضغط للاتصال</p>
        </Reveal>

        <Reveal delay={280} className="mt-14 flex items-center gap-8 text-espresso/70">
          <a href="#" aria-label="إنستغرام" className="transition-colors hover:text-sage">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a href="#" aria-label="واتساب" className="transition-colors hover:text-sage">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
            >
              <path d="M3.5 20.5 5 16.4A8 8 0 1 1 8 19.3l-4.5 1.2Z" strokeLinejoin="round" />
              <path
                d="M9 9.4c.5 3 2.6 4.9 5.4 5.4.8.1 1.4-.6 1.2-1.4l-.2-.7-1.9-.5-.9.9c-1-.5-1.8-1.3-2.3-2.3l.9-.9-.5-1.9-.7-.2c-.8-.2-1.5.4-1.4 1.2Z"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href="#" aria-label="تيك توك" className="transition-colors hover:text-sage">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
            >
              <path d="M14 3v11.2a3.4 3.4 0 1 1-3-3.4" strokeLinejoin="round" />
              <path d="M14 5.6c.8 1.9 2.3 3 4.5 3.1" strokeLinejoin="round" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ 7. FOOTER ----------------------------- */
function Footer() {
  return (
    <footer className="bg-sage px-6 py-16 text-cream">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center">
          <div data-logo>
            <img src={subulLogo} alt="سُبّل كافي — Subul Coffee" className="h-auto w-64" />
          </div>
        </div>
        <div className="mt-12 text-cream/70">
          <PalmRow count={18} animate={false} className="opacity-60" />
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 text-xs text-cream/80 md:flex-row md:justify-between">
          <span>قهوة تجمع الأصالة والذوق — بئر هداج</span>
          <a href="tel:0546700285" className="font-num tracking-widest" dir="ltr">
            054 670 0285
          </a>
          <span dir="ltr">© {new Date().getFullYear()} Subul Coffee</span>
        </div>
      </div>
    </footer>
  );
}
