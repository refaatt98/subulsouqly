/**
 * Admin API edge function — replaces the old Netlify Function so the admin
 * panel works from any host (Lovable preview, Netlify, localhost).
 *
 * Routes (path suffix after /admin-api):
 *   POST /upload        -> admin-only file upload to Cloudflare R2
 *   POST /ensure-admin  -> checks admin status, bootstraps first admin
 *   POST /list-users | /create-user | /set-admin | /set-password | /delete-user
 */
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-file-name",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json; charset=utf-8" },
  });

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireUser(request: Request): Promise<string> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");
  const token = authHeader.slice(7);
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Unauthorized");
  return data.user.id;
}

async function requireAdmin(request: Request) {
  const userId = await requireUser(request);
  const supabase = adminClient();
  const { data } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new HttpError(403, "Forbidden");
  return { userId, supabase };
}

// ---------- File upload (Cloudflare R2, fallback: Supabase Storage) ----------

const sha256hex = async (data: Uint8Array | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

async function hmac(key: ArrayBuffer | Uint8Array | string, data: string): Promise<ArrayBuffer> {
  const raw = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function uploadToR2(key: string, body: Uint8Array, contentType: string): Promise<string> {
  const accountId = env("R2_ACCOUNT_ID");
  const accessKeyId = env("R2_ACCESS_KEY_ID");
  const secretAccessKey = env("R2_SECRET_ACCESS_KEY");
  const bucket = env("R2_BUCKET");
  const publicUrl = env("R2_PUBLIC_URL").replace(/\/$/, "");
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256hex(body);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const canonicalUri = `/${bucket}/${encodedKey}`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256hex(canonicalRequest),
  ].join("\n");

  let signingKey = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  signingKey = await hmac(signingKey, region);
  signingKey = await hmac(signingKey, service);
  signingKey = await hmac(signingKey, "aws4_request");
  const signature = [...new Uint8Array(await hmac(signingKey, stringToSign))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    body,
    headers: {
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "content-type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
    },
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed [${response.status}]: ${await response.text()}`);
  }
  return `${publicUrl}/${encodedKey}`;
}

async function uploadToStorage(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  const supabase = adminClient();
  const { error } = await supabase.storage.from("site-images").upload(key, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new HttpError(400, `Upload failed: ${error.message}`);
  return `${env("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/media/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function uploadFile(key: string, body: Uint8Array, contentType: string): Promise<string> {
  try {
    return await uploadToR2(key, body, contentType);
  } catch (error) {
    console.error("R2 upload failed, falling back to Supabase Storage:", error);
    return await uploadToStorage(key, body, contentType);
  }
}



// ---------- ops ----------

async function handle(op: string, request: Request): Promise<Response> {
  if (op === "upload") {
    await requireAdmin(request);
    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const name = request.headers.get("x-file-name") || "file";
    const ext = (name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength === 0) throw new HttpError(400, "Empty file");
    const key = `uploads/${crypto.randomUUID()}.${ext}`;
    const url = await uploadFile(key, bytes, contentType);
    return json({ url, key });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, never>;

  if (op === "ensure-admin") {
    const userId = await requireUser(request);
    const supabase = adminClient();
    const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (!admins || admins.length === 0) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      return json({ isAdmin: true, bootstrapped: true });
    }
    return json({
      isAdmin: admins.some((a: { user_id: string }) => a.user_id === userId),
      bootstrapped: false,
    });
  }

  const { userId, supabase } = await requireAdmin(request);

  switch (op) {
    case "list-users": {
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
      if (error) throw new HttpError(400, error.message);
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
      const adminIds = new Set((roles ?? []).map((r: { user_id: string }) => r.user_id));
      return json(
        data.users.map((u) => ({
          id: u.id,
          email: u.email ?? "",
          is_admin: adminIds.has(u.id),
          confirmed: Boolean(u.email_confirmed_at),
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        })),
      );
    }

    case "create-user": {
      const { email, password, isAdmin = true } = body as unknown as {
        email: string;
        password: string;
        isAdmin?: boolean;
      };
      if (!email || !password || password.length < 6)
        throw new HttpError(400, "Invalid email or password");
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw new HttpError(400, error.message);
      if (isAdmin && created.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: created.user.id, role: "admin" });
        if (roleError && !roleError.message.includes("duplicate"))
          throw new HttpError(400, roleError.message);
      }
      return json({ id: created.user?.id ?? null });
    }

    case "set-admin": {
      const { userId: target, isAdmin } = body as unknown as { userId: string; isAdmin: boolean };
      if (target === userId && !isAdmin)
        throw new HttpError(400, "لا يمكنك إزالة صلاحية الإدارة عن نفسك");
      const { error } = isAdmin
        ? await supabase
            .from("user_roles")
            .upsert({ user_id: target, role: "admin" }, { onConflict: "user_id,role" })
        : await supabase.from("user_roles").delete().eq("user_id", target).eq("role", "admin");
      if (error) throw new HttpError(400, error.message);
      return json({ ok: true });
    }

    case "set-password": {
      const { userId: target, password } = body as unknown as { userId: string; password: string };
      if (!password || password.length < 6) throw new HttpError(400, "Invalid password");
      const { error } = await supabase.auth.admin.updateUserById(target, {
        password,
        email_confirm: true,
      });
      if (error) throw new HttpError(400, error.message);
      return json({ ok: true });
    }

    case "delete-user": {
      const { userId: target } = body as unknown as { userId: string };
      if (target === userId) throw new HttpError(400, "لا يمكنك حذف حسابك الحالي");
      await supabase.from("user_roles").delete().eq("user_id", target);
      const { error } = await supabase.auth.admin.deleteUser(target);
      if (error) throw new HttpError(400, error.message);
      return json({ ok: true });
    }

    default:
      return json({ error: "Not found" }, 404);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const op = new URL(request.url).pathname.replace(/^.*\/admin-api\/?/, "").replace(/\/$/, "");
    return await handle(op, request);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Server error";
    if (status === 500) console.error(error);
    return json({ error: message }, status);
  }
});
