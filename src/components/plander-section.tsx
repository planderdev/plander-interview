"use client";

import { useMemo, useState } from "react";

import { CATALOG, CATALOG_ITEM } from "@/lib/catalog";
import { estimate, won } from "@/lib/estimate";
import type { PlanderItem } from "@/lib/types";

import { RemoveButton, uid } from "./ui";

/** 플랜더가 할 수 있는 일: 단가표에서 고르고 수량을 정하면 예상 금액이 나옵니다. */
export function PlanderSection({
  items,
  onChange,
  readOnly,
}: {
  items: PlanderItem[];
  onChange: (items: PlanderItem[]) => void;
  readOnly: boolean;
}) {
  const [cat, setCat] = useState(CATALOG[0].id);
  const [q, setQ] = useState("");
  const est = estimate(items);

  const found = useMemo(() => {
    const needle = q.trim();
    if (needle) {
      return CATALOG.flatMap((c) => c.items).filter((i) =>
        `${i.name} ${i.tiers.map((t) => t.desc).join(" ")}`.includes(needle),
      );
    }
    return CATALOG.find((c) => c.id === cat)?.items ?? [];
  }, [cat, q]);

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
            <div className="flex flex-wrap gap-2" role="group" aria-label="단가표 분류">
              {CATALOG.map((c) => (
                <button key={c.id} type="button" className="toggle-chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <ul className="grid gap-1">
            {found.map((i) => {
              const t0 = i.tiers[0];
              return (
                <li key={i.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink/5">
                  <div className="grid min-w-0 flex-1">
                    <span className="text-sm font-medium">{i.name}</span>
                    <span className="truncate text-xs text-mute">
                      {i.tiers.length > 1 ? `${i.tiers.length}단계, ` : ""}
                      {t0.consult ? "별도 상담" : `${won(t0.p)}${i.tiers.length > 1 || t0.from ? "부터" : ""} / ${t0.u}`}
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
