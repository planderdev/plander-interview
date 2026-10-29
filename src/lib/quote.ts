import { DEFAULT_QUOTE_NOTE } from "./options";
import type { Counterpart, Quote } from "./types";

/** 오늘 날짜 (한국 시각) YYYY-MM-DD */
export function kstToday(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

export interface QuoteSource {
  id: string;
  title: string;
  clientName: string;
  counterparts: Counterpart[];
  region: string;
  quote: Quote;
  /** 담당자 기본값 (작성자 이름) */
  ownerName?: string;
}

/** 비어 있는 견적서 칸을 인터뷰 내용으로 채웁니다. 저장된 값이 있으면 그 값을 씁니다. */
export function resolveQuote(src: QuoteSource): Quote {
  const q = src.quote;
  const cp = src.counterparts.find((c) => c.role === "decision" && c.name.trim()) ?? src.counterparts.find((c) => c.name.trim());
  const date = q.date || kstToday();
  return {
    title: q.title || (src.clientName ? `${src.clientName} 견적서` : `${src.title} 견적서`),
    no: q.no || `${date.slice(0, 7).replace("-", "")}-${src.id.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase()}`,
    date,
    staffName: q.staffName || src.ownerName || "",
    staffContact: q.staffContact,
    recipientName: q.recipientName || (cp ? [cp.name, cp.title].filter(Boolean).join(" ") : ""),
    recipientPhone: q.recipientPhone || cp?.phone || "",
    recipientEmail: q.recipientEmail || cp?.email || "",
    recipientAddress: q.recipientAddress || src.region,
    note: q.note || DEFAULT_QUOTE_NOTE,
  };
}

/** 2026-09-01 을 2026년 9월 1일로 */
export function koDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : d;
}

/** 공급자 정보. design.plander.io 의 회사 정보를 그대로 씁니다. */
export const SUPPLIER = {
  name: "주식회사 플랜더",
  bizNo: "432-81-02903",
  ceo: "이동욱",
  email: "contact@plander.io",
  address: "제주특별자치도 제주시 관덕로 44, 제주소통협력센터 404호",
};
