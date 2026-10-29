import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/login/actions";
import { MockUserSwitch } from "@/components/mock-user-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABEL } from "@/lib/options";
import { getMe, listMembers } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");
  const mock = !isSupabaseConfigured();
  const members = mock ? await listMembers() : [];
  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-50 border-b border-line bg-canvas/70 backdrop-blur-[24px]">
        <div className="mx-auto flex min-h-[64px] max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          {/* 로고 락업: PLANDER 워드마크 + 세로선 + 제품명 */}
          <Link href="/interviews" className="flex items-center gap-3" aria-label="PLANDER 인터뷰 홈">
            <span className="wordmark text-[22px] text-ink" role="img" aria-label="PLANDER" />
            <span className="h-4 w-px bg-ink/25" aria-hidden />
            <span className="text-[15px] font-semibold tracking-tight">인터뷰</span>
          </Link>
          {mock && <span className="chip"><span className="dot text-warning" aria-hidden />목업 모드</span>}
          <div className="ml-auto flex items-center gap-2 text-sm">
            {mock ? (
              <MockUserSwitch key={me.id} me={me} members={members} />
            ) : (
              <span className="hidden text-sub sm:inline">
                {me.name} <span className="text-mute">{ROLE_LABEL[me.role]}</span>
              </span>
            )}
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
