import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { readiness } from "@/lib/access";
import { estimate, won } from "@/lib/estimate";
import { SCOPE_META, STATUS_META, STATUS_ORDER } from "@/lib/options";
import { getMe, listInterviews, listMembers } from "@/lib/store";
import type { InterviewStatus } from "@/lib/types";

import { createInterviewAction } from "./actions";

export const metadata: Metadata = { title: "인터뷰" };

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; mine?: string }>;
}) {
  const me = await getMe();
  if (!me) redirect("/login");
  const { status = "", q = "", mine = "" } = await searchParams;
  const [all, members] = await Promise.all([listInterviews(me), listMembers()]);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "알 수 없음";

  const needle = q.trim().toLowerCase();
  const list = all.filter(
    (i) =>
      (!status || i.status === status) &&
      (!mine || i.createdBy === me.id || i.participantIds.includes(me.id)) &&
      (!needle || `${i.title} ${i.clientName} ${i.summary.oneline}`.toLowerCase().includes(needle)),
  );
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, all.filter((i) => i.status === s).length]));
  const href = (p: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(mine && { mine }), ...p });
    for (const [k, v] of [...sp]) if (!v) sp.delete(k);
    const s = sp.toString();
    return s ? `/interviews?${s}` : "/interviews";
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold">고객 인터뷰</h1>
          <p className="text-sm text-sub">미팅에서 들은 내용을 기록하고, 정리해서 고객과 공유하고, 의뢰로 전환합니다.</p>
        </div>
        <form action={createInterviewAction}>
          <button className="btn btn-prism">새 인터뷰 시작</button>
        </form>
      </div>

      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="진행 상태">
          <Link href={href({ status: "" })} className="toggle-chip" aria-pressed={!status}>
            전체 <span className="num text-mute">{all.length}</span>
          </Link>
          {STATUS_ORDER.map((s) => (
            <Link key={s} href={href({ status: s })} className="toggle-chip" aria-pressed={status === s}>
              {STATUS_META[s].label} <span className="num text-mute">{counts[s]}</span>
            </Link>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" action="/interviews">
          {status && <input type="hidden" name="status" value={status} />}
          <input className="field max-w-xs" name="q" id="q" defaultValue={q} placeholder="고객사, 제목, 요약 검색" />
          <label className="toggle-chip" aria-pressed={Boolean(mine)}>
            <input type="checkbox" name="mine" value="1" defaultChecked={Boolean(mine)} className="accent-current" />
            내가 참여한 것만
          </label>
          <button className="btn btn-sm">찾기</button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="tile grid place-items-center gap-2 px-6 py-16 text-center">
          <p className="font-semibold">{all.length ? "조건에 맞는 인터뷰가 없습니다." : "아직 인터뷰가 없습니다."}</p>
          <p className="text-sm text-sub">미팅을 시작할 때 "새 인터뷰 시작"을 누르고 바로 기록하세요.</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((i) => {
            const est = estimate(i.planderItems);
            const r = readiness(i);
            return (
              <li key={i.id}>
                <Link href={`/interviews/${i.id}`} className="card grid h-full gap-3 p-5 transition hover:border-prism/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="truncate text-xs text-sub">{i.clientName || "고객사 미입력"}</span>
                      <span className="font-semibold leading-snug">{i.title}</span>
                    </div>
                    <span className={`chip shrink-0 ${STATUS_META[i.status].tone}`}>{STATUS_META[i.status].label}</span>
                  </div>
                  <p className="line-clamp-2 min-h-[2.8em] text-sm text-sub">{i.summary.oneline || "아직 요약이 없습니다."}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
                    <span className="num">{i.heldAt ? i.heldAt.replace("T", " ") : "일시 미정"}</span>
                    <span>작성 {nameOf(i.createdBy)}</span>
                    <span>{SCOPE_META[i.internalScope].label}</span>
                    {i.shareEnabled && <span className="text-prism">고객 공유 중</span>}
                    <span className="num ml-auto">{est.supply ? won(est.supply) : "견적 없음"}</span>
                    <span className="num">전환 준비 {r.done}/{r.total}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
