import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/** Client-side replacement for the old `_authenticated` route guard. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setState(error || !data.user ? "out" : "in");
    });
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-cream text-espresso/60"
      >
        جارٍ التحقق...
      </main>
    );
  }

  if (state === "out") return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
