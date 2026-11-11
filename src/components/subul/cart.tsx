import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DeliveryZone = { id: string; name: string; price: number };

export type CartItem = { id: string; ar: string; price: number; image: string | undefined; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

const WHATSAPP_NORMAL = "972546700285";
const WHATSAPP_WOMEN = "972545953324";
const CART_STORAGE_KEY = "subul-cart-v1";

function readSavedCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.ar === "string" &&
        typeof item.price === "number" &&
        typeof item.qty === "number" &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readSavedCart);
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode / full storage: keep the cart in memory only */
    }
  }, [items]);


  const [isOpen, setIsOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return {
      items,
      count,
      total,
      add: (item) => {
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found) return prev.map((p) => (p.id === item.id ? { ...p, ...item, qty: p.qty + 1 } : p));
          return [...prev, { ...item, qty: 1 }];
        });
      },
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, qty } : p)),
        ),
      clear: () => setItems([]),
      open: () => setIsOpen(true),
    };
  }, [items]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <FloatingCartBar
        count={value.count}
        total={value.total}
        onOpen={() => {
          setCheckout(false);
          setIsOpen(true);
        }}
        onCheckout={() => {
          setCheckout(true);
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <CartDrawer
          onClose={() => {
            setIsOpen(false);
            setCheckout(false);
          }}
          checkout={checkout}
          setCheckout={setCheckout}
        />
      )}
    </Ctx.Provider>
  );
}

export function AddToCartButton({
  item,
  variant = "icon",
}: {
  item: Omit<CartItem, "qty">;
  variant?: "icon" | "block";
}) {
  const { add, items, setQty } = useCart();
  const qty = items.find((p) => p.id === item.id)?.qty ?? 0;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const block = variant === "block";

  if (qty === 0) {
    return (
      <button
        type="button"
        data-interactive
        aria-label={`أضف ${item.ar} إلى السلة`}
        onClick={(e) => {
          stop(e);
          add(item);
        }}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-full bg-espresso text-cream shadow-md shadow-espresso/20 transition-transform hover:bg-olive active:scale-95 ${
          block ? "w-full px-6 py-3 text-base font-bold" : "w-full px-3 py-2 text-sm font-semibold"
        }`}
      >
        <CartIcon className={block ? "h-5 w-5" : "h-4 w-4"} />
        <span>أضف للسلة</span>
      </button>
    );
  }

  return (
    <div
      dir="ltr"
      className={`flex min-h-11 items-center justify-between gap-1 rounded-full bg-espresso px-1.5 text-cream shadow-md shadow-espresso/20 ${
        block ? "w-full max-w-[16rem] py-1" : "w-full"
      }`}
    >
      <button
        type="button"
        data-interactive
        aria-label={`إنقاص كمية ${item.ar}`}
        onClick={(e) => {
          stop(e);
          setQty(item.id, qty - 1);
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-cream/20 active:scale-95"
      >
        −
      </button>
      <span className="min-w-6 text-center font-num text-sm font-bold tabular-nums">{qty}</span>
      <button
        type="button"
        data-interactive
        aria-label={`زيادة كمية ${item.ar}`}
        onClick={(e) => {
          stop(e);
          add(item);
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-cream/20 active:scale-95"
      >
        +
      </button>
    </div>
  );
}


function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.1a2 2 0 0 0 2-1.5L20 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}

function FloatingCartBar({
  count,
  total,
  onOpen,
  onCheckout,
}: {
  count: number;
  total: number;
  onOpen: () => void;
  onCheckout: () => void;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--cart-bar-h",
      count > 0
        ? "calc(5rem + var(--vv-bottom, 0px) + var(--chrome-gap, 0px) + var(--bar-lift, 3.5rem) + env(safe-area-inset-bottom, 0px))"
        : "0px",
    );
    return () => root.style.setProperty("--cart-bar-h", "0px");
  }, [count]);

  if (count === 0) return null;
  return (
    <div
      dir="rtl"
      className="fixed inset-x-0 z-50 border-t border-espresso/15 bg-cream/95 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(60,40,25,0.12)] backdrop-blur-md"
      style={{
        bottom:
          "calc(var(--vv-bottom, 0px) + var(--chrome-gap, 0px) + var(--bar-lift, 3.5rem))",
      }}

    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <button
          type="button"
          data-interactive
          onClick={onOpen}
          aria-label="عرض السلة"
          className="flex min-h-11 flex-1 items-center gap-3 rounded-full px-2 text-espresso transition-colors hover:bg-sage-soft"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-espresso text-cream">
            <CartIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-olive px-1 font-num text-[11px] font-bold tabular-nums text-cream">
              {count}
            </span>
          </span>
          <span className="min-w-0 text-right">
            <span className="block font-num text-lg font-bold tabular-nums leading-tight">
              {total} ₪
            </span>
            <span className="block text-xs text-espresso/60">{count} عنصر في السلة</span>
          </span>
        </button>
        <button
          type="button"
          data-interactive
          onClick={onOpen}
          className="min-h-11 shrink-0 rounded-full bg-olive px-6 font-bold text-cream shadow-md shadow-olive/25 transition-transform hover:opacity-90 active:scale-95"
        >
          إتمام الطلب
        </button>
      </div>
    </div>
  );
}


type Method = "pickup" | "delivery";
type Section = "normal" | "women";

function CartDrawer({
  onClose,
  checkout,
  setCheckout,
}: {
  onClose: () => void;
  checkout: boolean;
  setCheckout: (v: boolean) => void;
}) {
  const { items, total, setQty, remove, clear } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<Method | "">("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [section, setSection] = useState<Section | "">("");
  const [error, setError] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState("");

  useEffect(() => {
    supabase
      .from("delivery_zones")
      .select("id, name, price, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) =>
        setZones((data ?? []).map((z) => ({ id: z.id, name: z.name, price: Number(z.price) }))),
      );
  }, []);

  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const deliveryFee = zone ? zone.price : 0;
  const grandTotal = total + deliveryFee;

  const submit = () => {
    if (!name.trim()) return setError("الرجاء إدخال الاسم الكامل");
    if (!phone.trim()) return setError("الرجاء إدخال رقم الهاتف");
    if (!method) return setError("الرجاء اختيار طريقة استلام الطلب");
    if (method === "delivery" && !address.trim()) return setError("الرجاء إدخال العنوان");
    if (zones.length > 0 && !zoneId) return setError("الرجاء اختيار منطقة التوصيل");
    if (!section) return setError("الرجاء اختيار القسم (عادي أو قسم النساء)");
    setError("");

    const lines = [
      "*طلب جديد — سُبّل كافي*",
      "",
      `*الاسم:* ${name}`,
      `*رقم الهاتف:* ${phone}`,
      `*طريقة الاستلام:* ${method === "pickup" ? "استلام من المحل" : "توصيل للبيت"}`,
      ...(address.trim() ? [`*العنوان:* ${address}`] : []),
      ...(zone ? [`*منطقة التوصيل:* ${zone.name} — ${zone.price} ₪`] : []),
      `*القسم:* ${section === "women" ? "قسم النساء" : "عادي"}`,
      "",
      "*الطلب:*",
      ...items.map((i) => `• ${i.ar} × ${i.qty} — ${i.qty * i.price} ₪`),
      "",
      `*مجموع الطلب:* ${total} ₪`,
      ...(deliveryFee ? [`*رسوم التوصيل:* ${deliveryFee} ₪`] : []),
      `*المجموع الكلي:* ${grandTotal} ₪`,
      ...(notes.trim() ? ["", `*ملاحظات:* ${notes}`] : []),
    ];

    const number = section === "women" ? WHATSAPP_WOMEN : WHATSAPP_NORMAL;
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("cart-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("cart-open");
    };

  }, [onClose]);

  const inputCls =
    "w-full rounded-xl border border-sage/30 bg-white px-4 py-3 text-espresso outline-none transition-all placeholder:text-espresso/30 focus:border-espresso/60 focus:ring-2 focus:ring-espresso/10";
  const labelCls = "mb-1.5 block text-sm font-semibold text-espresso/70 mr-1";

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex"
      dir="rtl"
      style={{ height: "calc(var(--app-h, 100dvh) - var(--chrome-gap, 0px))" }}
    >

      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-espresso/50 backdrop-blur-sm"
      />
      <aside className="relative ms-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-cream shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-sage/20 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="font-display text-xl font-bold text-espresso">
            {checkout ? "إتمام الطلب" : "سلة الطلبات"}
          </h2>
          <button
            type="button"
            data-interactive
            onClick={onClose}
            aria-label="إغلاق السلة"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-espresso/5 text-espresso/50 transition-colors hover:bg-espresso/10 hover:text-espresso"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-espresso/50">السلة فارغة</p>
          ) : !checkout ? (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 border-b border-sage/20 pb-4">
                  <div className="row-span-2 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-lg border border-sage/25 bg-sage-soft">
                    {i.image ? (
                      <img
                        src={i.image}
                        alt={i.ar}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />

                    ) : (
                      <div className="h-full w-full bg-sage-soft" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg text-espresso">{i.ar}</p>
                    <p className="font-num text-sm text-espresso/60">{i.price} ₪</p>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-interactive
                      aria-label="إنقاص"
                      onClick={() => setQty(i.id, i.qty - 1)}
                      className="h-10 w-10 rounded-full border border-sage bg-cream text-lg text-olive hover:bg-sage hover:text-cream"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-num tabular-nums">{i.qty}</span>
                    <button
                      type="button"
                      data-interactive
                      aria-label="زيادة"
                      onClick={() => setQty(i.id, i.qty + 1)}
                      className="h-10 w-10 rounded-full border border-sage bg-cream text-lg text-olive hover:bg-sage hover:text-cream"
                    >
                      +
                    </button>
                    </div>
                  <button
                    type="button"
                    data-interactive
                    onClick={() => remove(i.id)}
                    className="min-h-10 px-2 text-sm text-espresso/60 hover:text-espresso"
                  >
                    حذف
                  </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>
                    الاسم الكامل <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ادخل اسمك هنا"
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    رقم الهاتف <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={`${inputCls} text-right`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    dir="ltr"
                    placeholder="05X-XXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <span className={labelCls}>
                  طريقة استلام الطلب <span className="text-red-400">*</span>
                </span>
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-espresso/5 p-1">
                  {(
                    [
                      ["pickup", "استلام من المحل"],
                      ["delivery", "توصيل للبيت"],
                    ] as [Method, string][]
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      data-interactive
                      onClick={() => setMethod(v)}
                      className={`rounded-xl py-3 text-sm transition-all ${
                        method === v
                          ? "bg-white font-bold text-espresso shadow-sm"
                          : "font-medium text-espresso/50 hover:bg-white/60"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>
                    العنوان {method === "delivery" && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    className={inputCls}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="العنوان بالتفصيل"
                  />
                </div>

                {zones.length > 0 && (
                  <div>
                    <label className={labelCls}>
                      منطقة التوصيل <span className="text-red-400">*</span>
                    </label>
                    <select
                      className={inputCls}
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                    >
                      <option value="">اختر المنطقة</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} — {z.price} ₪
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className={labelCls}>
                  القسم <span className="text-red-400">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["normal", "عادي"],
                      ["women", "قسم النساء"],
                    ] as [Section, string][]
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      data-interactive
                      onClick={() => setSection(v)}
                      className={`rounded-xl py-3.5 text-sm transition-all ${
                        section === v
                          ? "bg-espresso font-bold text-cream shadow-lg shadow-espresso/20"
                          : "border border-sage/30 bg-white font-medium text-espresso/70 hover:border-espresso/50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>ملاحظات</label>
                <textarea
                  className={`${inputCls} min-h-24 resize-none`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات على الطلب"
                />
              </div>
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="shrink-0 border-t border-sage/20 bg-white px-4 pb-[max(1.5rem,calc(1rem+env(safe-area-inset-bottom)))] pt-4 sm:px-6 sm:pt-6">
            <div className="mb-5 space-y-2">
              {deliveryFee > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm text-espresso/60">
                    <span>مجموع الطلب</span>
                    <span className="font-num tabular-nums">{total} ₪</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-espresso/60">
                    <span>التوصيل ({zone?.name})</span>
                    <span className="font-num tabular-nums">{deliveryFee} ₪</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-espresso/50">المجموع</span>
                <span className="font-num text-2xl font-bold tabular-nums text-espresso">
                  {grandTotal} ₪
                </span>
              </div>
            </div>
            {!checkout ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  data-interactive
                  onClick={() => setCheckout(true)}
                  className="flex-1 rounded-full bg-espresso py-3.5 text-cream transition-opacity hover:opacity-90"
                >
                  متابعة الطلب
                </button>
                <button
                  type="button"
                  data-interactive
                  onClick={clear}
                  className="min-h-12 rounded-full border border-sage/60 bg-cream px-5 text-sm text-espresso hover:bg-sage-soft"
                >
                  تفريغ
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  data-interactive
                  onClick={submit}
                  disabled={zones.length > 0 && !zoneId}
                  className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-olive py-4 font-bold text-cream shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  إتمام الطلب عبر واتساب
                </button>
                <button
                  type="button"
                  data-interactive
                  onClick={() => setCheckout(false)}
                  className="min-h-12 rounded-2xl border border-sage/40 bg-cream px-6 font-bold text-espresso transition-colors hover:bg-sage-soft"
                >
                  رجوع
                </button>
              </div>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}
