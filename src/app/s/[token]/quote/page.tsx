import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { FitA4 } from "@/components/fit-a4";
import { QuoteDocument } from "@/components/quote-document";
import { SEAL_SRC, hasSeal } from "@/lib/seal";
import { getShared } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "견적서", robots: { index: false, follow: false } };

/** 고객용 견적서. 공유 링크에서 예상 금액을 켜 둔 경우에만 열립니다. */
export default async function SharedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await getShared(token);
  if (!s || !s.quote) notFound();

  return (
    <div className="print-plain min-h-dvh bg-[#F1F2F6] px-3 py-6 print:min-h-0 sm:px-6 sm:py-10" style={{ colorScheme: "light" }}>
      <div className="no-print mx-auto mb-4 flex max-w-[860px] flex-wrap items-center justify-between gap-2 text-[#0B0B0D]">
        <Link href={`/s/${token}`} className="text-sm text-[#5C5F68] underline underline-offset-4">미팅 정리로 돌아가기</Link>
        <PrintButton className="rounded-full border border-[#0B0B0D] bg-[#0B0B0D] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-transparent hover:text-[#0B0B0D]" />
      </div>
      <div className="mx-auto max-w-[860px] rounded-[6px] border border-[#D8DDE6] shadow-[0_20px_50px_-30px_rgba(20,30,60,.35)] print:border-0 print:shadow-none">
        <QuoteDocument quote={s.quote} clientName={s.clientName} items={s.planderItems ?? []} sealSrc={hasSeal() ? SEAL_SRC : undefined} />
        <FitA4 targetId="quote-sheet" />
      </div>
    </div>
  );
}
