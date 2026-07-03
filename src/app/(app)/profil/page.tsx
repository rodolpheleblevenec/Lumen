import { createClient } from "@/lib/supabase/server";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string;

  const [{ data: profile }, { data: streak }, { count: acquired }] =
    await Promise.all([
      supabase
        .from("lumen_profiles")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .single(),
      supabase
        .from("lumen_streaks")
        .select("current, best")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("lumen_srs_cards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("level", 5),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-14 w-14 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-xl dark:bg-orange-950">
            {profile?.display_name?.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-lg font-semibold">{profile?.display_name}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {String(data?.claims?.email ?? "")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-2xl font-bold">🔥 {streak?.current ?? 0}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Streak actuel
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-2xl font-bold">🏅 {streak?.best ?? 0}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">Record</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <p className="text-2xl font-bold">🧠 {acquired ?? 0}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Notions acquises
          </p>
        </div>
      </div>

      <form action="/auth/signout" method="post" className="pt-4">
        <button
          type="submit"
          className="min-h-12 w-full rounded-full border border-stone-300 px-6 py-3 font-medium transition active:scale-95 dark:border-stone-600"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
