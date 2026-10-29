"use client";

import { useEffect, useState, useTransition } from "react";

import { shareAction } from "@/app/(app)/interviews/[id]/actions";
import { SCOPE_META, SHARE_SECTION_LABEL } from "@/lib/options";
import type { InternalScope, Interview, ShareSections } from "@/lib/types";

/** 내부 공유 범위와 고객 공유 링크 */
export function ShareSection({
  interview,
  onChange,
  onShareChange,
  readOnly,
}: {
  interview: Interview;
  onChange: (patch: Partial<Interview>) => void;
  onShareChange: (enabled: boolean, token: string | null) => void;
  readOnly: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  // 서버 렌더와 첫 화면이 같도록 주소는 브라우저에서 붙인 뒤에 만듭니다.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = interview.shareEnabled && interview.shareToken && origin ? `${origin}/s/${interview.shareToken}` : "";

  function toggleShare(enabled: boolean) {
    setMsg("");
    start(async () => {
      const r = await shareAction(interview.id, enabled);
      if (!r.ok) return setMsg(r.error);
      onShareChange(enabled, r.data);
      setMsg(enabled ? "고객 공유 링크를 만들었습니다." : "링크를 껐습니다. 예전 링크는 더 열리지 않습니다.");
    });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setMsg("링크를 복사했습니다.");
    } catch {
      setMsg("자동 복사가 막혀 있습니다. 링크를 직접 선택해 복사해 주세요.");
    }
  }
  const setSection = (k: keyof ShareSections, v: boolean) =>
    onChange({ shareSections: { ...interview.shareSections, [k]: v } });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid content-start gap-3">
        <h3 className="font-semibold">내부 공유 범위</h3>
        <div className="grid gap-2" role="radiogroup" aria-label="내부 공유 범위">
          {(Object.keys(SCOPE_META) as InternalScope[]).map((k) => (
            <label key={k} className={`tile flex cursor-pointer gap-3 p-3 ${interview.internalScope === k ? "border-ink/40" : ""}`}>
              <input
                type="radio"
                name="internalScope"
                id={`scope-${k}`}
                className="mt-1 accent-[hsl(var(--prism))]"
                checked={interview.internalScope === k}
                onChange={() => onChange({ internalScope: k })}
                disabled={readOnly}
              />
              <span className="grid gap-0.5">
                <span className="font-medium">{SCOPE_META[k].label}</span>
                <span className="text-sm text-sub">{SCOPE_META[k].desc}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-mute">내부 메모와 외부 협력 내용은 내부 공유 범위 안에서만 보입니다.</p>
      </div>

      <div className="grid content-start gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">고객 공유 링크</h3>
          <button
            type="button"
            className={`btn btn-sm ${interview.shareEnabled ? "" : "btn-primary"}`}
            onClick={() => toggleShare(!interview.shareEnabled)}
            disabled={readOnly || pending}
          >
            {pending ? "처리 중" : interview.shareEnabled ? "링크 끄기" : "링크 만들기"}
          </button>
        </div>
        <p className="text-sm text-sub">
          로그인 없이 열리는 읽기 전용 페이지입니다. 아래에서 고른 항목만 보입니다. 상대측 연락처, 외부 협력, 내부 메모, 위험 요소는 고르지 않아도 항상 빠집니다.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="고객에게 보여 줄 항목">
          {(Object.keys(SHARE_SECTION_LABEL) as (keyof ShareSections)[]).map((k) => (
            <button
              key={k}
              type="button"
              className="toggle-chip"
              aria-pressed={interview.shareSections[k]}
              onClick={() => setSection(k, !interview.shareSections[k])}
              disabled={readOnly}
            >
              {SHARE_SECTION_LABEL[k]}
            </button>
          ))}
        </div>
        {interview.shareSections.summary && !interview.summary.external.trim() && (
          <p className="text-sm text-warning">요약 정리의 "고객에게 보여 줄 정리"가 비어 있어 미팅 정리 칸이 빈 채로 보입니다.</p>
        )}
        {link && (
          <div className="grid gap-2">
            <input className="field num text-xs" readOnly value={link} aria-label="고객 공유 링크" onFocus={(e) => e.currentTarget.select()} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm" onClick={copy}>링크 복사</button>
              <a className="btn btn-sm" href={link} target="_blank" rel="noreferrer">고객 화면 미리보기</a>
            </div>
            <p className="text-xs text-mute">항목 선택을 바꾸면 저장 후 바로 고객 화면에 반영됩니다.</p>
          </div>
        )}
        {msg && <p className="text-sm text-sub" role="status">{msg}</p>}
      </div>
    </div>
  );
}
