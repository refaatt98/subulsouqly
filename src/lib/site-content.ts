import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a stored image URL to one served by this deployment (Netlify).
 * Legacy Lovable CDN paths (/__l5e/assets-v1/<id>/<file>) are mapped to /media/<file>.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/__l5e/")) return `/media/${url.split("/").pop()}`;
  return url;
}


export type SiteContent = {
  categories: Array<{
    id: string;
    name: string;
    subtitle: string | null;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
    }>;
  }>;
  gallery: Array<{ id: string; image_url: string; caption: string | null }>;
  space: Array<{ id: string; image_url: string; caption: string | null }>;
};

/** Public site content, read directly from Supabase with the anon key (RLS applies). */
export async function getSiteContent(): Promise<SiteContent> {
  const [cats, items, images] = await Promise.all([
    supabase.from("categories").select("id, name, subtitle, sort_order").order("sort_order", {
      ascending: true,
    }),
    supabase
      .from("menu_items")
      .select("id, name, description, price, image_url, sort_order, category_id, is_visible")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gallery_images")
      .select("id, gallery, image_url, caption, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const categories = (cats.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    subtitle: c.subtitle,
    items: (items.data ?? [])
      .filter((i) => i.category_id === c.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        image_url: i.image_url,
      })),
  }));

  const pick = (gallery: string) =>
    (images.data ?? [])
      .filter((g) => g.gallery === gallery)
      .map((g) => ({ id: g.id, image_url: g.image_url, caption: g.caption }));

  return { categories, gallery: pick("main"), space: pick("space") };
}
