import { supabase } from "@/integrations/supabase/client";

const FN_URL = `${import.meta.env['VITE_SUPABASE_URL']}/functions/v1/admin-api`;

export type AdminUser = {
  id: string;
  email: string;
  is_admin: boolean;
  confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

async function call<T>(op: string, payload: unknown = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${FN_URL}/${op}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string,
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

/** Returns whether the caller is an admin (bootstraps the first admin). */
export const ensureAdmin = () => call<{ isAdmin: boolean; bootstrapped: boolean }>("ensure-admin");

export const listAdminUsers = () => call<AdminUser[]>("list-users");

export const createAdminUser = (args: {
  data: { email: string; password: string; isAdmin: boolean };
}) => call<{ id: string | null }>("create-user", args.data);

export const setUserAdmin = (args: { data: { userId: string; isAdmin: boolean } }) =>
  call<{ ok: true }>("set-admin", args.data);

export const setUserPassword = (args: { data: { userId: string; password: string } }) =>
  call<{ ok: true }>("set-password", args.data);

export const deleteAdminUser = (args: { data: { userId: string } }) =>
  call<{ ok: true }>("delete-user", args.data);

/** Uploads a file to Cloudflare R2 through the server and returns its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${FN_URL}/upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string,
      "content-type": file.type || "application/octet-stream",
      "x-file-name": file.name,
    },
    body: file,
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new Error(body.error || `Upload failed (${res.status})`);
  return body.url;
}
