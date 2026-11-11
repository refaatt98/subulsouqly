import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Coffee,
  FolderTree,
  Images,
  Users,
  Search,
  Trash2,
  Plus,
  ChevronDown,
  Menu as MenuIcon,
  X,
  LogOut,
  ExternalLink,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl } from "@/lib/site-content";
import { ensureAdmin, uploadMedia } from "@/lib/admin-api";
import { Seo } from "@/components/Seo";
import { AdminAccounts } from "@/components/subul/admin-accounts";

/* ------------------------------ helpers ------------------------------ */

const card = "rounded-xl border border-sage/40 bg-card p-5";
const input =
  "w-full rounded-lg border border-sage/50 bg-cream px-3 py-2 text-sm text-espresso outline-none focus:border-sage";
const btn =
  "inline-flex items-center gap-2 rounded-lg bg-sage px-3 py-2 text-sm text-cream transition-opacity hover:opacity-90 disabled:opacity-40";
const btnGhost =
  "inline-flex items-center gap-2 rounded-lg border border-sage/50 px-3 py-2 text-sm text-espresso transition-colors hover:bg-sage/10";
const btnDanger =
  "inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10";
const iconDanger =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10";

async function uploadImage(file: File) {
  return uploadMedia(file);
}

function ImagePicker({
  value,
  onChange,
  label = "الصورة",
}: {
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={mediaUrl(value)} alt="" className="h-14 w-14 rounded-lg object-cover" />
      ) : (
        <div className="h-14 w-14 rounded-lg bg-muted" />
      )}
      <div className="flex-1">
        <span className="text-xs text-espresso/60">{label}</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              onChange(await uploadImage(file));
              toast.success("تم رفع الصورة");
            } catch (err) {
              toast.error("فشل رفع الصورة: " + (err as Error).message);
            }
            setBusy(false);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <button
          type="button"
          className={`${btnGhost} mt-1`}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "جارٍ الرفع..." : "تغيير الصورة"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- page -------------------------------- */

type Section =
  | "items"
  | "categories"
  | "gallery-main"
  | "gallery-space"
  | "delivery"
  | "accounts";

const NAV: { id: Section; label: string; hint: string; icon: typeof Coffee }[] = [
  { id: "items", label: "الأصناف والأسعار", icon: Coffee, hint: "ابحث وعدّل الأسعار والصور بسرعة" },
  { id: "categories", label: "الأقسام", icon: FolderTree, hint: "أسماء الأقسام وترتيبها" },
  { id: "gallery-main", label: "المعرض العلوي", icon: Images, hint: "صور المعرض في أعلى الصفحة" },
  { id: "gallery-space", label: "معرض المكان", icon: Images, hint: "صور قسم «المكان»" },
  {
    id: "delivery",
    label: "مناطق التوصيل",
    icon: Truck,
    hint: "المناطق وسعر التوصيل لكل منطقة",
  },
  { id: "accounts", label: "حسابات الإدارة", icon: Users, hint: "إنشاء وإدارة حسابات المدراء" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<"loading" | "ok" | "denied">("loading");
  const [section, setSection] = useState<Section>("items");
  const [userId, setUserId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    ensureAdmin()
      .then((r) => setAccess(r.isAdmin ? "ok" : "denied"))
      .catch(() => setAccess("denied"));
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (access === "loading") {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-cream text-espresso/60"
      >
        <Seo
          title="إدارة المحتوى | سُبّل كافي"
          description="لوحة إدارة أصناف وأسعار وصور سُبّل كافي."
          noindex
        />
        جارٍ التحقق...
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center"
      >
        <h1 className="font-display text-2xl text-espresso">لا تملك صلاحية الإدارة</h1>
        <button className={btnGhost} onClick={signOut}>
          تسجيل الخروج
        </button>
      </main>
    );
  }

  const active = NAV.find((n) => n.id === section)!;

  const navList = (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const Icon = n.icon;
        const on = n.id === section;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              setSection(n.id);
              setNavOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition-colors ${
              on ? "bg-sage text-cream" : "text-espresso/70 hover:bg-sage/10"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-cream">
      <div className="mx-auto flex max-w-7xl">
        {/* sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-sage/30 bg-card/60 p-4 md:block">
          <div className="px-2 pb-4">
            <p className="font-display text-xl text-espresso">سُبّل كافي</p>
            <p className="text-xs text-espresso/50">لوحة الإدارة</p>
          </div>
          {navList}
          <div className="mt-6 space-y-1 border-t border-sage/30 pt-4">
            <a
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-espresso/70 hover:bg-sage/10"
            >
              <ExternalLink className="h-4 w-4" />
              عرض الموقع
            </a>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm text-espresso/70 hover:bg-sage/10"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        </aside>

        {/* mobile drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              className="absolute inset-0 bg-espresso/40"
              aria-label="إغلاق"
              onClick={() => setNavOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 w-72 bg-card p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between px-2">
                <p className="font-display text-lg text-espresso">لوحة الإدارة</p>
                <button className={iconDanger} onClick={() => setNavOpen(false)} aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {navList}
              <div className="mt-6 space-y-1 border-t border-sage/30 pt-4">
                <a href="/" className={`${btnGhost} w-full justify-center`}>
                  عرض الموقع
                </a>
                <button className={`${btnGhost} w-full justify-center`} onClick={signOut}>
                  خروج
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
          <header className="flex items-start gap-3">
            <button
              className={`${btnGhost} md:hidden`}
              onClick={() => setNavOpen(true)}
              aria-label="القائمة"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-2xl text-espresso md:text-3xl">{active.label}</h1>
              <p className="mt-1 text-sm text-espresso/60">{active.hint}</p>
            </div>
          </header>

          <div className="mt-6">
            {section === "items" && <ItemsSection />}
            {section === "categories" && <CategoriesSection />}
            {section === "gallery-main" && <GallerySection gallery="main" />}
            {section === "gallery-space" && <GallerySection gallery="space" />}
            {section === "delivery" && <DeliverySection />}
            {section === "accounts" && <AdminAccounts currentUserId={userId} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------- data -------------------------------- */

type Category = {
  id: string;
  name: string;
  subtitle: string | null;
  sort_order: number;
};

type Item = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

function useCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, subtitle, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
}

function useItems() {
  return useQuery({
    queryKey: ["admin", "items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, image_url, sort_order, is_visible")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((i) => ({ ...i, price: Number(i.price) })) as Item[];
    },
  });
}

/* ------------------------------- items ------------------------------- */

function ItemsSection() {
  const qc = useQueryClient();
  const cats = useCategories();
  const items = useItems();
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const catName = (id: string | null) => cats.data?.find((c) => c.id === id)?.name ?? "بدون قسم";

  const filtered = useMemo(() => {
    const term = q.trim();
    return (items.data ?? []).filter(
      (i) =>
        (catFilter === "all" || i.category_id === catFilter) &&
        (!term || i.name.includes(term) || (i.description ?? "").includes(term)),
    );
  }, [items.data, q, catFilter]);

  const addItem = useMutation({
    mutationFn: async () => {
      const categoryId = catFilter !== "all" ? catFilter : (cats.data?.[0]?.id ?? null);
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          category_id: categoryId,
          name: "صنف جديد",
          price: 0,
          sort_order: (items.data?.length ?? 0) + 1,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setOpenId(id);
      refresh();
      toast.success("تمت إضافة صنف جديد — عدّل بياناته");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/40" />
          <input
            className={`${input} pr-9`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن صنف بالاسم..."
          />
        </div>
        <select
          className={`${input} w-auto`}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">كل الأقسام</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className={btn} onClick={() => addItem.mutate()}>
          <Plus className="h-4 w-4" />
          صنف جديد
        </button>
      </div>

      <p className="mt-3 text-xs text-espresso/50">{filtered.length} صنف</p>

      <div className="mt-3 divide-y divide-sage/25 overflow-hidden rounded-xl border border-sage/40 bg-card">
        {filtered.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            categories={cats.data ?? []}
            categoryName={catName(it.category_id)}
            open={openId === it.id}
            onToggle={() => setOpenId(openId === it.id ? null : it.id)}
            onChanged={refresh}
          />
        ))}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-espresso/50">لا توجد أصناف مطابقة</p>
        )}
      </div>
    </section>
  );
}

function ItemRow({
  item,
  categories,
  categoryName,
  open,
  onToggle,
  onChanged,
}: {
  item: Item;
  categories: Category[];
  categoryName: string;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [sortOrder, setSortOrder] = useState(String(item.sort_order));
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [visible, setVisible] = useState(item.is_visible);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [confirming, setConfirming] = useState(false);

  const save = async (patch?: Partial<Item>) => {
    const { error } = await supabase
      .from("menu_items")
      .update({
        name,
        description: description || null,
        price: Number(price) || 0,
        sort_order: Number(sortOrder) || 0,
        image_url: imageUrl,
        is_visible: visible,
        category_id: categoryId,
        ...patch,
      })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم الحفظ");
      onChanged();
    }
  };

  const remove = async () => {
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`تم حذف «${item.name}»`);
      onChanged();
    }
  };

  const toggleVisible = async () => {
    const next = !visible;
    setVisible(next);
    await save({ is_visible: next });
  };

  return (
    <div className={open ? "bg-sage/5" : ""}>
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-right"
        >
          {imageUrl ? (
            <img src={mediaUrl(imageUrl)} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-lg bg-muted" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-espresso">{name}</span>
            <span className="block truncate text-xs text-espresso/50">{categoryName}</span>
          </span>
          <span className="shrink-0 text-sm text-espresso/80">{Number(price) || 0} ₪</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-espresso/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={toggleVisible}
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs sm:block ${
            visible ? "bg-sage/20 text-espresso/70" : "bg-muted text-espresso/45"
          }`}
        >
          {visible ? "ظاهر" : "مخفي"}
        </button>
        {confirming ? (
          <span className="flex shrink-0 items-center gap-1">
            <button className={btnDanger} onClick={remove}>
              تأكيد
            </button>
            <button className={btnGhost} onClick={() => setConfirming(false)}>
              إلغاء
            </button>
          </span>
        ) : (
          <button
            className={iconDanger}
            onClick={() => setConfirming(true)}
            aria-label={`حذف ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-sage/25 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ImagePicker
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url);
                save({ image_url: url });
              }}
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <span className="text-xs text-espresso/60">الاسم</span>
                <input
                  className={`${input} mt-1`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <span className="text-xs text-espresso/60">السعر</span>
                <input
                  className={`${input} mt-1`}
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-xs text-espresso/60">الوصف / ملاحظة المذاق</span>
            <input
              className={`${input} mt-1`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <span className="text-xs text-espresso/60">القسم</span>
              <select
                className={`${input} mt-1`}
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
              >
                <option value="">بدون قسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <span className="text-xs text-espresso/60">الترتيب</span>
              <input
                className={`${input} mt-1`}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 py-2 text-sm text-espresso/70">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
              />
              ظاهر في الموقع
            </label>
            <button className={btn} onClick={() => save()}>
              حفظ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- categories ------------------------------ */

function CategoriesSection() {
  const qc = useQueryClient();
  const cats = useCategories();
  const items = useItems();
  const [newCat, setNewCat] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const addCategory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: newCat.trim(),
        sort_order: (cats.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewCat("");
      refresh();
      toast.success("تم إضافة القسم");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section>
      <div className={`${card} flex flex-wrap items-end gap-3`}>
        <div className="min-w-[220px] flex-1">
          <span className="text-xs text-espresso/60">قسم جديد</span>
          <input
            className={`${input} mt-1`}
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="مثال: قهوة باردة"
          />
        </div>
        <button className={btn} disabled={!newCat.trim()} onClick={() => addCategory.mutate()}>
          <Plus className="h-4 w-4" />
          إضافة قسم
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {cats.data?.map((c) => (
          <CategoryCard
            key={c.id}
            category={c}
            itemCount={(items.data ?? []).filter((i) => i.category_id === c.id).length}
            onChanged={refresh}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  itemCount,
  onChanged,
}: {
  category: Category;
  itemCount: number;
  onChanged: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [subtitle, setSubtitle] = useState(category.subtitle ?? "");
  const [sortOrder, setSortOrder] = useState(String(category.sort_order));
  const [confirming, setConfirming] = useState(false);

  const save = async () => {
    const { error } = await supabase
      .from("categories")
      .update({ name, subtitle: subtitle || null, sort_order: Number(sortOrder) || 0 })
      .eq("id", category.id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم الحفظ");
      onChanged();
    }
  };

  const remove = async () => {
    await supabase.from("menu_items").delete().eq("category_id", category.id);
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`تم حذف «${category.name}»`);
      onChanged();
    }
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1">
          <span className="text-xs text-espresso/60">اسم القسم</span>
          <input
            className={`${input} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="min-w-[220px] flex-[2]">
          <span className="text-xs text-espresso/60">عنوان صغير / وصف القسم</span>
          <input
            className={`${input} mt-1`}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
        <div className="w-20">
          <span className="text-xs text-espresso/60">الترتيب</span>
          <input
            className={`${input} mt-1`}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <button className={btn} onClick={save}>
          حفظ
        </button>
        {confirming ? (
          <>
            <button className={btnDanger} onClick={remove}>
              تأكيد الحذف ({itemCount} صنف)
            </button>
            <button className={btnGhost} onClick={() => setConfirming(false)}>
              إلغاء
            </button>
          </>
        ) : (
          <button className={iconDanger} onClick={() => setConfirming(true)} aria-label="حذف القسم">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-espresso/50">{itemCount} صنف داخل هذا القسم</p>
    </div>
  );
}

/* ----------------------------- galleries ----------------------------- */

type GalleryImage = {
  id: string;
  gallery: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

function GallerySection({ gallery }: { gallery: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "gallery", gallery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, gallery, image_url, caption, sort_order")
        .eq("gallery", gallery)
        .order("sort_order");
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "gallery", gallery] });

  const add = async (files: FileList) => {
    setBusy(true);
    try {
      let order = (q.data?.length ?? 0) + 1;
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        const { error } = await supabase.from("gallery_images").insert({
          gallery,
          image_url: url,
          caption: "",
          sort_order: order++,
        });
        if (error) throw error;
      }
      refresh();
      toast.success("تمت إضافة الصور");
    } catch (err) {
      toast.error("فشل الرفع: " + (err as Error).message);
    }
    setBusy(false);
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-espresso/60">{q.data?.length ?? 0} صورة</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const fs = e.target.files;
            if (fs && fs.length) add(fs);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <button className={btn} onClick={() => fileRef.current?.click()}>
          <Plus className="h-4 w-4" />
          {busy ? "جارٍ الرفع..." : "إضافة صور"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((img) => (
          <GalleryCard key={img.id} img={img} onChanged={refresh} />
        ))}
      </div>
      {q.data?.length === 0 && (
        <p className="mt-6 text-center text-sm text-espresso/50">لا توجد صور بعد</p>
      )}
    </section>
  );
}

function GalleryCard({ img, onChanged }: { img: GalleryImage; onChanged: () => void }) {
  const [caption, setCaption] = useState(img.caption ?? "");
  const [sortOrder, setSortOrder] = useState(String(img.sort_order));
  const [imageUrl, setImageUrl] = useState(img.image_url);
  const [confirming, setConfirming] = useState(false);

  const save = async (patch?: Partial<GalleryImage>) => {
    const { error } = await supabase
      .from("gallery_images")
      .update({
        caption: caption || null,
        sort_order: Number(sortOrder) || 0,
        image_url: imageUrl,
        ...patch,
      })
      .eq("id", img.id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم الحفظ");
      onChanged();
    }
  };

  const remove = async () => {
    const { error } = await supabase.from("gallery_images").delete().eq("id", img.id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم حذف الصورة");
      onChanged();
    }
  };

  return (
    <div className={`${card} relative`}>
      <img src={mediaUrl(imageUrl)} alt={caption} className="h-40 w-full rounded-lg object-cover" />
      {confirming ? (
        <div className="absolute left-3 top-3 flex gap-1">
          <button className={`${btnDanger} bg-card`} onClick={remove}>
            تأكيد
          </button>
          <button className={`${btnGhost} bg-card`} onClick={() => setConfirming(false)}>
            إلغاء
          </button>
        </div>
      ) : (
        <button
          className={`${iconDanger} absolute left-3 top-3 bg-card/90`}
          onClick={() => setConfirming(true)}
          aria-label="حذف الصورة"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      <div className="mt-3">
        <span className="text-xs text-espresso/60">العنوان الصغير</span>
        <input
          className={`${input} mt-1`}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="w-20">
          <span className="text-xs text-espresso/60">الترتيب</span>
          <input
            className={`${input} mt-1`}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <button className={btn} onClick={() => save()}>
          حفظ
        </button>
      </div>
      <div className="mt-3">
        <ImagePicker
          value={imageUrl}
          label="استبدال الصورة"
          onChange={(url) => {
            setImageUrl(url);
            save({ image_url: url });
          }}
        />
      </div>
    </div>
  );
}


/* --------------------------- delivery zones -------------------------- */

type Zone = { id: string; name: string; price: number; is_active: boolean; sort_order: number };

function DeliverySection() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const zones = useQuery({
    queryKey: ["admin", "delivery_zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("id, name, price, is_active, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((z) => ({ ...z, price: Number(z.price) })) as Zone[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "delivery_zones"] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("delivery_zones").insert({
        name: name.trim(),
        price: Number(price) || 0,
        sort_order: (zones.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setPrice("");
      refresh();
      toast.success("تم إضافة المنطقة");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section>
      <div className={`${card} flex flex-wrap items-end gap-3`}>
        <div className="min-w-[200px] flex-1">
          <span className="text-xs text-espresso/60">اسم المنطقة</span>
          <input
            className={`${input} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: وسط البلد"
          />
        </div>
        <div className="w-32">
          <span className="text-xs text-espresso/60">سعر التوصيل (₪)</span>
          <input
            className={`${input} mt-1`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="10"
          />
        </div>
        <button className={btn} disabled={!name.trim()} onClick={() => add.mutate()}>
          <Plus className="h-4 w-4" />
          إضافة منطقة
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {zones.data?.length === 0 && (
          <p className="text-sm text-espresso/60">لا توجد مناطق توصيل بعد.</p>
        )}
        {zones.data?.map((z) => (
          <ZoneCard key={z.id} zone={z} onChanged={refresh} />
        ))}
      </div>
    </section>
  );
}

function ZoneCard({ zone, onChanged }: { zone: Zone; onChanged: () => void }) {
  const [name, setName] = useState(zone.name);
  const [price, setPrice] = useState(String(zone.price));
  const [sortOrder, setSortOrder] = useState(String(zone.sort_order));
  const [active, setActive] = useState(zone.is_active);

  const save = async () => {
    const { error } = await supabase
      .from("delivery_zones")
      .update({
        name,
        price: Number(price) || 0,
        sort_order: Number(sortOrder) || 0,
        is_active: active,
      })
      .eq("id", zone.id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم الحفظ");
      onChanged();
    }
  };

  const remove = async () => {
    const { error } = await supabase.from("delivery_zones").delete().eq("id", zone.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`تم حذف «${zone.name}»`);
      onChanged();
    }
  };

  return (
    <div className={`${card} flex flex-wrap items-end gap-3`}>
      <div className="min-w-[160px] flex-1">
        <span className="text-xs text-espresso/60">اسم المنطقة</span>
        <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="w-28">
        <span className="text-xs text-espresso/60">السعر (₪)</span>
        <input
          className={`${input} mt-1`}
          value={price}
          inputMode="decimal"
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="w-20">
        <span className="text-xs text-espresso/60">الترتيب</span>
        <input
          className={`${input} mt-1`}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-espresso/70">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        مفعّلة
      </label>
      <button className={btn} onClick={save}>
        حفظ
      </button>
      <button className={iconDanger} onClick={remove} aria-label="حذف">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
