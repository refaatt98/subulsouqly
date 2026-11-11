import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else navigate("/admin", { replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (error) setMsg(error.message);
      else if (data.session) navigate("/admin", { replace: true });
      else setMsg("تم إنشاء الحساب — تحقّق من بريدك لتأكيد التسجيل.");
    }
    setBusy(false);
  };

  return (
    <main
      dir="rtl"
      lang="ar"
      className="flex min-h-screen items-center justify-center bg-cream px-6"
    >
      <Seo
        title="دخول الإدارة | سُبّل كافي"
        description="تسجيل دخول لوحة إدارة سُبّل كافي."
        noindex
      />
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-sage/40 bg-card p-8"
      >
        <h1 className="font-display text-3xl text-espresso">لوحة الإدارة</h1>
        <p className="mt-2 text-sm text-espresso/60">
          {mode === "in" ? "سجّل الدخول لإدارة المحتوى." : "أنشئ حساب المدير."}
        </p>

        <label className="mt-6 block text-sm text-espresso/70">البريد الإلكتروني</label>
        <input
          type="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded border border-sage/50 bg-cream px-3 py-2 text-espresso outline-none focus:border-sage"
        />

        <label className="mt-4 block text-sm text-espresso/70">كلمة المرور</label>
        <input
          type="password"
          required
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded border border-sage/50 bg-cream px-3 py-2 text-espresso outline-none focus:border-sage"
        />

        {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded bg-sage px-4 py-2 text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "..." : mode === "in" ? "دخول" : "إنشاء حساب"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-sm text-sage underline"
        >
          {mode === "in" ? "ليس لديك حساب؟ إنشاء حساب" : "لدي حساب — تسجيل الدخول"}
        </button>
      </form>
    </main>
  );
}
