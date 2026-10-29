import { estimate } from "@/lib/estimate";
import { SUPPLIER, koDate } from "@/lib/quote";
import type { PlanderItem, Quote } from "@/lib/types";

const krw = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/**
 * 플랜더 견적서 양식. 기존 PDF 견적서와 같은 구성(Estimate 표시, 워드마크, 제목, 공급자와 수신자, 견적항목, 참고사항, 합계)입니다.
 * 종이 위에 잉크로만 그리고, 강조는 검정 면으로 합니다. A4 한 장에 맞춰 인쇄됩니다.
 */
export function QuoteDocument({
  quote,
  clientName,
  items,
  sealSrc,
}: {
  quote: Quote;
  clientName: string;
  items: PlanderItem[];
  /** 직인 이미지 주소. 없으면 직인을 그리지 않습니다. */
  sealSrc?: string;
}) {
  const est = estimate(items);

  return (
    <article id="quote-sheet" className="quote-sheet mx-auto grid w-full max-w-[860px] gap-7 bg-white p-6 text-[#0B0B0D] sm:p-12">
      <header className="flex items-start justify-between gap-4">
        <span className="rounded-md bg-[#EEF0F3] px-3 py-1.5 text-[13px] font-semibold tracking-wide text-[#9AA0AA]">Estimate</span>
        <span className="wordmark text-[24px] text-[#0B0B0D]" role="img" aria-label="PLANDER" />
      </header>

      <div className="grid gap-3">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] sm:text-[32px]">{quote.title}</h1>
        <p className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
          <span><b className="mr-2">견적일자</b>{koDate(quote.date)}</span>
          <span><b className="mr-2">No.</b>{quote.no}</span>
          {(quote.staffName || quote.staffContact) && (
            <span>
              <b className="mr-2">담당자</b>
              {quote.staffName}
              {quote.staffContact && ` (${quote.staffContact})`}
            </span>
          )}
        </p>
      </div>

      <section className="grid gap-6 border-y border-[#E3E6EB] py-6 sm:grid-cols-2 sm:gap-0">
        <div className="grid content-start gap-2 sm:border-r sm:border-[#E3E6EB] sm:pr-6">
          <span className="text-[12px] text-[#5C5F68]">공급자</span>
          <span className="text-[17px] font-semibold">{SUPPLIER.name}</span>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-[#5C5F68]">사업자</dt><dd>{SUPPLIER.bizNo}</dd>
            <dt className="text-[#5C5F68]">대표자</dt>
            <dd className="flex items-center gap-1.5">
              {SUPPLIER.ceo}
              {sealSrc && (
                // 대표자 이름 바로 옆에 직인을 찍습니다. 위아래 줄을 가리지 않게 이 줄의 높이 안에 둡니다.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sealSrc}
                  alt="주식회사 플랜더 직인"
                  className="pointer-events-none -my-1.5 h-[40px] w-[40px] opacity-90 mix-blend-multiply"
                />
              )}
            </dd>
            <dt className="text-[#5C5F68]">이메일</dt><dd>{SUPPLIER.email}</dd>
            <dt className="text-[#5C5F68]">주소</dt><dd>{SUPPLIER.address}</dd>
          </dl>
        </div>
        <div className="grid content-start gap-2 sm:pl-6">
          <span className="text-[12px] text-[#5C5F68]">수신자</span>
          <span className="text-[17px] font-semibold">{clientName || "고객사"}</span>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-[#5C5F68]">연락처</dt><dd>{quote.recipientPhone || "-"}</dd>
            <dt className="text-[#5C5F68]">수신자</dt><dd>{quote.recipientName || "-"}</dd>
            <dt className="text-[#5C5F68]">이메일</dt><dd>{quote.recipientEmail || "-"}</dd>
            <dt className="text-[#5C5F68]">주소</dt><dd>{quote.recipientAddress || "-"}</dd>
          </dl>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="inline-block h-3.5 w-1.5 rounded-full bg-[#0B0B0D]" aria-hidden />
          견적항목
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#0B0B0D] text-left text-white">
                <th className="px-3 py-2.5 font-medium">항목</th>
                <th className="px-3 py-2.5 font-medium">설명</th>
                <th className="px-3 py-2.5 text-right font-medium">단가</th>
                <th className="px-3 py-2.5 text-right font-medium">수량</th>
                <th className="px-3 py-2.5 text-center font-medium">단위</th>
                <th className="px-3 py-2.5 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              {est.lines.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-[#5C5F68]">견적 항목이 아직 없습니다.</td></tr>
              )}
              {est.lines.map((l) => (
                <tr key={l.item.id} className="border-b border-[#E3E6EB] align-top">
                  <td className="px-3 py-3 font-semibold">
                    {l.name}
                    {l.tierName && <span className="ml-1 font-normal text-[#5C5F68]">({l.tierName})</span>}
                  </td>
                  <td className="px-3 py-3 text-[#3C3F47]">
                    {l.desc}
                    {l.item.note && l.item.catalogId !== "custom" && <div className="mt-0.5 text-[#5C5F68]">{l.item.note}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{l.consult ? "협의" : krw(l.price)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{l.qty.toLocaleString("ko-KR")}</td>
                  <td className="px-3 py-3 text-center">{l.unit}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">{l.consult ? "협의" : krw(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 border-t border-[#E3E6EB] pt-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid content-start gap-2">
          <h2 className="text-[15px] font-semibold">참고사항</h2>
          <p className="whitespace-pre-line text-[12.5px] leading-[1.7] text-[#5C5F68]">※ {quote.note}</p>
          {est.lines.some((l) => l.consult) && (
            <p className="text-[12.5px] leading-[1.7] text-[#5C5F68]">※ 금액이 협의로 표시된 항목은 상담 후 금액을 정해 다시 안내드립니다.</p>
          )}
        </div>
        <dl className="grid grid-cols-[1fr_auto] text-[13px]">
          <dt className="bg-[#F6F7F9] px-3 py-2.5 font-semibold">총 합계</dt>
          <dd className="px-3 py-2.5 text-right font-semibold tabular-nums">{krw(est.supply)}</dd>
          <dt className="border-t border-[#E3E6EB] bg-[#F6F7F9] px-3 py-2.5 font-semibold">공급가액</dt>
          <dd className="border-t border-[#E3E6EB] px-3 py-2.5 text-right font-semibold tabular-nums">{krw(est.supply)}</dd>
          <dt className="border-t border-[#E3E6EB] bg-[#F6F7F9] px-3 py-2.5 font-semibold">VAT (10%)</dt>
          <dd className="border-t border-[#E3E6EB] px-3 py-2.5 text-right font-semibold tabular-nums">{krw(est.vat)}</dd>
          <dt className="bg-[#0B0B0D] px-3 py-3.5 font-semibold text-white">최종 견적</dt>
          <dd className="bg-[#0B0B0D] px-3 py-3 text-right text-[22px] font-bold tabular-nums text-white">{krw(est.total)}</dd>
        </dl>
      </section>
    </article>
  );
}
