import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CopyButton } from "@/components/copy-button";
import { Crumbs } from "@/components/crumbs";
import { canEdit, readiness } from "@/lib/access";
import { estimate, won } from "@/lib/estimate";
import { stageLabels } from "@/lib/funnel";
import {
  COUNTERPART_ROLE,
  PARTNER_STATUS,
  SCOPE_META,
  SHARE_SECTION_LABEL,
  STATUS_META,
} from "@/lib/options";
import { getInterview, getMe, listClients, listMembers } from "@/lib/store";
import { WORKS_URL } from "@/lib/supabase/config";
import type { ShareSections } from "@/lib/types";

export const metadata: Metadata = { title: "내부 공유", robots: { index: false, follow: false } };

/** 섹션 머리: 영문 라벨과 번호, 아래 1px 선 */
function Block({ label, no, title, children }: { label: string; no: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card grid gap-4 p-5 sm:p-7">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="eyebrow">{label}</span>
        <span className="index">{String(no).padStart(2, "0")}</span>
      </div>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string | undefined][] }) {
  const list = rows.filter(([, v]) => v && v.trim());
  if (!list.length) return <p className="text-sm text-mute">기록이 없습니다.</p>;
  return (
    <dl className="grid gap-x-8 gap-y-2.5 text-[14.5px] sm:grid-cols-[9rem_minmax(0,1fr)]">
      {list.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-sub">{k}</dt>
          <dd className="whitespace-pre-line">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 내부 공유 페이지. 인터뷰의 모든 기록(연락처, 외부 협력, 내부 메모, 위험 요소 포함)을 읽기 전용으로 보여 줍니다.
 * 볼 수 있는 사람은 내부 공유 범위로 정해지고(canView, pi_can_view), 범위 밖이면 찾을 수 없음으로 보입니다.
 */
export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  const iv = await getInterview(me, id);
  if (!iv) notFound();
  const [members, clients] = await Promise.all([listMembers(), listClients()]);
  const nameOf = (uid: string) => members.find((m) => m.id === uid)?.name ?? "알 수 없음";
  const est = estimate(iv.planderItems);
  const r = readiness(iv);
  const partnerTotal = iv.partnerItems.reduce((s, x) => s + (x.cost ?? 0), 0);
  const linked = iv.clientId ? clients.find((c) => c.id === iv.clientId) : null;
  const sharedOn = (Object.keys(SHARE_SECTION_LABEL) as (keyof ShareSections)[]).filter((k) => iv.shareSections[k]);
  let no = 0;

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Crumbs items={[{ label: "인터뷰 목록", href: "/interviews" }, { label: iv.title || "제목 없는 인터뷰", href: `/interviews/${iv.id}` }, { label: "내부 공유" }]} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Link className="btn btn-sm btn-primary" href={`/interviews/${iv.id}/quote`}>견적서 뽑기</Link>
          <Link className="btn btn-sm" href={`/interviews/${iv.id}/proposal`}>전략 제안서</Link>
          <CopyButton path={`/interviews/${iv.id}/brief`} label="내부 공유 링크 복사" />
          {iv.shareEnabled && iv.shareToken && (
            <a className="btn btn-sm" href={`/s/${iv.shareToken}`} target="_blank" rel="noreferrer">외부 공유 페이지</a>
          )}
          {canEdit(iv, me) && <Link className="btn btn-sm" href={`/interviews/${iv.id}`}>편집하기</Link>}
        </div>
      </div>

      {/* 머리 */}
      <header className="card grid gap-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-auto">Internal brief</span>
          <span className="chip"><span className={`dot ${STATUS_META[iv.status].tone}`} aria-hidden />{STATUS_META[iv.status].label}</span>
          <span className="chip">내부 공유: {SCOPE_META[iv.internalScope].label}</span>
          <span className="chip">
            <span className={`dot ${iv.shareEnabled ? "text-prism" : "text-mute"}`} aria-hidden />
            외부 공유 {iv.shareEnabled ? "켜짐" : "꺼짐"}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm text-sub">{iv.clientName || "고객사 미입력"}{linked && ", 플랜더웍스 고객"}</span>
          <h1 className="text-[26px] font-semibold tracking-[-0.035em] sm:text-[32px]">{iv.title}</h1>
        </div>
        {iv.needs.wish && <p className="text-[16px] leading-[1.7]">{iv.needs.wish}</p>}
        <p className="text-xs text-mute">
          {SCOPE_META[iv.internalScope].desc} 작성 {nameOf(iv.createdBy)}
          {iv.updatedBy && `, 마지막 수정 ${nameOf(iv.updatedBy)}`}, <span className="num">{iv.updatedAt.slice(0, 16).replace("T", " ")}</span>
        </p>
      </header>

      <Block label="Meeting" no={++no} title="미팅 정보">
        <Rows
          rows={[
            ["일시", iv.heldAt.replace("T", " ")],
            ["방식", iv.method],
            ["장소", iv.place],
            ["플랜더 참석자", iv.participantIds.map(nameOf).join(", ")],
            ["웍스 고객", linked ? `${linked.name} (${[linked.industry, linked.contactName].filter(Boolean).join(", ") || "정보 없음"})` : "연결 안 됨"],
          ]}
        />
      </Block>

      <Block label="Counterpart" no={++no} title="상대측 미팅자">
        {iv.counterparts.length === 0 ? (
          <p className="text-sm text-mute">기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-sub">
                  <th className="py-2 pr-3 font-medium">이름</th>
                  <th className="py-2 pr-3 font-medium">역할</th>
                  <th className="py-2 pr-3 font-medium">연락처</th>
                  <th className="py-2 font-medium">메모</th>
                </tr>
              </thead>
              <tbody>
                {iv.counterparts.map((c) => (
                  <tr key={c.id} className="border-b border-line/60 align-top last:border-0">
                    <td className="py-2.5 pr-3"><span className="font-medium">{c.name}</span> <span className="text-sub">{c.title}</span></td>
                    <td className="py-2.5 pr-3">{COUNTERPART_ROLE[c.role]}</td>
                    <td className="py-2.5 pr-3 text-sub">{[c.phone, c.email].filter(Boolean).join(", ") || "없음"}</td>
                    <td className="py-2.5 text-sub">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Block>

      <Block label="Business" no={++no} title="고객 사업">
        <Rows
          rows={[
            ["업종", iv.business.industry],
            ["사업 형태", iv.business.model],
            ["보강할 마케팅 단계", stageLabels(iv.business.funnel).join(", ") || iv.business.stage],
            ["지역", iv.business.region],
            ["웹사이트", iv.business.website],
            ["운영 채널", iv.business.channels.join(", ")],
            ["사업 설명", iv.business.description],
          ]}
        />
      </Block>

      <Block label="Needs" no={++no} title="원하는 일">
        <Rows
          rows={[
            ["목표", iv.needs.goals.join(", ")],
            ["타겟 고객", iv.needs.targets.join(", ")],
            ["해 보고 싶은 채널", iv.needs.wantChannels.join(", ")],
            ["계약 기간", iv.needs.period],
            ["제약 조건", iv.needs.constraints.join(", ")],
            ["지금 겪는 문제", iv.needs.pains],
            ["바라는 결과", iv.needs.wish],
            ["시작 시점", iv.needs.timeline],
            ["월 예산", iv.needs.budget],
            ["결정 시점", iv.needs.decisionBy],
          ]}
        />
      </Block>

      <Block label="What we do" no={++no} title="플랜더가 할 수 있는 일">
        {est.lines.length === 0 ? (
          <p className="text-sm text-mute">고른 항목이 없습니다.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-sub">
                    <th className="py-2 pr-3 font-medium">항목</th>
                    <th className="py-2 pr-3 font-medium">메모</th>
                    <th className="py-2 pr-3 text-right font-medium">단가 x 수량</th>
                    <th className="py-2 text-right font-medium">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {est.lines.map((l) => (
                    <tr key={l.item.id} className="border-b border-line/60 align-top last:border-0">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{l.name}</span>
                        {l.tierName && <span className="ml-1.5 text-xs text-sub">{l.tierName}</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-sub">{l.item.note}</td>
                      <td className="num py-2.5 pr-3 text-right text-sub">{l.consult ? "별도 상담" : `${won(l.price)} x ${l.qty}${l.unit}`}</td>
                      <td className="num py-2.5 text-right">{l.consult ? "상담 후" : won(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="num ml-auto grid grid-cols-[auto_auto] gap-x-10 gap-y-1 text-sm">
              <dt className="text-sub">공급가액</dt><dd className="text-right">{won(est.supply)}</dd>
              <dt className="text-sub">부가세 10%</dt><dd className="text-right">{won(est.vat)}</dd>
              <dt className="font-semibold">합계</dt><dd className="text-right font-semibold">{won(est.total)}</dd>
            </dl>
          </>
        )}
      </Block>

      <Block label="Partners" no={++no} title="외부 협력이 필요한 일">
        {iv.partnerItems.length === 0 ? (
          <p className="text-sm text-mute">외부 협력 항목이 없습니다.</p>
        ) : (
          <ul className="grid gap-2">
            {iv.partnerItems.map((x) => (
              <li key={x.id} className="tile flex flex-wrap items-baseline gap-x-4 gap-y-1 p-3 text-[14px]">
                <span className="font-medium">{x.title || "제목 없음"}</span>
                <span className="text-sub">{[x.field, x.partner || "협력사 미정"].filter(Boolean).join(", ")}</span>
                <span className="chip">{PARTNER_STATUS[x.status]}</span>
                <span className="num ml-auto">{x.cost != null ? won(x.cost) : "비용 미정"}</span>
                {x.note && <span className="w-full text-sub">{x.note}</span>}
              </li>
            ))}
            {partnerTotal > 0 && <li className="num text-right text-sm text-sub">협력 예상 비용 합계 {won(partnerTotal)}</li>}
          </ul>
        )}
      </Block>

      <Block label="Sharing" no={++no} title="공유와 의뢰 전환">
        <Rows
          rows={[
            ["내부 공유 범위", `${SCOPE_META[iv.internalScope].label}. ${SCOPE_META[iv.internalScope].desc}`],
            ["외부 공유", iv.shareEnabled ? `켜져 있습니다. 고객에게 보이는 항목은 ${sharedOn.map((k) => SHARE_SECTION_LABEL[k]).join(", ") || "없습니다"}${sharedOn.length ? "입니다" : ""}.` : "꺼져 있습니다."],
            ["전환 준비", r.done === r.total ? "모두 확인했습니다." : `${r.total}개 중 ${r.done}개를 확인했습니다. 남은 것은 ${r.items.filter((x) => !x.ok).map((x) => x.label).join(", ")}입니다.`],
            ["의뢰 전환", iv.projectId ? `${iv.convertedAt?.slice(0, 10) ?? ""}에 전환했습니다.` : "아직 전환하지 않았습니다."],
          ]}
        />
        {iv.projectId && WORKS_URL && (
          <a className="btn btn-sm w-fit" href={`${WORKS_URL}/projects/${iv.projectId}`} target="_blank" rel="noreferrer">웍스 프로젝트 열기</a>
        )}
      </Block>
    </div>
  );
}
