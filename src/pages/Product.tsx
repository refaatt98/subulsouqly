import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CartProvider, AddToCartButton } from "@/components/subul/cart";
import { Seo } from "@/components/Seo";
import { Reveal } from "@/components/subul/marks";
import { getSiteContent, mediaUrl } from "@/lib/site-content";

const contentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

function BackBar({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-sage/25 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link
          to="/#menu"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sage/40 bg-sage-soft px-4 font-display text-base text-olive transition-colors hover:bg-sage/20"
        >
          <ArrowRight className="size-4" aria-hidden />
          العودة إلى القائمة
        </Link>
        <span className="truncate font-display text-base text-espresso/70">{label}</span>
      </div>
    </div>
  );
}

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const { data } = useSuspenseQuery(contentQuery);

  const found = data.categories
    .flatMap((c) => c.items.map((i) => ({ item: i, category: c })))
    .find((x) => x.item.id === id);

  if (!found) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6 text-espresso"
      >
        <h1 className="font-display text-4xl">لم نجد هذا المنتج</h1>
        <Link to="/#menu" className="text-sage underline underline-offset-8">
          العودة إلى القائمة
        </Link>
      </main>
    );
  }

  const { item, category } = found;
  const related = category.items.filter((i) => i.id !== item.id).slice(0, 4);

  return (
    <CartProvider>
      <Seo
        title={`${item.name} | سُبّل كافي`}
        description={item.description ?? `${item.name} من قائمة سُبّل كافي في بئر هداج.`}
      />
      <main
        dir="rtl"
        lang="ar"
        className="min-h-screen bg-cream text-espresso"
        style={{ paddingBottom: "calc(2rem + var(--cart-bar-h, 0px))" }}
      >
        <BackBar label={item.name} />

        <div className="mx-auto max-w-6xl px-5 py-8 md:py-16">
          <nav aria-label="مسار التنقل" className="text-sm text-espresso/55">
            <Link to="/" className="transition-colors hover:text-sage">
              الرئيسية
            </Link>
            <span className="mx-2">/</span>
            <Link to="/#menu" className="transition-colors hover:text-sage">
              {category.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-espresso">{item.name}</span>
          </nav>

          <div className="mt-6 grid gap-8 md:mt-10 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-sage/30 bg-muted shadow-[0_18px_50px_-32px_var(--espresso)]">
                {item.image_url ? (
                  <img
                    src={mediaUrl(item.image_url)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-sage-soft" />
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex h-full flex-col justify-center">
                <span className="inline-flex w-fit items-center rounded-full border border-sage/40 bg-sage-soft px-3 py-1 font-display text-sm text-olive">
                  {category.name}
                </span>
                <h1 className="mt-4 font-display text-4xl leading-tight text-espresso md:text-6xl">
                  {item.name}
                </h1>
                {item.description && (
                  <p className="mt-5 max-w-md leading-loose text-espresso/65">{item.description}</p>
                )}
                <div className="mt-6 w-full max-w-md rounded-2xl border border-sage/35 bg-white/70 p-4 shadow-[0_14px_36px_-30px_var(--espresso)]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-espresso/55">السعر</span>
                    <span className="font-num text-3xl font-bold tabular-nums text-espresso">
                      {item.price} ₪
                    </span>
                  </div>
                  <div className="mt-4">
                    <AddToCartButton
                      variant="block"
                      item={{
                        id: item.id,
                        ar: item.name,
                        price: item.price,
                        image: item.image_url ? mediaUrl(item.image_url) : undefined,
                      }}
                    />
                  </div>
                </div>

              </div>
            </Reveal>
          </div>

          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-display text-3xl text-espresso">من نفس القائمة</h2>
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/product/${r.id}`}
                    className="group overflow-hidden rounded-xl border border-sage/30 bg-cream transition-shadow hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      {r.image_url ? (
                        <img
                          src={mediaUrl(r.image_url)}
                          alt={r.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-sage-soft" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <span className="font-display text-lg">{r.name}</span>
                      <span className="font-num text-sm tabular-nums text-espresso/70">
                        {r.price} ₪
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

      </main>
    </CartProvider>
  );
}
