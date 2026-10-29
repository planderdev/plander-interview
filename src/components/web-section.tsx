"use client";

import { useState } from "react";

import { WEB_KIND_LABEL, WEB_KINDS, answered, webGroups } from "@/lib/web-interview";
import type { WebAnswer, WebKind, WebSpec } from "@/lib/types";

import { Chips } from "./ui";

const EMPTY: WebAnswer = { picks: [], note: "" };

/** 웹 서비스 제작 의뢰일 때 유형별로 물어볼 질문과 답 */
export function WebSection({
  value,
  onChange,
  readOnly,
}: {
  value: WebSpec;
  onChange: (web: WebSpec) => void;
  readOnly: boolean;
}) {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const labels = WEB_KINDS.map((k) => WEB_KIND_LABEL[k]);
  const kindOf = (label: string) => WEB_KINDS.find((k) => WEB_KIND_LABEL[k] === label) as WebKind;

  const setAnswer = (id: string, patch: Partial<WebAnswer>) =>
    onChange({ ...value, answers: { ...value.answers, [id]: { ...EMPTY, ...value.answers[id], ...patch } } });

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="label">만들 사이트 유형</span>
        <Chips
          label="만들 사이트 유형"
          multi
          options={labels}
          value={value.kinds.map((k) => WEB_KIND_LABEL[k])}
          onChange={(v) => onChange({ ...value, kinds: (v as string[]).map(kindOf) })}
          disabled={readOnly}
        />
        <p className="text-xs text-mute">
          웹 서비스 제작 의뢰일 때만 고릅니다. 여러 유형이 섞이면 모두 고릅니다. 이 기록은 고객 공유에 나가지 않습니다.
        </p>
      </div>

      {value.kinds.length > 0 && (
        <>
          <div className="flex justify-end">
            <button type="button" className="toggle-chip" aria-pressed={onlyOpen} onClick={() => setOnlyOpen(!onlyOpen)}>
              답하지 않은 질문만 보기
            </button>
          </div>
          {webGroups(value.kinds).map((g) => {
            const done = g.questions.filter((q) => answered(value.answers[q.id])).length;
            const list = onlyOpen ? g.questions.filter((q) => !answered(value.answers[q.id])) : g.questions;
            return (
              <div key={g.id} className="tile grid gap-4 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="grid gap-0.5">
                    <h3 className="font-semibold">{g.label}</h3>
                    <p className="text-sm text-sub">{g.desc}</p>
                  </div>
                  <span className="num text-sm text-sub">{done}/{g.questions.length}</span>
                </div>
                {list.length === 0 && <p className="text-sm text-mute">모두 확인했습니다.</p>}
                <ol className="grid gap-4">
                  {list.map((q) => {
                    const a = value.answers[q.id] ?? EMPTY;
                    const ok = answered(a);
                    return (
                      <li key={q.id} className="grid gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0">
                        <div className="flex flex-wrap items-start gap-2">
                          <span aria-hidden className={`mt-0.5 text-xs ${ok ? "text-success" : "text-mute"}`}>{ok ? "●" : "○"}</span>
                          <span className="min-w-0 flex-1 font-medium">{q.q}</span>
                          {q.cost && <span className="rounded-full border border-line px-2 py-0.5 text-xs text-sub">견적 영향</span>}
                        </div>
                        {q.hint && <p className="text-xs text-mute">{q.hint}</p>}
                        {q.options && (
                          <Chips label={q.q} multi options={q.options} value={a.picks} onChange={(v) => setAnswer(q.id, { picks: v as string[] })} disabled={readOnly} />
                        )}
                        <input
                          className="field"
                          aria-label={`${q.q} 메모`}
                          placeholder={q.options ? "덧붙일 내용" : "고객의 답"}
                          value={a.note}
                          onChange={(e) => setAnswer(q.id, { note: e.target.value })}
                          readOnly={readOnly}
                        />
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
