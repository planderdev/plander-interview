import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { estimate, won } from "@/lib/estimate";
import { getShared } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "미팅 정리", robots: { index: false, follow: false } };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-[#d8dde6] pt-6">
      <h2 className="text-[13px] font-semibold tracking-[0.08em] text-[#5b6577]">{title}</h2>
      {children}
    </section>
  );
}

/** 고객 공유 페이지. 로그인 없이 열리고, 담당자가 고른 항목만 보입니다. 테마와 관계없이 밝은 문서로 보입니다. */
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await getShared(token);
  if (!s) notFound();

  const est = s.planderItems ? estimate(s.planderItems) : null;
  const showPrice = s.sections.estimate;
  const date = s.heldAt ? s.heldAt.slice(0, 10) : "";

  return (
    <div className="min-h-dvh bg-[#eef1f5] px-4 py-8 text-[#151b26] sm:py-14" style={{ colorScheme: "light" }}>
      <article className="mx-auto grid max-w-3xl gap-8 rounded-[6px] border border-[#d8dde6] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(20,30,60,.35)] sm:p-12">
        <header className="grid gap-3">
          <span className="num text-xs tracking-[0.22em] text-[#2a55d4]">PLANDER</span>
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{s.clientName ? `${s.clientName} 미팅 정리` : s.title}</h1>
          <p className="text-sm text-[#5b6577]">
            {date && <span className="num">{date}</span>}
            {date && s.counterpartNames.length > 0 && ", "}
            {s.counterpartNames.length > 0 && `${s.counterpartNames.join(", ")}님과의 미팅`}
          </p>
        </header>

        {s.sections.summary && (
          <Block title="미팅 정리">
            <p className="whitespace-pre-line leading-7">{s.summary?.trim() || "정리 내용을 준비하고 있습니다."}</p>
          </Block>
        )}

        {s.needs && (
          <Block title="원하시는 일">
            <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[8rem_minmax(0,1fr)]">
              {s.needs.goals.length > 0 && (<><dt className="text-[#5b6577]">목표</dt><dd>{s.needs.goals.join(", ")}</dd></>)}
              {s.needs.pains && (<><dt className="text-[#5b6577]">지금 겪는 문제</dt><dd className="whitespace-pre-line">{s.needs.pains}</dd></>)}
              {s.needs.wish && (<><dt className="text-[#5b6577]">바라는 결과</dt><dd className="whitespace-pre-line">{s.needs.wish}</dd></>)}
              {s.needs.timeline && (<><dt className="text-[#5b6577]">시작 시점</dt><dd>{s.needs.timeline}</dd></>)}
            </dl>
          </Block>
        )}

        {s.business && (
          <Block title="고객사 정보">
            <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[8rem_minmax(0,1fr)]">
              {s.business.industry && (<><dt className="text-[#5b6577]">업종</dt><dd>{s.business.industry}</dd></>)}
              {s.business.stage && (<><dt className="text-[#5b6577]">사업 단계</dt><dd>{s.business.stage}</dd></>)}
              {s.business.region && (<><dt className="text-[#5b6577]">지역</dt><dd>{s.business.region}</dd></>)}
              {s.business.channels.length > 0 && (<><dt className="text-[#5b6577]">운영 채널</dt><dd>{s.business.channels.join(", ")}</dd></>)}
              {s.business.description && (<><dt className="text-[#5b6577]">사업 설명</dt><dd className="whitespace-pre-line">{s.business.description}</dd></>)}
            </dl>
          </Block>
        )}

        {est && est.lines.length > 0 && (s.sections.plander || showPrice) && (
          <Block title={showPrice ? "플랜더 제안과 예상 금액" : "플랜더 제안 항목"}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-[#151b26] text-left text-xs text-[#5b6577]">
                    <th className="py-2 pr-3 font-semibold">항목</th>
                    <th className="py-2 pr-3 font-semibold">내용</th>
                    {showPrice && <th className="py-2 text-right font-semibold">금액</th>}
                  </tr>
                </thead>
                <tbody>
                  {est.lines.map((l) => (
                    <tr key={l.item.id} className="border-b border-[#e3e7ee] align-top">
                      <td className="py-3 pr-3 font-medium">
                        {l.name}
                        {l.tierName && <span className="ml-1 text-xs text-[#5b6577]">({l.tierName})</span>}
                      </td>
                      <td className="py-3 pr-3 text-[#5b6577]">
                        {l.desc}
                        {l.item.note && l.item.catalogId !== "custom" && <div className="mt-1 text-[#151b26]">{l.item.note}</div>}
                      </td>
                      {showPrice && (
                        <td className="num whitespace-nowrap py-3 text-right">
                          {l.consult ? "상담 후 확정" : (
                            <>
                              {won(l.amount)}
                              <div className="text-xs text-[#5b6577]">{won(l.price)} x {l.qty.toLocaleString("ko-KR")}{l.unit}</div>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showPrice && (
              <dl className="num ml-auto grid grid-cols-[auto_auto] gap-x-10 gap-y-1 text-sm">
                <dt className="text-[#5b6577]">공급가액</dt><dd className="text-right">{won(est.supply)}</dd>
                <dt className="text-[#5b6577]">부가세 10%</dt><dd className="text-right">{won(est.vat)}</dd>
                <dt className="border-t border-[#151b26] pt-2 font-semibold">합계</dt>
                <dd className="border-t border-[#151b26] pt-2 text-right font-semibold">{won(est.total)}</dd>
              </dl>
            )}
            {showPrice && (
              <p className="text-xs text-[#5b6577]">
                플랜더 단가표 기준 예상 금액입니다. 광고 매체비는 포함하지 않으며, 범위와 금액은 상담 후 확정합니다.
              </p>
            )}
          </Block>
        )}

        {s.nextActions && s.nextActions.filter((a) => a.text.trim()).length > 0 && (
          <Block title="다음 단계">
            <ol className="grid list-decimal gap-2 pl-5 text-[15px]">
              {s.nextActions.filter((a) => a.text.trim()).map((a, i) => (
                <li key={i}>
                  {a.text}
                  {a.due && <span className="num ml-2 text-sm text-[#5b6577]">{a.due}까지</span>}
                </li>
              ))}
            </ol>
          </Block>
        )}

        <footer className="border-t border-[#d8dde6] pt-6 text-xs text-[#5b6577]">
          (주)플랜더가 미팅 내용을 정리해 공유드리는 문서입니다. 마지막 수정 <span className="num">{s.updatedAt.slice(0, 10)}</span>
        </footer>
      </article>
    </div>
  );
}
