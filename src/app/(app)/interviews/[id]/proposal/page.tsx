import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Crumbs } from "@/components/crumbs";
import { PrintButton } from "@/components/print-button";
import { readiness } from "@/lib/access";
import { CATALOG, CATALOG_ITEM } from "@/lib/catalog";
import { estimate, won, type EstimateLine } from "@/lib/estimate";
import { STAGES, STAGE_FIT, STAGE_REASON, type Stage, type StageKey } from "@/lib/funnel";
import { PARTNER_STATUS, ROLE_LABEL } from "@/lib/options";
import { kstToday, koDate } from "@/lib/quote";
import { getInterview, getMe, listMembers } from "@/lib/store";

export const metadata: Metadata = { title: "전략 제안서", robots: { index: false, follow: false } };

/*
 * 내부용 전략 제안서. 인터뷰 기록만으로 만듭니다. 새로 지어낸 수치나 약속은 넣지 않습니다.
 * 문서는 회사 사이트 기준(종이, 잉크, 섹션 머리 선과 영문 라벨)으로 그리고 A4 로 인쇄됩니다.
 */

const C = { paper: "#F1F2F6", ink: "#0B0B0D", soft: "#5C5F68", line: "rgba(11,11,13,.14)" };

/** 마지막 글자의 받침에 맞는 조사 */
function josa(word: string, withBatchim: string, without: string): string {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return word + without;
  return word + (code % 28 ? withBatchim : without);
}

/** 한국어 목록: 두 개는 "A와 B", 세 개 이상은 "A, B와 C" */
function listKo(items: string[]): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] ?? "";
  const head = xs.slice(0, -1).join(", ");
  return `${josa(head, "과", "와")} ${xs[xs.length - 1]}`;
}

const MONTHLY_UNITS = ["개월", "월", "채널/월", "키워드/월"];
function isMonthly(l: EstimateLine): boolean {
  if (l.item.catalogId === "custom") return MONTHLY_UNITS.includes(l.unit);
  const t = CATALOG_ITEM[l.item.catalogId]?.tiers[l.item.tier];
  return Boolean(t?.m) || MONTHLY_UNITS.includes(l.unit);
}

/** "100~300만 원" 같은 월 예산 선택지에서 상한(원) */
function budgetCap(b: string): number | null {
  const m = /([\d,]+)만 원(?! 이상)/.exec(b.split("~").pop() ?? "");
  if (!m || b.includes("이상")) return null;
  return Number(m[1].replace(/,/g, "")) * 10000;
}

function Block({ label, no, title, children, breakBefore }: { label: string; no: number; title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <section className={`grid gap-5 border-t pt-5 ${breakBefore ? "print-break" : ""}`} style={{ borderColor: C.line }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.soft }}>{label}</span>
        <span className="font-mono text-[12px] tracking-[0.06em]" style={{ color: C.soft }}>{String(no).padStart(2, "0")}</span>
      </div>
      <h2 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.035em] sm:text-[26px]">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-[1.8]">{children}</p>;
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="whitespace-pre-line border-l-2 pl-4 text-[15px] leading-[1.8]" style={{ borderColor: C.ink }}>
      {children}
    </blockquote>
  );
}

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  const iv = await getInterview(me, id);
  if (!iv) notFound();
  const members = await listMembers();
  const nameOf = (uid: string) => members.find((m) => m.id === uid)?.name ?? "담당자 미정";
  const author = members.find((m) => m.id === iv.createdBy);

  const client = iv.clientName.trim() || "고객사";
  const b = iv.business;
  const n = iv.needs;
  const est = estimate(iv.planderItems);
  const r = readiness(iv);

  // 단계별로 고른 항목. 항목은 주 단계(추천 단계의 첫째)에 놓습니다.
  const primaryOf = (catalogId: string): StageKey | null => STAGE_FIT[catalogId]?.[0] ?? null;
  const linesByStage = new Map<StageKey, EstimateLine[]>();
  const unstaged: EstimateLine[] = [];
  for (const l of est.lines) {
    const k = primaryOf(l.item.catalogId);
    if (!k) unstaged.push(l);
    else linesByStage.set(k, [...(linesByStage.get(k) ?? []), l]);
  }
  const wanted = STAGES.filter((s) => b.funnel.includes(s.key));
  const focus: Stage[] = wanted.length ? wanted : STAGES.filter((s) => linesByStage.has(s.key));
  const others = STAGES.filter((s) => !focus.includes(s) && linesByStage.has(s.key));
  const emptyWanted = wanted.filter((s) => !(linesByStage.get(s.key)?.length));

  // 비어 있는 단계에 넣어 볼 만한 상품 (제약 조건에 걸리는 상품은 뺍니다)
  const blocked = new Set(n.constraints.includes("가격비교 작업 불가") ? ["trafficSlot"] : []);
  const chosen = new Set(iv.planderItems.map((i) => i.catalogId));
  const suggest = (k: StageKey) =>
    CATALOG.flatMap((c) => c.items)
      .filter((i) => STAGE_FIT[i.id]?.[0] === k && !chosen.has(i.id) && !blocked.has(i.id))
      .slice(0, 3);

  const months = Number(/(\d+)개월/.exec(n.period)?.[1] ?? 0) || 0;
  const setupLines = est.lines.filter((l) => !isMonthly(l));
  const monthlyLines = est.lines.filter(isMonthly);
  const cap = budgetCap(n.budget);
  const partnerTotal = iv.partnerItems.reduce((s, x) => s + (x.cost ?? 0), 0);

  const stageSubtotal = (k: StageKey) => (linesByStage.get(k) ?? []).reduce((s, l) => s + l.amount, 0);

  const introBits: string[] = [];
  if (b.industry || b.region) {
    introBits.push(
      `${josa(client, "은", "는")} ${b.region ? `${b.region}에서 ` : ""}${b.industry ? `${b.industry} 업종의 ` : ""}${b.model ? `${b.model} ` : ""}사업을 하고 있습니다.`,
    );
  }
  if (b.channels.length) introBits.push(`지금 운영 중인 채널은 ${listKo(b.channels)}입니다.`);
  if (n.targets.length) introBits.push(`주요 고객은 ${listKo(n.targets)}입니다.`);
  if (n.goals.length) introBits.push(`이번 미팅에서 고객이 가장 원한 것은 ${listKo(n.goals)}입니다.`);

  let no = 0;

  return (
    <div className="grid gap-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Crumbs items={[{ label: "인터뷰 목록", href: "/interviews" }, { label: iv.title || "제목 없는 인터뷰", href: `/interviews/${iv.id}` }, { label: "전략 제안서" }]} />
        <span className="text-xs text-mute">내부 검토용 문서입니다. 인터뷰를 고치면 이 문서도 바로 바뀝니다.</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link className="btn btn-sm" href={`/interviews/${iv.id}`}>인터뷰로 돌아가기</Link>
          <Link className="btn btn-sm" href={`/interviews/${iv.id}/quote`}>견적서 보기</Link>
          <PrintButton className="btn btn-sm btn-primary" />
        </div>
      </div>

      <article className="print-plain print-doc rounded-[6px] px-5 py-8 sm:px-12 sm:py-12" style={{ background: C.paper, color: C.ink, colorScheme: "light" }}>
        <div className="mx-auto grid max-w-[820px] gap-12">
          <header className="grid gap-8">
            <div className="flex items-center justify-between">
              <span className="wordmark text-[24px]" style={{ color: C.ink }} role="img" aria-label="PLANDER" />
              <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.soft }}>Strategy proposal</span>
            </div>
            <div className="grid gap-4">
              <span className="w-fit rounded-full border px-3 py-1 text-[12px]" style={{ borderColor: C.line, color: C.soft }}>내부 검토용</span>
              <h1 className="text-[34px] font-semibold leading-[1.14] tracking-[-0.045em] sm:text-[48px]">
                {client}
                <br /> 마케팅 전략 제안서
              </h1>
              <p className="text-[15px] leading-[1.7]" style={{ color: C.soft }}>
                {iv.heldAt ? `${koDate(iv.heldAt.slice(0, 10))}에 나눈 미팅` : "미팅"} 내용을 바탕으로 정리했습니다. 작성자는{" "}
                {author ? `${author.name} ${author.position || ROLE_LABEL[author.role]}` : "담당자"}이고, {koDate(kstToday())}에 정리했습니다.
              </p>
            </div>
          </header>

          <Block label="Understanding" no={++no} title="고객 이해">
            {introBits.length ? <P>{introBits.join(" ")}</P> : <P>고객 사업 정보가 아직 비어 있습니다. 인터뷰의 고객 사업 칸을 먼저 채워 주세요.</P>}
            {b.description && <P>{b.description}</P>}
            {n.pains && (
              <div className="grid gap-2">
                <P>고객이 말한 가장 큰 문제는 다음과 같습니다.</P>
                <Quote>{n.pains}</Quote>
              </div>
            )}
            {n.wish && (
              <div className="grid gap-2">
                <P>고객이 바라는 결과는 다음과 같습니다.</P>
                <Quote>{n.wish}</Quote>
              </div>
            )}
          </Block>

          <Block label="Diagnosis" no={++no} title="퍼널 진단">
            <P>
              {wanted.length
                ? `고객이 보강하고 싶은 단계는 ${listKo(wanted.map((s) => s.label))}입니다.`
                : "인터뷰에서 보강할 단계를 아직 고르지 않았습니다. 지금 고른 항목이 놓인 단계를 기준으로 정리했습니다."}{" "}
              {emptyWanted.length > 0 && `이 중 ${listKo(emptyWanted.map((s) => s.label))} 단계에는 아직 실행할 일이 없습니다.`}
            </P>
            <ol className="grid gap-2 sm:grid-cols-5">
              {STAGES.map((s, i) => {
                const count = linesByStage.get(s.key)?.length ?? 0;
                const want = b.funnel.includes(s.key);
                return (
                  <li
                    key={s.key}
                    className="print-avoid grid content-start gap-1 rounded-[14px] border p-3"
                    style={{ borderColor: want ? C.ink : C.line, background: want ? "#fff" : "transparent" }}
                  >
                    <span className="font-mono text-[11px]" style={{ color: C.soft }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[16px] font-semibold">{s.label}</span>
                    <span className="text-[12px]" style={{ color: C.soft }}>{s.metric}</span>
                    <span className="mt-2 text-[13px]">
                      {want
                        ? count
                          ? `보강할 단계입니다. 실행할 일이 ${count}개 있습니다.`
                          : "보강할 단계지만 아직 실행할 일이 없습니다."
                        : count
                          ? `실행할 일이 ${count}개 있습니다.`
                          : "이번에는 다루지 않습니다."}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Block>

          <Block label="Strategy" no={++no} title="단계별 전략" breakBefore>
            {focus.length === 0 && <P>고른 항목이 아직 없습니다. 인터뷰의 플랜더가 할 수 있는 일에서 항목을 고르면 전략이 채워집니다.</P>}
            {focus.map((s) => {
              const lines = linesByStage.get(s.key) ?? [];
              const recs = lines.length ? [] : suggest(s.key);
              return (
                <div key={s.key} className="print-avoid grid gap-3 rounded-[18px] border bg-white/60 p-5 sm:p-6" style={{ borderColor: C.line }}>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[19px] font-semibold tracking-[-0.03em]">{s.label} 단계</span>
                    <span className="text-[14px]" style={{ color: C.soft }}>{s.head}</span>
                  </div>
                  <P>{s.body}</P>
                  {lines.length > 0 ? (
                    <ul className="grid gap-3">
                      {lines.map((l) => (
                        <li key={l.item.id} className="grid gap-0.5">
                          <span className="text-[15px] font-semibold">
                            {l.name}
                            {l.tierName && <span className="ml-1.5 text-[13px] font-normal" style={{ color: C.soft }}>{l.tierName}</span>}
                          </span>
                          <span className="text-[14px] leading-[1.7]" style={{ color: C.soft }}>
                            {STAGE_REASON[l.item.catalogId] ?? l.desc}
                            {l.item.note && ` 미팅 메모: ${l.item.note}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="grid gap-2">
                      <P>이 단계에 고른 항목이 없습니다. 다음 상품을 검토해 보세요.</P>
                      <ul className="grid gap-1.5 text-[14px]">
                        {recs.map((x) => (
                          <li key={x.id}>
                            <span className="font-semibold">{x.name}</span>
                            <span style={{ color: C.soft }}> {STAGE_REASON[x.id] ?? x.tiers[0].desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
            {(others.length > 0 || unstaged.length > 0) && (
              <div className="grid gap-2">
                <P>보강 단계 밖에서 함께 진행할 일은 다음과 같습니다.</P>
                <ul className="grid gap-1.5 text-[14px]">
                  {others.flatMap((s) => (linesByStage.get(s.key) ?? []).map((l) => (
                    <li key={l.item.id}>
                      <span className="font-semibold">{l.name}</span>
                      <span style={{ color: C.soft }}> {s.label} 단계에서 씁니다. {STAGE_REASON[l.item.catalogId] ?? ""}</span>
                    </li>
                  )))}
                  {unstaged.map((l) => (
                    <li key={l.item.id}>
                      <span className="font-semibold">{l.name}</span>
                      <span style={{ color: C.soft }}> {l.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Block>

          <Block label="Plan" no={++no} title="실행 순서">
            <P>
              {months
                ? `계약 기간은 ${months}개월로 잡았습니다.`
                : "계약 기간을 아직 정하지 않았습니다. 아래 일정은 첫 달을 기준으로 적었습니다."}{" "}
              처음에는 세팅과 제작을 끝내고, 그다음부터 매달 반복하는 일을 운영합니다.
            </P>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="print-avoid grid content-start gap-2 rounded-[18px] border p-5" style={{ borderColor: C.line }}>
                <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.soft }}>Month 1</span>
                <span className="text-[16px] font-semibold">처음에 끝낼 세팅과 제작</span>
                {setupLines.length ? (
                  <ul className="grid gap-1 text-[14px]">
                    {setupLines.map((l) => <li key={l.item.id}>{l.name}{l.tierName && ` ${l.tierName}`}</li>)}
                  </ul>
                ) : (
                  <span className="text-[14px]" style={{ color: C.soft }}>해당하는 항목이 없습니다.</span>
                )}
              </div>
              <div className="print-avoid grid content-start gap-2 rounded-[18px] border p-5" style={{ borderColor: C.line }}>
                <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.soft }}>Every month</span>
                <span className="text-[16px] font-semibold">매달 반복하는 운영</span>
                {monthlyLines.length ? (
                  <ul className="grid gap-1 text-[14px]">
                    {monthlyLines.map((l) => <li key={l.item.id}>{l.name}{l.tierName && ` ${l.tierName}`}</li>)}
                  </ul>
                ) : (
                  <span className="text-[14px]" style={{ color: C.soft }}>해당하는 항목이 없습니다.</span>
                )}
              </div>
            </div>
            {n.timeline && <P>고객이 원하는 시작 시점은 {n.timeline}입니다.</P>}
          </Block>

          <Block label="Budget" no={++no} title="예산">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[14px]">
                <thead>
                  <tr className="border-b text-left text-[12px]" style={{ borderColor: C.ink, color: C.soft }}>
                    <th className="py-2 pr-3 font-medium">단계</th>
                    <th className="py-2 pr-3 font-medium">항목 수</th>
                    <th className="py-2 text-right font-medium">공급가</th>
                  </tr>
                </thead>
                <tbody>
                  {STAGES.filter((s) => linesByStage.has(s.key)).map((s) => (
                    <tr key={s.key} className="border-b" style={{ borderColor: C.line }}>
                      <td className="py-2.5 pr-3">{s.label}</td>
                      <td className="py-2.5 pr-3">{linesByStage.get(s.key)?.length}</td>
                      <td className="py-2.5 text-right tabular-nums">{won(stageSubtotal(s.key))}</td>
                    </tr>
                  ))}
                  {unstaged.length > 0 && (
                    <tr className="border-b" style={{ borderColor: C.line }}>
                      <td className="py-2.5 pr-3">직접 입력 항목</td>
                      <td className="py-2.5 pr-3">{unstaged.length}</td>
                      <td className="py-2.5 text-right tabular-nums">{won(unstaged.reduce((s, l) => s + l.amount, 0))}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto grid w-full max-w-sm grid-cols-[1fr_auto] gap-y-1.5 text-[14px]">
              <dt style={{ color: C.soft }}>공급가액</dt><dd className="text-right tabular-nums">{won(est.supply)}</dd>
              <dt style={{ color: C.soft }}>부가세 10%</dt><dd className="text-right tabular-nums">{won(est.vat)}</dd>
              <dt className="border-t pt-2 font-semibold" style={{ borderColor: C.ink }}>합계</dt>
              <dd className="border-t pt-2 text-right font-semibold tabular-nums" style={{ borderColor: C.ink }}>{won(est.total)}</dd>
              {partnerTotal > 0 && (
                <>
                  <dt style={{ color: C.soft }}>외부 협력 예상 비용</dt><dd className="text-right tabular-nums">{won(partnerTotal)}</dd>
                </>
              )}
            </dl>
            <P>
              {n.budget
                ? cap && months
                  ? `고객이 말한 월 예산은 ${n.budget}입니다. ${months}개월로 보면 예산 상한은 ${won(cap * months)}이고, 지금 고른 항목의 공급가는 ${won(est.supply)}입니다. ${est.supply > cap * months ? `예산보다 ${won(est.supply - cap * months)} 많으니 항목이나 수량을 줄이는 안을 함께 준비합니다.` : "예산 안에 들어옵니다."}`
                  : `고객이 말한 월 예산은 ${n.budget}입니다.`
                : "고객의 예산은 아직 듣지 못했습니다."}{" "}
              {est.lines.some((l) => l.consult) && "금액이 협의인 항목은 위 합계에 들어 있지 않습니다."}
              {n.constraints.includes("매체 광고비 집행 없음") && " 고객은 매체 광고비를 쓰지 않기로 했으니 광고 운영 항목은 다시 확인합니다."}
            </P>
          </Block>

          {iv.partnerItems.length > 0 && (
            <Block label="Partners" no={++no} title="외부 협력">
              <P>플랜더가 직접 하지 않고 협력사와 함께 해야 하는 일입니다.</P>
              <ul className="grid gap-2 text-[14px]">
                {iv.partnerItems.map((x) => (
                  <li key={x.id} className="print-avoid grid gap-0.5 rounded-[14px] border p-4" style={{ borderColor: C.line }}>
                    <span className="font-semibold">{x.title || "제목 없음"}</span>
                    <span style={{ color: C.soft }}>
                      {x.field ? `${x.field} 분야입니다. ` : ""}
                      {x.partner ? `협력사는 ${x.partner}입니다. ` : "협력사는 아직 정하지 않았습니다. "}
                      {x.cost != null ? `예상 비용은 ${won(x.cost)}입니다. ` : ""}
                      지금 상태는 {PARTNER_STATUS[x.status]}입니다.
                      {x.note && ` ${x.note}`}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          <Block label="Check" no={++no} title="확인할 것">
            {n.constraints.length > 0 && <P>고객이 정한 제약 조건은 {listKo(n.constraints)}입니다. 실행안은 이 조건을 지킵니다.</P>}
            {r.items.some((x) => !x.ok) ? (
              <div className="grid gap-2">
                <P>의뢰로 넘기기 전에 다음을 확인합니다.</P>
                <ul className="grid list-disc gap-1 pl-5 text-[14px]">
                  {r.items.filter((x) => !x.ok).map((x) => <li key={x.label}>{x.label}</li>)}
                </ul>
              </div>
            ) : (
              <P>의뢰 전환에 필요한 확인은 모두 끝났습니다.</P>
            )}
          </Block>

          <footer className="border-t pt-6 text-[12px] leading-[1.7]" style={{ borderColor: C.line, color: C.soft }}>
            이 문서는 플랜더 내부 검토용입니다. 고객에게는 고객 공유 페이지와 견적서를 보냅니다.
          </footer>
        </div>
      </article>
    </div>
  );
}
