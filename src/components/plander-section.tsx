"use client";

import { useMemo, useState } from "react";

import { CATALOG, CATALOG_ITEM } from "@/lib/catalog";
import { estimate, won } from "@/lib/estimate";
import { STAGE, STAGES, STAGE_FIT, type StageKey } from "@/lib/funnel";
import type { PlanderItem } from "@/lib/types";

import { RemoveButton, uid } from "./ui";

/** 플랜더가 할 수 있는 일: 단가표에서 고르고 수량을 정하면 예상 금액이 나옵니다. */
/** 항목의 퍼널 단계 칩 (앞이 주 단계) */
function StageChips({ id, highlight }: { id: string; highlight?: string[] }) {
  const fit = STAGE_FIT[id];
  if (!fit) return null;
  return (
    <span className="inline-flex flex-wrap gap-1" aria-label="퍼널 단계">
      {fit.map((k, i) => (
        <span
          key={k}
          className={`rounded-full border px-1.5 text-[10.5px] leading-[18px] ${
            highlight?.includes(k) ? "border-ink/50 text-ink" : "border-ink/15 text-mute"
          } ${i === 0 ? "font-semibold" : ""}`}
        >
          {STAGE[k].label}
        </span>
      ))}
    </span>
  );
}

type Browse = "fit" | "category" | StageKey;

export function PlanderSection({
  items,
  funnel,
  constraints,
  onChange,
  readOnly,
}: {
  items: PlanderItem[];
  /** 고객에게 보강이 필요한 퍼널 단계 (고객 사업에서 고름) */
  funnel: string[];
  constraints: string[];
  onChange: (items: PlanderItem[]) => void;
  readOnly: boolean;
}) {
  const [cat, setCat] = useState(CATALOG[0].id);
  const [browse, setBrowse] = useState<Browse>(funnel.length ? "fit" : "category");
  const [q, setQ] = useState("");
  const est = estimate(items);

  // 제약 조건에 걸리는 상품은 목록에서 뺍니다. (에임 레시피 빌더와 같은 기준)
  const blocked = useMemo(() => {
    const b = new Set<string>();
    if (constraints.includes("가격비교 작업 불가")) b.add("trafficSlot");
    return b;
  }, [constraints]);

  const found = useMemo(() => {
    const all = CATALOG.flatMap((c) => c.items).filter((i) => !blocked.has(i.id));
    const needle = q.trim();
    if (needle) return all.filter((i) => `${i.name} ${i.tiers.map((t) => t.desc).join(" ")}`.includes(needle));
    if (browse === "category") return (CATALOG.find((c) => c.id === cat)?.items ?? []).filter((i) => !blocked.has(i.id));
    const keys = browse === "fit" ? funnel : [browse];
    // 주 단계가 맞는 상품을 먼저, 보조 단계로 맞는 상품을 뒤에
    const score = (id: string) => {
      const fit = STAGE_FIT[id] ?? [];
      if (keys.includes(fit[0])) return 2;
      return fit.some((k) => keys.includes(k)) ? 1 : 0;
    };
    return all.filter((i) => score(i.id) > 0).sort((a, b) => score(b.id) - score(a.id));
  }, [browse, cat, q, funnel, blocked]);

  // 퍼널 단계별로 고른 항목 수. 보강할 단계가 비어 있으면 알려 줍니다.
  const coverage = STAGES.map((s) => ({
    ...s,
    count: items.filter((i) => (STAGE_FIT[i.catalogId] ?? []).includes(s.key)).length,
    wanted: funnel.includes(s.key),
  }));

  const set = (id: string, patch: Partial<PlanderItem>) =>
    onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  function add(catalogId: string) {
    const c = CATALOG_ITEM[catalogId];
    onChange([...items, { id: uid(), catalogId, tier: 0, qty: c.tiers[0].q, note: "" }]);
  }
  function addCustom() {
    onChange([...items, { id: uid(), catalogId: "custom", tier: 0, qty: 1, title: "", price: 0, unit: "식", note: "" }]);
  }
  const added = new Set(items.map((i) => i.catalogId));

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="label">퍼널 단계별 구성</span>
        <ol className="grid grid-cols-5 gap-1.5" aria-label="퍼널 단계별로 고른 항목 수">
          {coverage.map((c) => (
            <li
              key={c.key}
              className={`grid gap-0.5 rounded-xl border px-2 py-2 text-center ${
                c.wanted ? (c.count ? "border-ink/50" : "border-danger/50") : "border-ink/10"
              }`}
            >
              <span className={`text-[12.5px] ${c.wanted ? "font-semibold" : "text-sub"}`}>{c.label}</span>
              <span className={`num text-[15px] ${c.count ? "" : "text-mute"}`}>{c.count}</span>
              {c.wanted && !c.count && <span className="text-[10.5px] text-danger">비어 있음</span>}
            </li>
          ))}
        </ol>
        <p className="text-xs text-mute">
          굵은 칸은 고객 사업에서 고른 보강할 단계입니다. 에임 퍼널 보드처럼 단계마다 실행할 일이 하나 이상 있는지 확인합니다.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="tile px-4 py-6 text-center text-sm text-sub">
          아래 단가표에서 플랜더가 맡을 수 있는 일을 추가하세요. 단가표에 없는 일은 직접 추가할 수 있습니다.
        </p>
      ) : (
        <ul className="grid gap-2">
          {est.lines.map((l) => {
            const it = l.item;
            const c = it.catalogId === "custom" ? null : CATALOG_ITEM[it.catalogId];
            const tier = c?.tiers[it.tier];
            return (
              <li key={it.id} className="tile grid gap-3 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid min-w-0 flex-1 gap-1">
                    {c ? (
                      <span className="font-semibold">{c.name}</span>
                    ) : (
                      <input
                        className="field font-semibold"
                        id={`custom-title-${it.id}`}
                        aria-label="항목 이름"
                        placeholder="항목 이름 (예: 매장 POP 디자인)"
                        value={it.title ?? ""}
                        onChange={(e) => set(it.id, { title: e.target.value })}
                        disabled={readOnly}
                      />
                    )}
                    {c && <span className="text-sm text-sub">{l.desc}</span>}
                    {c && <StageChips id={it.catalogId} highlight={funnel} />}
                  </div>
                  <span className={`num text-right font-semibold ${l.consult ? "text-mute" : ""}`}>
                    {l.consult ? "상담 후 확정" : won(l.amount)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {c && c.tiers.length > 1 && (
                    <select
                      className="field w-auto"
                      aria-label={`${c.name} 단계`}
                      value={it.tier}
                      onChange={(e) => {
                        const ti = Number(e.target.value);
                        set(it.id, { tier: ti, qty: c.tiers[ti].q });
                      }}
                      disabled={readOnly}
                    >
                      {c.tiers.map((t, idx) => (
                        <option key={t.tier} value={idx}>
                          {t.tier}, {t.consult ? "별도 상담" : won(t.p)}
                        </option>
                      ))}
                    </select>
                  )}
                  {!c && (
                    <>
                      <input
                        className="field num w-32"
                        type="number"
                        min={0}
                        step={10000}
                        aria-label="단가"
                        value={it.price ?? 0}
                        onChange={(e) => set(it.id, { price: Math.max(0, Number(e.target.value) || 0) })}
                        disabled={readOnly}
                      />
                      <span className="text-sm text-sub">원 /</span>
                      <input
                        className="field w-20"
                        aria-label="단위"
                        value={it.unit ?? "식"}
                        onChange={(e) => set(it.id, { unit: e.target.value })}
                        disabled={readOnly}
                      />
                    </>
                  )}
                  {!l.consult || !c ? (
                    <label className="flex items-center gap-2 text-sm text-sub">
                      수량
                      <input
                        className="field num w-24"
                        type="number"
                        min={tier?.min ?? 1}
                        aria-label="수량"
                        value={it.qty}
                        onChange={(e) => set(it.id, { qty: Math.max(tier?.min ?? 1, Math.round(Number(e.target.value) || 0)) })}
                        disabled={readOnly}
                      />
                      {l.unit}
                    </label>
                  ) : null}
                  {tier && !tier.consult && (
                    <span className="num text-xs text-mute">
                      {won(tier.p)} / {tier.u}
                      {tier.r ? ` (단가표 ${tier.r}, 중간값)` : tier.from ? "부터" : ""}
                    </span>
                  )}
                  <div className="ml-auto">
                    <RemoveButton label="항목 삭제" onClick={() => onChange(items.filter((x) => x.id !== it.id))} disabled={readOnly} />
                  </div>
                </div>
                <input
                  className="field"
                  aria-label="메모"
                  placeholder="메모 (예: 오픈 2주 차부터 진행)"
                  value={it.note}
                  onChange={(e) => set(it.id, { note: e.target.value })}
                  disabled={readOnly}
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className="tile grid justify-end gap-1 p-4 text-sm">
        <div className="grid grid-cols-[auto_auto] gap-x-8 gap-y-1">
          <span className="text-sub">공급가액</span>
          <span className="num text-right">{won(est.supply)}</span>
          <span className="text-sub">부가세 10%</span>
          <span className="num text-right">{won(est.vat)}</span>
          <span className="font-semibold">예상 합계</span>
          <span className="num text-right font-semibold">{won(est.total)}</span>
        </div>
      </div>

      {!readOnly && (
        <div className="grid gap-3 rounded-2xl border border-dashed border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">단가표에서 추가</span>
            <input
              className="field max-w-xs"
              id="catalog-search"
              placeholder="항목 검색 (예: 체험단)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="button" className="btn btn-sm ml-auto" onClick={addCustom}>
              직접 추가
            </button>
          </div>
          {!q && (
            <div className="grid gap-2">
              <div className="flex flex-wrap gap-2" role="group" aria-label="보는 방식">
                {funnel.length > 0 && (
                  <button type="button" className="toggle-chip" aria-pressed={browse === "fit"} onClick={() => setBrowse("fit")}>
                    보강할 단계에 맞는 상품
                  </button>
                )}
                {STAGES.map((s) => (
                  <button key={s.key} type="button" className="toggle-chip" aria-pressed={browse === s.key} onClick={() => setBrowse(s.key)}>
                    {s.label}
                  </button>
                ))}
                <button type="button" className="toggle-chip" aria-pressed={browse === "category"} onClick={() => setBrowse("category")}>
                  분류별
                </button>
              </div>
              {browse === "category" && (
                <div className="flex flex-wrap gap-2 border-t border-line pt-2" role="group" aria-label="단가표 분류">
                  {CATALOG.map((c) => (
                    <button key={c.id} type="button" className="toggle-chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <ul className="grid gap-1">
            {found.map((i) => {
              const t0 = i.tiers[0];
              return (
                <li key={i.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink/5">
                  <div className="grid min-w-0 flex-1">
                    <span className="text-sm font-medium">{i.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mute">
                      <span>
                        {i.tiers.length > 1 ? `${i.tiers.length}단계, ` : ""}
                        {t0.consult ? "별도 상담" : `${won(t0.p)}${i.tiers.length > 1 || t0.from ? "부터" : ""} / ${t0.u}`}
                      </span>
                      <StageChips id={i.id} highlight={funnel} />
                    </span>
                  </div>
                  <button type="button" className="btn btn-sm" onClick={() => add(i.id)}>
                    {added.has(i.id) ? "한 번 더" : "추가"}
                  </button>
                </li>
              );
            })}
            {found.length === 0 && <li className="px-2 py-3 text-sm text-sub">찾는 항목이 없습니다. 직접 추가를 눌러 주세요.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
