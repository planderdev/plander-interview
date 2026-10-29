"use client";

import { resolveQuote } from "@/lib/quote";
import type { Interview, Quote } from "@/lib/types";

/** 견적서에 들어갈 정보. 비워 두면 흐린 글씨의 기본값이 들어갑니다. */
export function QuoteFields({
  interview,
  ownerName,
  onChange,
  readOnly,
}: {
  interview: Interview;
  ownerName: string;
  onChange: (q: Quote) => void;
  readOnly: boolean;
}) {
  const q = interview.quote;
  const d = resolveQuote({
    id: interview.id,
    title: interview.title,
    clientName: interview.clientName,
    counterparts: interview.counterparts,
    region: interview.business.region,
    quote: { ...q, title: "", no: "", date: "", staffName: "", recipientName: "", recipientPhone: "", recipientEmail: "", recipientAddress: "", note: "" },
    ownerName,
  });
  const set = (k: keyof Quote, v: string) => onChange({ ...q, [k]: v });
  const field = (k: keyof Quote, label: string, opts: { type?: string; wide?: boolean } = {}) => (
    <div className={`grid min-w-0 gap-1.5 ${opts.wide ? "sm:col-span-2" : ""}`}>
      <label className="label" htmlFor={`quote-${k}`}>{label}</label>
      <input
        id={`quote-${k}`}
        className="field"
        type={opts.type ?? "text"}
        value={q[k]}
        placeholder={d[k]}
        onChange={(e) => set(k, e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );

  return (
    <div className="grid gap-4 rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="font-semibold">견적서</span>
          <span className="text-sm text-sub">
            위에서 고른 항목으로 플랜더 견적서 양식이 만들어집니다. 칸을 비워 두면 흐린 글씨로 보이는 값이 들어갑니다.
          </span>
        </div>
        <a className="btn btn-sm btn-primary" href={`/interviews/${interview.id}/quote`} target="_blank" rel="noreferrer">
          견적서 뽑기
        </a>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("title", "견적서 제목", { wide: true })}
        <div className="grid min-w-0 gap-1.5">
          <span className="label">견적번호</span>
          <span className="field num flex items-center text-sub" aria-label="자동으로 매긴 견적번호">
            {q.no || d.no}
          </span>
          <span className="text-xs text-mute">인터뷰를 만든 달과 순서로 자동으로 매깁니다.</span>
        </div>
        {field("date", "견적일자", { type: "date" })}
        {field("staffName", "담당자")}
        {field("staffContact", "담당자 연락처")}
        {field("recipientName", "수신자")}
        {field("recipientPhone", "수신자 연락처")}
        {field("recipientEmail", "수신자 이메일")}
        {field("recipientAddress", "수신자 주소")}
        <div className="grid min-w-0 gap-1.5 sm:col-span-2">
          <label className="label" htmlFor="quote-note">참고사항</label>
          <textarea
            id="quote-note"
            className="field min-h-[72px]"
            value={q.note}
            placeholder={d.note}
            onChange={(e) => set("note", e.target.value)}
            readOnly={readOnly}
          />
        </div>
      </div>
      <p className="text-xs text-mute">
        고객에게 견적서를 보이려면 공유 범위에서 고객 공유 링크를 켜고 예상 금액을 고르세요. 고객 화면에 견적서 보기 버튼이 생깁니다.
      </p>
    </div>
  );
}
