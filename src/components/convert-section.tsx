"use client";

import { useMemo, useState, useTransition } from "react";

import { convertAction } from "@/app/(app)/interviews/[id]/actions";
import { readiness } from "@/lib/access";
import { estimate, guessCategory, won } from "@/lib/estimate";
import { CHECK_LABEL, PROJECT_CATEGORIES } from "@/lib/options";
import type { ClientOption, ConversionCheck, Interview } from "@/lib/types";

/** 의뢰 전환: 준비 정도를 보여 주고, 웍스에 클라이언트와 프로젝트를 만듭니다. */
export function ConvertSection({
  interview,
  clients,
  worksUrl,
  readOnly,
  onChange,
  flush,
  onConverted,
}: {
  interview: Interview;
  clients: ClientOption[];
  worksUrl: string;
  readOnly: boolean;
  onChange: (patch: Partial<Interview>) => void;
  flush: () => Promise<boolean>;
  onConverted: (clientId: string, projectId: string, updatedAt: string) => void;
}) {
  const r = readiness(interview);
  const est = estimate(interview.planderItems);
  const guess = guessCategory(interview.planderItems);
  const sameName = useMemo(
    () => clients.find((c) => c.name.replace(/\s/g, "") === interview.clientName.replace(/\s/g, "")),
    [clients, interview.clientName],
  );

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [clientMode, setClientMode] = useState<"auto" | "new" | "existing">("auto");
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const finalTitle = title || `${interview.clientName || "고객사"} ${category || guess || "프로젝트"}`.trim();
  const finalCategory = category || guess;
  const finalBudget = budget === "" ? est.supply || null : Number(budget) || null;
  // 미팅 정보에서 웍스 고객을 불러왔으면 그 고객에 붙입니다.
  const linked = interview.clientId ? clients.find((c) => c.id === interview.clientId) ?? null : null;
  const targetClient = linked
    ? linked.id
    : clientMode === "existing"
      ? clientId
      : clientMode === "auto"
        ? sameName?.id ?? ""
        : "";

  if (interview.projectId) {
    return (
      <div className="tile grid gap-3 p-5">
        <p className="font-semibold text-success">의뢰로 전환했습니다.</p>
        <p className="text-sm text-sub">
          웍스에 클라이언트(상담중)와 프로젝트(대기)가 만들어졌습니다. 이후 진행은 웍스 프로젝트에서 관리합니다.
          {interview.convertedAt && ` 전환일 ${interview.convertedAt.slice(0, 10)}.`}
        </p>
        {worksUrl && (
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-sm" href={`${worksUrl}/projects/${interview.projectId}`} target="_blank" rel="noreferrer">웍스 프로젝트 열기</a>
            {interview.clientId && (
              <a className="btn btn-sm" href={`${worksUrl}/clients/${interview.clientId}`} target="_blank" rel="noreferrer">웍스 클라이언트 열기</a>
            )}
          </div>
        )}
      </div>
    );
  }

  const setCheck = (k: keyof ConversionCheck, v: boolean) => onChange({ check: { ...interview.check, [k]: v } });

  function convert() {
    setError("");
    if (!linked && clientMode === "existing" && !clientId) return setError("연결할 웍스 클라이언트를 골라 주세요.");
    start(async () => {
      if (!(await flush())) return setError("저장에 실패해 전환하지 못했습니다. 잠시 뒤 다시 눌러 주세요.");
      const res = await convertAction({
        id: interview.id,
        title: finalTitle,
        category: finalCategory,
        budget: finalBudget,
        clientId: targetClient || null,
      });
      if (!res.ok) return setError(res.error);
      onConverted(res.data.clientId, res.data.projectId, res.data.updatedAt);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="grid content-start gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">전환 준비</h3>
          <span className="num text-sm text-sub">{r.done}/{r.total}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <div className="h-full bg-prism" style={{ width: `${(r.done / r.total) * 100}%` }} />
        </div>
        <ul className="grid gap-1.5 text-sm">
          {r.items.slice(0, 6).map((x) => (
            <li key={x.label} className={`flex items-center gap-2 ${x.ok ? "" : "text-mute"}`}>
              <span aria-hidden className={x.ok ? "text-success" : ""}>{x.ok ? "●" : "○"}</span>
              {x.label}
              <span className="sr-only">{x.ok ? "완료" : "미완료"}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-1.5 border-t border-line pt-3 text-sm">
          <span className="label">미팅에서 확인한 것</span>
          {(Object.keys(CHECK_LABEL) as (keyof ConversionCheck)[]).map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                id={`check-${k}`}
                className="h-4 w-4 accent-[hsl(var(--prism))]"
                checked={interview.check[k]}
                onChange={(e) => setCheck(k, e.target.checked)}
                disabled={readOnly}
              />
              {CHECK_LABEL[k]}
            </label>
          ))}
        </div>
      </div>

      <div className="tile grid content-start gap-4 p-4">
        <h3 className="font-semibold">웍스로 의뢰 전환</h3>
        <p className="text-sm text-sub">
          웍스에 클라이언트(관계 단계 상담중)와 프로젝트(상태 대기)를 만들고 이 인터뷰를 연결합니다. 고객의 고민과 플랜더 항목이 프로젝트 설명에 들어갑니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <label className="label" htmlFor="cv-title">프로젝트 제목</label>
            <input id="cv-title" className="field" value={title} placeholder={finalTitle} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} />
          </div>
          <div className="grid gap-1.5">
            <label className="label" htmlFor="cv-cat">카테고리</label>
            <select id="cv-cat" className="field" value={finalCategory} onChange={(e) => setCategory(e.target.value)} disabled={readOnly}>
              <option value="">미분류</option>
              {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="label" htmlFor="cv-budget">예산 (공급가, 원)</label>
            <input
              id="cv-budget"
              className="field num"
              type="number"
              min={0}
              step={10000}
              value={budget}
              placeholder={est.supply ? String(est.supply) : "미정"}
              onChange={(e) => setBudget(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <span className="label">웍스 클라이언트</span>
            {linked ? (
              <p className="text-sm">
                미팅 정보에서 불러온 <span className="font-semibold">{linked.name}</span>에 프로젝트를 추가합니다. 새 클라이언트는 만들지 않습니다.
              </p>
            ) : (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="웍스 클라이언트">
              <button type="button" className="toggle-chip" aria-pressed={clientMode === "auto"} onClick={() => setClientMode("auto")} disabled={readOnly}>
                {sameName ? `기존 "${sameName.name}"에 연결` : "새 클라이언트 만들기"}
              </button>
              {sameName && (
                <button type="button" className="toggle-chip" aria-pressed={clientMode === "new"} onClick={() => setClientMode("new")} disabled={readOnly}>
                  새로 만들기
                </button>
              )}
              <button type="button" className="toggle-chip" aria-pressed={clientMode === "existing"} onClick={() => setClientMode("existing")} disabled={readOnly}>
                다른 클라이언트 고르기
              </button>
            </div>
            )}
            {!linked && clientMode === "existing" && (
              <select className="field" aria-label="연결할 클라이언트" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">클라이언트 선택</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <span className="num text-sm text-sub">예상 공급가 {won(est.supply)}</span>
          <button type="button" className="btn btn-primary ml-auto" onClick={convert} disabled={readOnly || pending || !interview.clientName.trim()}>
            {pending ? "전환 중" : "의뢰로 전환"}
          </button>
        </div>
        {!interview.clientName.trim() && <p className="text-sm text-warning">미팅 정보에 고객사 이름을 먼저 적어 주세요.</p>}
        {r.done < r.total && <p className="text-xs text-mute">준비가 덜 되어도 전환할 수 있습니다. 빠진 내용은 웍스 프로젝트에서 채우면 됩니다.</p>}
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      </div>
    </div>
  );
}
