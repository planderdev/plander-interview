import type { Metadata } from "next";

import { LoginForm } from "./form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm content-center gap-8 px-5 py-12">
      <div className="grid gap-2">
        <span className="num text-xs tracking-[0.2em] text-prism">PLANDER INTERVIEW</span>
        <h1 className="text-2xl font-bold">플랜더 인터뷰</h1>
        <p className="text-sm text-sub">웍스 계정으로 로그인합니다. 비밀번호도 웍스와 같습니다.</p>
      </div>
      <div className="card p-6">
        <LoginForm next={next} />
      </div>
    </main>
  );
}
