import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Crumbs } from "@/components/crumbs";
import { PdfButton } from "@/components/pdf-button";
import { FitA4 } from "@/components/fit-a4";
import { QuoteDocument } from "@/components/quote-document";
import { resolveQuote } from "@/lib/quote";
import { SEAL_SRC, isPdfUnlocked, pdfPasswordConfigured, sealAvailable } from "@/lib/seal";
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
  const unlocked = await isPdfUnlocked();
  const customerReady = iv.shareEnabled && iv.shareSections.estimate;

  return (
    <div className={`grid gap-4 ${unlocked ? "" : "pdf-locked"}`}>
      <p className="print-lock-note">견적서를 PDF로 뽑으려면 화면의 PDF로 뽑기 버튼을 누르고 비밀번호를 입력해 주세요.</p>
      <div className="no-print flex flex-wrap items-center gap-2">
        <Crumbs items={[{ label: "인터뷰 목록", href: "/interviews" }, { label: iv.title || "제목 없는 인터뷰", href: `/interviews/${iv.id}` }, { label: "견적서" }]} />
        <span className="text-xs text-mute">
          {customerReady
            ? "고객 공유 페이지의 견적서 보기 버튼으로 고객도 같은 견적서를 봅니다."
            : "고객에게 보이려면 공유 범위에서 고객 공유 링크를 켜고 예상 금액을 고르세요."}
        </span>
        <div className="ml-auto flex gap-2">
          {customerReady && iv.shareToken && (
            <a className="btn btn-sm" href={`/s/${iv.shareToken}/quote`} target="_blank" rel="noreferrer">고객 화면으로 보기</a>
          )}
          <PdfButton unlocked={unlocked} configured={pdfPasswordConfigured()} className="btn btn-sm btn-primary" />
        </div>
      </div>
      <div className="print-plain rounded-[6px] bg-[#F1F2F6] p-2 sm:p-6">
        <div className="mx-auto max-w-[860px] rounded-[6px] border border-[#D8DDE6] print:border-0">
          <QuoteDocument quote={quote} clientName={iv.clientName} items={iv.planderItems} sealSrc={sealAvailable() ? SEAL_SRC : undefined} />
          <FitA4 targetId="quote-sheet" />
        </div>
      </div>
    </div>
  );
}
