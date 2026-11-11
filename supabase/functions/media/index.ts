/**
 * Public media streamer — serves files from the private "site-images" bucket.
 * Usage: GET /functions/v1/media/<storage path>
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "authorization, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const path = decodeURIComponent(url.pathname.replace(/^\/functions\/v1\/media\/?/, ""));
  if (!path || path.includes("..")) return new Response("Not found", { status: 404, headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.storage.from("site-images").download(path);
  if (error || !data) return new Response("Not found", { status: 404, headers: cors });

  return new Response(await data.arrayBuffer(), {
    headers: {
      ...cors,
      "content-type": data.type || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
});
