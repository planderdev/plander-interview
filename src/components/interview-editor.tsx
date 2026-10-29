"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { deleteAction, saveAction } from "@/app/(app)/interviews/[id]/actions";
import {
  BUDGETS,
  CHANNELS,
  COUNTERPART_ROLE,
  GOALS,
  INDUSTRIES,
  METHODS,
  MODELS,
  PARTNER_FIELDS,
  PARTNER_STATUS,
  STAGES,
  STATUS_META,
  STATUS_ORDER,
  TIMELINES,
} from "@/lib/options";
import { won } from "@/lib/estimate";
import type { Business, ClientOption, Counterpart, Interview, Member, Needs, PartnerItem, Summary } from "@/lib/types";

import { ClientPicker } from "./client-picker";
import { ConvertSection } from "./convert-section";
import { PlanderSection } from "./plander-section";
import { ShareSection } from "./share-section";
import { Chips, Field, RemoveButton, Section, uid } from "./ui";

const NAV = [
  ["meeting", "미팅 정보"],
  ["counterparts", "상대측 미팅자"],
  ["business", "고객 사업"],
  ["needs", "원하는 일"],
  ["plander", "플랜더가 할 일"],
  ["partners", "외부 협력"],
  ["summary", "요약 정리"],
  ["share", "공유 범위"],
  ["convert", "의뢰 전환"],
] as const;

type SaveState = "saved" | "dirty" | "saving" | "error";

export function InterviewEditor({
  initial,
  me,
  members,
  clients,
  editable,
  canDelete,
  worksUrl,
}: {
  initial: Interview;
  me: Member;
  members: Member[];
  clients: ClientOption[];
  editable: boolean;
  canDelete: boolean;
  worksUrl: string;
}) {
  const [iv, setIv] = useState(initial);
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const latest = useRef(iv);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);
  const readOnly = !editable;

  const save = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inflight.current) await inflight.current;
    const snapshot = latest.current;
    setState("saving");
    const p = saveAction(snapshot).then((r) => {
      if (!r.ok) {
        setState("error");
        setError(r.error);
        return false;
      }
      setError("");
      setState(latest.current === snapshot ? "saved" : "dirty");
      return true;
    });
    inflight.current = p;
    const ok = await p;
    inflight.current = null;
    return ok;
  }, []);

  const update = useCallback(
    (patch: Partial<Interview>) => {
      if (readOnly) return;
      setIv((cur) => {
        const next = { ...cur, ...patch };
        latest.current = next;
        return next;
      });
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), 900);
    },
    [readOnly, save],
  );

  // 저장 전에 창을 닫으려 하면 경고합니다.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  const setBiz = (p: Partial<Business>) => update({ business: { ...iv.business, ...p } });
  const setNeeds = (p: Partial<Needs>) => update({ needs: { ...iv.needs, ...p } });
  const setSum = (p: Partial<Summary>) => update({ summary: { ...iv.summary, ...p } });
  const setCp = (id: string, p: Partial<Counterpart>) =>
    update({ counterparts: iv.counterparts.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const setPartner = (id: string, p: Partial<PartnerItem>) =>
    update({ partnerItems: iv.partnerItems.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  /** 웍스 고객 불러오기: 비어 있는 칸만 채우고, 이미 적은 내용은 덮지 않습니다. */
  function pickClient(c: ClientOption) {
    const region = c.address.split(" ").slice(0, 2).join(" ");
    const hasContact = c.contactName && iv.counterparts.some((x) => x.name.trim() === c.contactName.trim());
    update({
      clientId: c.id,
      clientName: c.name,
      business: {
        ...iv.business,
        industry: iv.business.industry || c.industry,
        website: iv.business.website || c.website,
        region: iv.business.region || region,
      },
      counterparts:
        c.contactName && !hasContact
          ? [
              ...iv.counterparts,
              {
                id: uid(),
                name: c.contactName,
                title: "",
                phone: c.phone,
                email: c.email,
                role: iv.counterparts.length ? "practical" : "decision",
                note: "웍스 고객 정보에서 불러옴",
              },
            ]
          : iv.counterparts,
    });
  }

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "알 수 없음";
  const partnerTotal = iv.partnerItems.reduce((s, x) => s + (x.cost ?? 0), 0);

  const stateLabel: Record<SaveState, string> = {
    saved: "저장됨",
    dirty: "저장 대기",
    saving: "저장 중",
    error: "저장 실패",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      {/* 구역 바로가기 */}
      <nav aria-label="인터뷰 구역" className="hidden lg:block">
        <ol className="sticky top-24 grid gap-1 text-sm">
          {NAV.map(([id, label], idx) => (
            <li key={id}>
              <a href={`#${id}`} className="flex items-center gap-3 rounded-full px-3 py-1.5 text-sub transition-colors duration-300 hover:bg-ink/5 hover:text-ink">
                <span className="index">{String(idx + 1).padStart(2, "0")}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid min-w-0 gap-5">
        {/* 머리글 */}
        <div className="flex flex-wrap items-center gap-3">
          <a href="/interviews" className="text-link text-sm text-sub">인터뷰 목록</a>
          <span className="chip ml-auto" role="status">
            <span
              className={`dot ${readOnly ? "text-mute" : state === "error" ? "text-danger" : state === "saved" ? "text-success" : "text-prism"}`}
              aria-hidden
            />
            {readOnly ? "읽기 전용" : stateLabel[state]}
          </span>
          {!readOnly && state !== "saved" && (
            <button type="button" className="btn btn-sm" onClick={() => void save()} disabled={state === "saving"}>
              지금 저장
            </button>
          )}
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {readOnly && (
          <p className="tile p-3 text-sm text-sub">
            이 인터뷰는 볼 수만 있습니다. 고치려면 작성자나 운영자에게 플랜더 참석자로 넣어 달라고 요청하세요.
          </p>
        )}

        <input
          className="w-full bg-transparent text-[28px] font-semibold tracking-[-0.035em] outline-none placeholder:text-mute focus:outline-none sm:text-[34px]"
          aria-label="인터뷰 제목"
          id="iv-title"
          value={iv.title}
          placeholder="인터뷰 제목 (예: 한라국수 오픈 마케팅 미팅)"
          onChange={(e) => update({ title: e.target.value })}
          readOnly={readOnly}
        />

        {/* 01 미팅 정보 */}
        <Section id="meeting" no={1} title="미팅 정보" desc="언제, 어디서, 누가 만났는지 남깁니다.">
          <ClientPicker
            interviewId={iv.id}
            clientId={iv.clientId}
            clientName={iv.clientName}
            clients={clients}
            worksUrl={worksUrl}
            readOnly={readOnly}
            locked={Boolean(iv.projectId)}
            onPick={pickClient}
            onUnlink={() => update({ clientId: null })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="고객사 이름" htmlFor="client-name">
              <input id="client-name" className="field" value={iv.clientName} placeholder="예: 한라국수" onChange={(e) => update({ clientName: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="진행 상태" htmlFor="status">
              <select
                id="status"
                className="field"
                value={iv.status}
                onChange={(e) => update({ status: e.target.value as Interview["status"] })}
                disabled={readOnly || iv.status === "converted"}
              >
                {STATUS_ORDER.filter((s) => s !== "converted" || iv.status === "converted").map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </Field>
            <Field label="일시" htmlFor="held-at">
              <input id="held-at" type="datetime-local" className="field" value={iv.heldAt} onChange={(e) => update({ heldAt: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="장소" htmlFor="place">
              <input id="place" className="field" value={iv.place} placeholder="예: 고객 매장, 플랜더 회의실" onChange={(e) => update({ place: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="미팅 방식" wide>
              <Chips label="미팅 방식" options={METHODS} value={iv.method} onChange={(v) => update({ method: v as string })} disabled={readOnly} />
            </Field>
            <Field label="플랜더 참석자" wide>
              <div className="flex flex-wrap gap-2" role="group" aria-label="플랜더 참석자">
                {members.map((m) => {
                  const on = iv.participantIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="toggle-chip"
                      aria-pressed={on}
                      disabled={readOnly}
                      onClick={() =>
                        update({ participantIds: on ? iv.participantIds.filter((x) => x !== m.id) : [...iv.participantIds, m.id] })
                      }
                    >
                      {m.name}
                      <span className="text-xs text-mute">{m.position || m.team}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
          <p className="text-xs text-mute">
            작성 {nameOf(iv.createdBy)}
            {iv.updatedBy && `, 마지막 수정 ${nameOf(iv.updatedBy)}`}
          </p>
        </Section>

        {/* 02 상대측 미팅자 */}
        <Section
          id="counterparts"
          no={2}
          title="상대측 미팅자"
          desc="누가 결정하고 누가 실무를 하는지 함께 적어 두면 제안과 후속 연락이 쉬워집니다. 연락처는 고객 공유에 나가지 않습니다."
          aside={
            !readOnly && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  update({
                    counterparts: [
                      ...iv.counterparts,
                      { id: uid(), name: "", title: "", phone: "", email: "", role: iv.counterparts.length ? "practical" : "decision", note: "" },
                    ],
                  })
                }
              >
                미팅자 추가
              </button>
            )
          }
        >
          {iv.counterparts.length === 0 && <p className="tile px-4 py-5 text-center text-sm text-sub">"미팅자 추가"를 눌러 상대측 참석자를 적어 주세요.</p>}
          <ul className="grid gap-3">
            {iv.counterparts.map((c, idx) => (
              <li key={c.id} className="tile grid gap-3 p-4 sm:grid-cols-2">
                <Field label="이름" htmlFor={`cp-name-${c.id}`}>
                  <input id={`cp-name-${c.id}`} className="field" value={c.name} onChange={(e) => setCp(c.id, { name: e.target.value })} readOnly={readOnly} />
                </Field>
                <Field label="직함" htmlFor={`cp-title-${c.id}`}>
                  <input id={`cp-title-${c.id}`} className="field" value={c.title} placeholder="예: 대표, 마케팅 팀장" onChange={(e) => setCp(c.id, { title: e.target.value })} readOnly={readOnly} />
                </Field>
                <Field label="연락처" htmlFor={`cp-phone-${c.id}`}>
                  <input id={`cp-phone-${c.id}`} className="field" type="tel" value={c.phone} onChange={(e) => setCp(c.id, { phone: e.target.value })} readOnly={readOnly} />
                </Field>
                <Field label="이메일" htmlFor={`cp-email-${c.id}`}>
                  <input id={`cp-email-${c.id}`} className="field" type="email" value={c.email} onChange={(e) => setCp(c.id, { email: e.target.value })} readOnly={readOnly} />
                </Field>
                <Field label="결정 역할" wide>
                  <Chips
                    label={`${idx + 1}번째 미팅자 결정 역할`}
                    options={Object.values(COUNTERPART_ROLE)}
                    value={COUNTERPART_ROLE[c.role]}
                    onChange={(v) => {
                      const role = (Object.keys(COUNTERPART_ROLE) as Counterpart["role"][]).find((k) => COUNTERPART_ROLE[k] === v);
                      if (role) setCp(c.id, { role });
                    }}
                    disabled={readOnly}
                  />
                </Field>
                <div className="flex gap-2 sm:col-span-2">
                  <input className="field" aria-label="미팅자 메모" placeholder="메모 (성향, 관심사 등)" value={c.note} onChange={(e) => setCp(c.id, { note: e.target.value })} readOnly={readOnly} />
                  <RemoveButton label="미팅자 삭제" onClick={() => update({ counterparts: iv.counterparts.filter((x) => x.id !== c.id) })} disabled={readOnly} />
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* 03 고객 사업 */}
        <Section id="business" no={3} title="고객 사업" desc="어떤 사업을 하고 지금 어느 단계인지 적습니다.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="업종" wide>
              <Chips label="업종" options={INDUSTRIES} value={iv.business.industry} onChange={(v) => setBiz({ industry: v as string })} disabled={readOnly} />
            </Field>
            <Field label="사업 형태" wide>
              <Chips label="사업 형태" options={MODELS} value={iv.business.model} onChange={(v) => setBiz({ model: v as string })} disabled={readOnly} />
            </Field>
            <Field label="사업 단계" wide>
              <Chips label="사업 단계" options={STAGES} value={iv.business.stage} onChange={(v) => setBiz({ stage: v as string })} disabled={readOnly} />
            </Field>
            <Field label="지역" htmlFor="region">
              <input id="region" className="field" value={iv.business.region} placeholder="예: 제주 신제주" onChange={(e) => setBiz({ region: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="웹사이트, SNS 주소" htmlFor="website">
              <input id="website" className="field" value={iv.business.website} placeholder="https://" onChange={(e) => setBiz({ website: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="지금 운영 중인 채널" wide>
              <Chips label="운영 중인 채널" multi options={CHANNELS} value={iv.business.channels} onChange={(v) => setBiz({ channels: v as string[] })} disabled={readOnly} />
            </Field>
            <Field label="사업 설명" htmlFor="biz-desc" wide>
              <textarea id="biz-desc" className="field" value={iv.business.description} placeholder="주력 상품, 고객층, 경쟁 상황 등" onChange={(e) => setBiz({ description: e.target.value })} readOnly={readOnly} />
            </Field>
          </div>
        </Section>

        {/* 04 원하는 일 */}
        <Section id="needs" no={4} title="원하는 일" desc="고객이 말한 목표와 고민을 고객의 말에 가깝게 적습니다.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="목표" wide>
              <Chips label="목표" multi options={GOALS} value={iv.needs.goals} onChange={(v) => setNeeds({ goals: v as string[] })} disabled={readOnly} />
            </Field>
            <Field label="지금 겪는 문제" htmlFor="pains" wide>
              <textarea id="pains" className="field" value={iv.needs.pains} placeholder="예: 오픈 직후 리뷰가 없어 지도 검색에서 밀릴까 걱정" onChange={(e) => setNeeds({ pains: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="바라는 결과" htmlFor="wish" wide>
              <textarea id="wish" className="field" value={iv.needs.wish} placeholder="예: 오픈 첫 달에 리뷰 100개, 블로그 후기 10건" onChange={(e) => setNeeds({ wish: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="시작 시점" wide>
              <Chips label="시작 시점" options={TIMELINES} value={iv.needs.timeline} onChange={(v) => setNeeds({ timeline: v as string })} disabled={readOnly} />
            </Field>
            <Field label="월 예산" wide>
              <Chips label="월 예산" options={BUDGETS} value={iv.needs.budget} onChange={(v) => setNeeds({ budget: v as string })} disabled={readOnly} />
            </Field>
            <Field label="결정 시점" htmlFor="decision-by">
              <input id="decision-by" className="field" value={iv.needs.decisionBy} placeholder="예: 11월 첫째 주" onChange={(e) => setNeeds({ decisionBy: e.target.value })} readOnly={readOnly} />
            </Field>
          </div>
        </Section>

        {/* 05 플랜더가 할 수 있는 일 */}
        <Section id="plander" no={5} title="플랜더가 할 수 있는 일" desc="플랜더 단가표 기준입니다. 범위 단가는 중간값, '부터' 단가는 시작 금액으로 계산합니다.">
          <PlanderSection items={iv.planderItems} onChange={(planderItems) => update({ planderItems })} readOnly={readOnly} />
        </Section>

        {/* 06 외부 협력 */}
        <Section
          id="partners"
          no={6}
          title="외부 협력이 필요한 일"
          desc="플랜더가 직접 하지 않고 협력사가 필요한 일입니다. 내부에서만 보이고 고객 공유에는 나가지 않습니다."
          aside={
            !readOnly && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  update({ partnerItems: [...iv.partnerItems, { id: uid(), title: "", field: "", partner: "", cost: null, status: "todo", note: "" }] })
                }
              >
                협력 항목 추가
              </button>
            )
          }
        >
          {iv.partnerItems.length === 0 && <p className="tile px-4 py-5 text-center text-sm text-sub">인쇄, 촬영, 개발, 현지 협력처럼 외부에 맡길 일이 있으면 추가하세요.</p>}
          <ul className="grid gap-3">
            {iv.partnerItems.map((x) => (
              <li key={x.id} className="tile grid gap-3 p-4 sm:grid-cols-2">
                <Field label="할 일" htmlFor={`pt-title-${x.id}`} wide>
                  <input id={`pt-title-${x.id}`} className="field" value={x.title} placeholder="예: 메뉴판 중국어 번역과 인쇄" onChange={(e) => setPartner(x.id, { title: e.target.value })} readOnly={readOnly} />
                </Field>
                <Field label="분야" wide>
                  <Chips label="협력 분야" options={PARTNER_FIELDS} value={x.field} onChange={(v) => setPartner(x.id, { field: v as string })} disabled={readOnly} />
                </Field>
                <Field label="협력사" htmlFor={`pt-partner-${x.id}`}>
                  <input id={`pt-partner-${x.id}`} className="field" value={x.partner} placeholder="미정이면 비워 두세요" onChange={(e) => setPartner(x.id, { partner: e.target.value })} readOnly={readOnly} />
                </Field>
                <Field label="예상 비용 (원)" htmlFor={`pt-cost-${x.id}`}>
                  <input
                    id={`pt-cost-${x.id}`}
                    className="field num"
                    type="number"
                    min={0}
                    step={10000}
                    value={x.cost ?? ""}
                    onChange={(e) => setPartner(x.id, { cost: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                    readOnly={readOnly}
                  />
                </Field>
                <Field label="상태" wide>
                  <Chips
                    label="협력 상태"
                    options={Object.values(PARTNER_STATUS)}
                    value={PARTNER_STATUS[x.status]}
                    onChange={(v) => {
                      const s = (Object.keys(PARTNER_STATUS) as PartnerItem["status"][]).find((k) => PARTNER_STATUS[k] === v);
                      if (s) setPartner(x.id, { status: s });
                    }}
                    disabled={readOnly}
                  />
                </Field>
                <div className="flex gap-2 sm:col-span-2">
                  <input className="field" aria-label="협력 메모" placeholder="메모" value={x.note} onChange={(e) => setPartner(x.id, { note: e.target.value })} readOnly={readOnly} />
                  <RemoveButton label="협력 항목 삭제" onClick={() => update({ partnerItems: iv.partnerItems.filter((y) => y.id !== x.id) })} disabled={readOnly} />
                </div>
              </li>
            ))}
          </ul>
          {partnerTotal > 0 && <p className="num text-right text-sm text-sub">외부 협력 예상 비용 합계 {won(partnerTotal)}</p>}
        </Section>

        {/* 07 요약 정리 */}
        <Section id="summary" no={7} title="요약 정리" desc="내부용 요약과 고객에게 보여 줄 정리를 나눠 씁니다.">
          <div className="grid gap-4">
            <Field label="한 줄 요약 (내부)" htmlFor="oneline">
              <input id="oneline" className="field" value={iv.summary.oneline} placeholder="예: 오픈 첫 달 플레이스, 리뷰, 중국 체험단. 예산 200만 원 안팎" onChange={(e) => setSum({ oneline: e.target.value })} readOnly={readOnly} />
            </Field>
            <Field label="고객에게 보여 줄 정리" htmlFor="external">
              <textarea
                id="external"
                className="field min-h-[130px]"
                value={iv.summary.external}
                placeholder="고객 공유 링크의 '미팅 정리'에 그대로 보입니다. 들은 내용과 플랜더가 제안하는 방향을 고객의 눈높이로 적어 주세요."
                onChange={(e) => setSum({ external: e.target.value })}
                readOnly={readOnly}
              />
            </Field>
            <Field label="위험 요소 (내부)" htmlFor="risks">
              <textarea id="risks" className="field" value={iv.summary.risks} placeholder="예: 오픈 일정이 밀리면 체험단도 밀림" onChange={(e) => setSum({ risks: e.target.value })} readOnly={readOnly} />
            </Field>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="label">다음 할 일</span>
                {!readOnly && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setSum({ nextActions: [...iv.summary.nextActions, { id: uid(), text: "", ownerId: me.id, due: "", done: false }] })}
                  >
                    할 일 추가
                  </button>
                )}
              </div>
              {iv.summary.nextActions.length === 0 && <p className="text-sm text-mute">제안서 전달, 견적 확인처럼 미팅 뒤에 할 일을 담당자와 함께 적어 두세요.</p>}
              <ul className="grid gap-2">
                {iv.summary.nextActions.map((a) => {
                  const setA = (p: Partial<typeof a>) =>
                    setSum({ nextActions: iv.summary.nextActions.map((x) => (x.id === a.id ? { ...x, ...p } : x)) });
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--prism))]" aria-label="완료" checked={a.done} onChange={(e) => setA({ done: e.target.checked })} disabled={readOnly} />
                      <input className={`field min-w-[12rem] flex-1 ${a.done ? "text-mute line-through" : ""}`} aria-label="할 일" value={a.text} onChange={(e) => setA({ text: e.target.value })} readOnly={readOnly} />
                      <select className="field w-auto" aria-label="담당자" value={a.ownerId} onChange={(e) => setA({ ownerId: e.target.value })} disabled={readOnly}>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input className="field w-auto" type="date" aria-label="기한" value={a.due} onChange={(e) => setA({ due: e.target.value })} readOnly={readOnly} />
                      <RemoveButton label="할 일 삭제" onClick={() => setSum({ nextActions: iv.summary.nextActions.filter((x) => x.id !== a.id) })} disabled={readOnly} />
                    </li>
                  );
                })}
              </ul>
            </div>

            <Field label="내부 메모" htmlFor="memo">
              <textarea id="memo" className="field" value={iv.summary.internalMemo} placeholder="가격 반응, 분위기, 내부에서만 알아야 할 것" onChange={(e) => setSum({ internalMemo: e.target.value })} readOnly={readOnly} />
            </Field>
          </div>
        </Section>

        {/* 08 공유 범위 */}
        <Section id="share" no={8} title="공유 범위" desc="플랜더 안에서 누가 볼지, 고객에게 무엇을 보여 줄지 정합니다.">
          <ShareSection
            interview={iv}
            onChange={update}
            readOnly={readOnly}
            onShareChange={(shareEnabled, shareToken) => {
              setIv((cur) => {
                const next = { ...cur, shareEnabled, shareToken };
                latest.current = next;
                return next;
              });
            }}
          />
        </Section>

        {/* 09 의뢰 전환 */}
        <Section id="convert" no={9} title="의뢰 전환" desc="미팅이 의뢰로 이어지면 웍스에 클라이언트와 프로젝트를 만듭니다.">
          <ConvertSection
            interview={iv}
            clients={clients}
            worksUrl={worksUrl}
            readOnly={readOnly}
            onChange={update}
            flush={save}
            onConverted={(clientId, projectId) => {
              setIv((cur) => {
                const next = { ...cur, clientId, projectId, status: "converted" as const, convertedAt: new Date().toISOString() };
                latest.current = next;
                return next;
              });
            }}
          />
        </Section>

        {canDelete && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            {confirmDelete ? (
              <>
                <span className="text-sm text-sub">이 인터뷰를 지울까요? 되돌릴 수 없습니다.</span>
                <button type="button" className="btn btn-sm" onClick={() => setConfirmDelete(false)}>취소</button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={deleting}
                  onClick={() => startDelete(() => deleteAction(iv.id))}
                >
                  {deleting ? "삭제 중" : "삭제"}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}>
                인터뷰 삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
