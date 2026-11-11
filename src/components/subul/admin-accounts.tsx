import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  setUserAdmin,
  setUserPassword,
  type AdminUser,
} from "@/lib/admin-api";

const card = "rounded-lg border border-sage/40 bg-card p-5";
const input =
  "w-full rounded border border-sage/50 bg-cream px-3 py-2 text-sm text-espresso outline-none focus:border-sage";
const btn =
  "rounded bg-sage px-3 py-2 text-sm text-cream transition-opacity hover:opacity-90 disabled:opacity-50";
const btnGhost =
  "rounded border border-sage/50 px-3 py-2 text-sm text-espresso transition-colors hover:bg-sage/10";

function fmt(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}

export function AdminAccounts({ currentUserId }: { currentUserId: string | null }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(true);

  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listAdminUsers(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const create = useMutation({
    mutationFn: () =>
      createAdminUser({ data: { email: email.trim(), password, isAdmin: makeAdmin } }),
    onSuccess: () => {
      toast.success("تم إنشاء الحساب وتأكيده — يمكنه الدخول مباشرة");
      setEmail("");
      setPassword("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const admins = (users.data ?? []).filter((u) => u.is_admin).length;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-espresso">حسابات الإدارة</h2>
          <p className="mt-1 text-sm text-espresso/60">
            أنشئ حسابات جديدة، امنح أو اسحب صلاحية الإدارة، وأعد تعيين كلمات المرور. الحسابات
            المُنشأة من هنا مؤكدة تلقائياً — بدون رسالة تحقق.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-espresso/60">
          <span className="rounded-full border border-sage/40 px-3 py-1">
            الحسابات: {users.data?.length ?? 0}
          </span>
          <span className="rounded-full border border-sage/40 px-3 py-1">المدراء: {admins}</span>
        </div>
      </div>

      <div className={`${card} mt-4`}>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <div>
            <span className="text-xs text-espresso/60">البريد الإلكتروني</span>
            <input
              className={`${input} mt-1`}
              dir="ltr"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <span className="text-xs text-espresso/60">كلمة المرور</span>
            <input
              className={`${input} mt-1`}
              dir="ltr"
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="٦ أحرف على الأقل"
            />
          </div>
          <button
            className={btn}
            disabled={!email.trim() || password.length < 6 || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "جارٍ الإنشاء..." : "إنشاء حساب"}
          </button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-espresso/70">
          <input
            type="checkbox"
            checked={makeAdmin}
            onChange={(e) => setMakeAdmin(e.target.checked)}
          />
          منح صلاحية الإدارة الكاملة
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {users.isLoading && <p className="text-sm text-espresso/60">جارٍ تحميل الحسابات...</p>}
        {users.isError && (
          <p className="text-sm text-destructive">
            تعذّر تحميل الحسابات: {(users.error as Error).message}
          </p>
        )}
        {users.data?.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} onChanged={refresh} />
        ))}
      </div>
    </section>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
}: {
  user: AdminUser;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [showReset, setShowReset] = useState(false);

  const toggleAdmin = useMutation({
    mutationFn: () => setUserAdmin({ data: { userId: user.id, isAdmin: !user.is_admin } }),
    onSuccess: () => {
      toast.success(user.is_admin ? "تم سحب صلاحية الإدارة" : "تم منح صلاحية الإدارة");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPassword = useMutation({
    mutationFn: () => setUserPassword({ data: { userId: user.id, password: newPassword } }),
    onSuccess: () => {
      toast.success("تم تحديث كلمة المرور");
      setNewPassword("");
      setShowReset(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteAdminUser({ data: { userId: user.id } }),
    onSuccess: () => {
      toast.success("تم حذف الحساب");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/20 font-num text-sm text-sage">
          {user.email.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-[200px] flex-1">
          <p className="font-num text-sm text-espresso" dir="ltr">
            {user.email}
          </p>
          <p className="mt-1 text-xs text-espresso/50">
            أُنشئ {fmt(user.created_at)} · آخر دخول {fmt(user.last_sign_in_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {user.is_admin && <span className="rounded-full bg-sage px-3 py-1 text-cream">مدير</span>}
          <span
            className={`rounded-full border px-3 py-1 ${
              user.confirmed
                ? "border-sage/40 text-espresso/60"
                : "border-destructive/50 text-destructive"
            }`}
          >
            {user.confirmed ? "مؤكد" : "غير مؤكد"}
          </span>
          {isSelf && (
            <span className="rounded-full border border-sage/40 px-3 py-1 text-espresso/60">
              أنت
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={btnGhost}
            disabled={toggleAdmin.isPending || isSelf}
            onClick={() => toggleAdmin.mutate()}
          >
            {user.is_admin ? "سحب الإدارة" : "ترقية لمدير"}
          </button>
          <button className={btnGhost} onClick={() => setShowReset((s) => !s)}>
            كلمة مرور جديدة
          </button>
          <button
            className={btnGhost}
            disabled={isSelf || remove.isPending}
            onClick={() => {
              if (confirm(`حذف الحساب ${user.email}؟`)) remove.mutate();
            }}
          >
            حذف
          </button>
        </div>
      </div>

      {showReset && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-sage/30 pt-4">
          <div className="min-w-[220px] flex-1">
            <span className="text-xs text-espresso/60">كلمة المرور الجديدة</span>
            <input
              className={`${input} mt-1`}
              dir="ltr"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button
            className={btn}
            disabled={newPassword.length < 6 || resetPassword.isPending}
            onClick={() => resetPassword.mutate()}
          >
            حفظ كلمة المرور
          </button>
        </div>
      )}
    </div>
  );
}
