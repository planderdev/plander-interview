import type { Metadata } from "next";

import { LoginForm } from "./form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm content-center gap-8 px-5 py-12">
      <div className="grid gap-2">
        <div className="flex items-center gap-3">
          <span className="wordmark text-[26px] text-ink" role="img" aria-label="PLANDER" />
          <span className="h-5 w-px bg-ink/25" aria-hidden />
          <span className="text-[17px] font-semibold tracking-tight">인터뷰</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold">웍스 계정으로 로그인</h1>
        <p className="text-sm text-sub">플랜더웍스와 같은 이메일, 비밀번호를 씁니다.</p>
      </div>
      <div className="card p-6">
        <LoginForm next={next} />
      </div>
    </main>
  );
}
