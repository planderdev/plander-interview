import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { QuoteDocument } from "@/components/quote-document";
import { resolveQuote } from "@/lib/quote";
import { getInterview, getMe, listMembers } from "@/lib/store";

export const metadata: Metadata = { title: "견적서", robots: { index: false, follow: false } };

/** 내부 견적서 미리보기. 고객에게 보내기 전에 확인하고 인쇄합니다. */
export default async function QuotePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  const iv = await getInterview(me, id);
  if (!iv) notFound();
  const members = await listMembers();
  const quote = resolveQuote({
    id: iv.id,
    title: iv.title,
    clientName: iv.clientName,
    counterparts: iv.counterparts,
    region: iv.business.region,
    quote: iv.quote,
    ownerName: members.find((m) => m.id === iv.createdBy)?.name,
  });
  const customerReady = iv.shareEnabled && iv.shareSections.estimate;

  return (
    <div className="grid gap-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Link href={`/interviews/${iv.id}#plander`} className="text-link text-sm text-sub">인터뷰로 돌아가기</Link>
        <span className="text-xs text-mute">
          {customerReady
            ? "고객 공유 페이지의 견적서 보기 버튼으로 고객도 같은 견적서를 봅니다."
            : "고객에게 보이려면 공유 범위에서 고객 공유 링크를 켜고 예상 금액을 고르세요."}
        </span>
        <div className="ml-auto flex gap-2">
          {customerReady && iv.shareToken && (
            <a className="btn btn-sm" href={`/s/${iv.shareToken}/quote`} target="_blank" rel="noreferrer">고객 화면으로 보기</a>
          )}
          <PrintButton className="btn btn-sm btn-primary" />
        </div>
      </div>
      <div className="print-plain rounded-[6px] bg-[#F1F2F6] p-2 sm:p-6">
        <div className="mx-auto max-w-[860px] rounded-[6px] border border-[#D8DDE6] print:border-0">
          <QuoteDocument quote={quote} clientName={iv.clientName} items={iv.planderItems} />
        </div>
      </div>
    </div>
  );
}
