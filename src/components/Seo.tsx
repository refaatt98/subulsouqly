import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
};

function setMeta(attr: "name" | "property", key: string, content: string | undefined) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Lightweight client-side head manager (replaces TanStack head()). */
export function Seo({ title, description, ogTitle, ogDescription, ogImage, noindex }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", ogTitle ?? title);
    setMeta("property", "og:description", ogDescription ?? description);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    if (ogImage) {
      setMeta("property", "og:image", ogImage);
      setMeta("name", "twitter:image", ogImage);
    }
    setMeta("name", "robots", noindex ? "noindex" : "index, follow");
  }, [title, description, ogTitle, ogDescription, ogImage, noindex]);

  return null;
}

export default Seo;
