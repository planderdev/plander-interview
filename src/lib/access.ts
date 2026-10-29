import { resolveQuote } from "./quote";
import type { Interview, Member, SharedInterview } from "./types";

/**
 * 내부 공유 범위. supabase/migrations 의 pi_can_view 와 같은 판단을 해야 합니다.
 * 한쪽을 고치면 다른 쪽도 고칩니다.
 */
export function canView(i: Interview, me: Member): boolean {
  if (me.role === "super_admin") return true;
  const involved = i.createdBy === me.id || i.participantIds.includes(me.id);
  if (i.internalScope === "team") return true;
  if (i.internalScope === "operators") return involved || me.role === "operator";
  return involved;
}

/** 볼 수 있는 사람 중 작성자, 참석자, 운영자 이상만 고칩니다. */
export function canEdit(i: Interview, me: Member): boolean {
  if (!canView(i, me)) return false;
  return me.role !== "user" || i.createdBy === me.id || i.participantIds.includes(me.id);
}

/** 고객 공유 링크에 내려갈 정보. 내부 메모, 외부 협력, 연락처, 위험 요소는 넣지 않습니다. */
export function toShared(i: Interview, ownerName = ""): SharedInterview {
  const s = i.shareSections;
  return {
    title: i.title,
    clientName: i.clientName,
    heldAt: i.heldAt,
    counterpartNames: i.counterparts.map((c) => [c.name, c.title].filter(Boolean).join(" ")).filter(Boolean),
    sections: s,
    business: s.business ? i.business : undefined,
    // 고객에게는 목표, 고민, 바라는 결과, 시작 시점, 해 보고 싶은 채널만 보입니다. (pi_shared_interview 와 같게)
    needs: s.needs
      ? {
          goals: i.needs.goals,
          pains: i.needs.pains,
          wish: i.needs.wish,
          timeline: i.needs.timeline,
          wantChannels: i.needs.wantChannels,
          targets: [],
          period: "",
          constraints: [],
          budget: "",
          decisionBy: "",
        }
      : undefined,
    summary: s.summary ? i.summary.external : undefined,
    planderItems: s.plander || s.estimate ? i.planderItems : undefined,
    nextActions: s.nextActions ? i.summary.nextActions.map((a) => ({ text: a.text, due: a.due })) : undefined,
    // 견적서는 예상 금액을 공유할 때만 내려갑니다. 수신자는 고객 본인이라 연락처를 넣습니다.
    quote: s.estimate
      ? resolveQuote({ id: i.id, title: i.title, clientName: i.clientName, counterparts: i.counterparts, region: i.business.region, quote: i.quote, ownerName })
      : undefined,
    updatedAt: i.updatedAt,
  };
}

/** 의뢰 전환 준비 정도 */
export function readiness(i: Interview) {
  const items = [
    { label: "상대측 미팅자 기록", ok: i.counterparts.some((c) => c.name.trim()) },
    { label: "고객 업종 기록", ok: Boolean(i.business.industry) },
    { label: "보강할 마케팅 단계 선택", ok: i.business.funnel.length > 0 },
    { label: "원하는 일 기록", ok: i.needs.goals.length > 0 || Boolean(i.needs.wish.trim()) },
    { label: "플랜더 항목 1개 이상", ok: i.planderItems.length > 0 },
    { label: "요약 작성", ok: Boolean(i.summary.oneline.trim()) },
    { label: "결정권자와 이야기함", ok: i.check.decisionMaker },
    { label: "예산 범위 확인", ok: i.check.budget },
    { label: "시작 시점 확인", ok: i.check.timeline },
    { label: "할 일 범위 공감", ok: i.check.scope },
  ];
  return { items, done: items.filter((x) => x.ok).length, total: items.length };
}
