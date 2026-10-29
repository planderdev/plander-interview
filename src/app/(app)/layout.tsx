import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABEL } from "@/lib/options";
import { getMe } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");
  const mock = !isSupabaseConfigured();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/interviews" className="flex items-center gap-2 font-bold">
            <img src="/icon.svg" alt="" width={26} height={26} />
            <span>플랜더 인터뷰</span>
          </Link>
          {mock && <span className="chip border-warning/40 text-warning">목업 모드</span>}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-sub sm:inline">
              {me.name} <span className="text-mute">{ROLE_LABEL[me.role]}</span>
            </span>
            <ThemeToggle />
            {!mock && (
              <form action={logoutAction}>
                <button className="btn btn-sm">로그아웃</button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
