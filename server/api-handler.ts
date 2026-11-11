/**
 * Shared API handler used by both the Netlify Function (production)
 * and the Vite dev middleware (local development).
 *
 * Routes (paths are given WITHOUT the leading "/api"):
 *   GET  /public/media/<storage path>   -> streams a file from the private bucket
 *   POST /admin/<op>                    -> privileged admin operations (bearer token required)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { r2Upload } from "./r2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function adminClient(): SupabaseClient {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(env("SUPABASE_URL"), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Verifies the bearer token and returns the caller's user id. */
async function requireUser(request: Request): Promise<string> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");
  const token = authHeader.slice(7);
  if (token.split(".").length !== 3) throw new HttpError(401, "Unauthorized");

  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Unauthorized");
  return data.user.id;
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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

async function media(path: string): Promise<Response> {
  if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
  const { data, error } = await adminClient().storage.from("site-images").download(path);
  if (error || !data) return new Response("Not found", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": data.type || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

async function admin(op: string, request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (op === "upload") {
    await requireAdmin(request);
    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const name = request.headers.get("x-file-name") || "file";
    const ext = (name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength === 0) throw new HttpError(400, "Empty file");
    const key = `uploads/${crypto.randomUUID()}.${ext}`;
    const url = await r2Upload(key, bytes, contentType);
    return json({ url, key });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, never>;

  if (op === "ensure-admin") {
    const userId = await requireUser(request);
    const supabase = adminClient();
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
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
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");
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
      const {
        email,
        password,
        isAdmin = true,
      } = body as unknown as {
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
      const { userId: target, isAdmin } = body as unknown as {
        userId: string;
        isAdmin: boolean;
      };
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
      const { userId: target, password } = body as unknown as {
        userId: string;
        password: string;
      };
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

/** `path` is the request path with the "/api" prefix already stripped. */
export async function handleApi(path: string, request: Request): Promise<Response> {
  try {
    if (path.startsWith("/public/media/")) {
      return await media(decodeURIComponent(path.slice("/public/media/".length)));
    }
    if (path.startsWith("/admin/")) {
      return await admin(path.slice("/admin/".length), request);
    }
    return json({ error: "Not found" }, 404);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Server error";
    if (status === 500) console.error(error);
    return json({ error: message }, status);
  }
}
