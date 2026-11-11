import { supabase } from "@/integrations/supabase/client";

// Fall back to the project's public values when the VITE_* vars aren't set (e.g. on Netlify).
const SUPABASE_URL =
  (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ||
  "https://ifmefsqkwdbgymsnrcnb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmbWVmc3Frd2RiZ3ltc25yY25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDEyOTcsImV4cCI6MjEwMzkxNzI5N30.XrydFkup3c8cr5KcIP5rGntf3XbTMuQVyZQpqWnXyME";

const FN_URL = `${SUPABASE_URL}/functions/v1/admin-api`;

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
      apikey: SUPABASE_PUBLISHABLE_KEY,
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
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "content-type": file.type || "application/octet-stream",
      "x-file-name": file.name,
    },
    body: file,
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new Error(body.error || `Upload failed (${res.status})`);
  return body.url;
}
