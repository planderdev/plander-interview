import { CATALOG_ITEM, type CatalogTier } from "./catalog";
import type { PlanderItem } from "./types";

export interface EstimateLine {
  item: PlanderItem;
  name: string;
  tierName: string;
  desc: string;
  unit: string;
  price: number;
  qty: number;
  amount: number;
  consult: boolean;
  projectCategory: string;
}

/** 플랜더 항목 하나를 견적 줄로 풉니다. 단가표에서 사라진 항목은 null */
export function lineOf(item: PlanderItem): EstimateLine | null {
  if (item.catalogId === "custom") {
    const price = Math.max(0, item.price ?? 0);
    return {
      item,
      name: item.title?.trim() || "직접 입력 항목",
      tierName: "",
      desc: item.note,
      unit: item.unit || "식",
      price,
      qty: item.qty,
      amount: price * item.qty,
      consult: price === 0,
      projectCategory: "",
    };
  }
  const c = CATALOG_ITEM[item.catalogId];
  if (!c) return null;
  const tier: CatalogTier = c.tiers[item.tier] ?? c.tiers[0];
  return {
    item,
    name: c.name,
    tierName: c.tiers.length > 1 ? tier.tier : "",
    desc: tier.desc,
    unit: tier.u,
    price: tier.p,
    qty: item.qty,
    amount: tier.consult ? 0 : tier.p * item.qty,
    consult: Boolean(tier.consult),
    projectCategory: c.projectCategory,
  };
}

export function estimate(items: PlanderItem[]) {
  const lines = items.map(lineOf).filter((l): l is EstimateLine => l !== null);
  const supply = lines.reduce((s, l) => s + l.amount, 0);
  const vat = Math.round(supply * 0.1);
  return { lines, supply, vat, total: supply + vat };
}

/** 고른 항목 금액이 가장 큰 웍스 카테고리 */
export function guessCategory(items: PlanderItem[]): string {
  const sums = new Map<string, number>();
  for (const l of estimate(items).lines) {
    if (!l.projectCategory) continue;
    sums.set(l.projectCategory, (sums.get(l.projectCategory) ?? 0) + Math.max(l.amount, 1));
  }
  let best = "";
  let max = 0;
  for (const [k, v] of sums) if (v > max) { best = k; max = v; }
  return best;
}

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
