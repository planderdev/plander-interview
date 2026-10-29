import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { estimate, won } from "@/lib/estimate";
import { stageLabels } from "@/lib/funnel";
import { getShared } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "미팅 정리", robots: { index: false, follow: false } };

/*
 * 고객 공유 페이지. 고객이 보는 화면이라 회사 사이트(plander.io) 기준을 따릅니다.
 * 종이 #F1F2F6 바탕, 잉크 #0B0B0D 글, 보조 글 #5C5F68, 구분선 rgba(11,11,13,.14).
 * 종이 위에서는 프리즘을 글자색으로 쓰지 않고 잉크가 강조색입니다.
 * 제목 Satoshi, 본문 General Sans, 숫자 Switzer (한글은 시스템 고딕).
 */
const C = {
  paper: "#F1F2F6",
  ink: "#0B0B0D",
  soft: "#5C5F68",
  line: "rgba(11,11,13,.14)",
};
const display = { fontFamily: '"Satoshi", "Helvetica Neue", Helvetica, Arial, "Apple SD Gothic Neo", sans-serif' };
const body = { fontFamily: '"General Sans", "Helvetica Neue", Helvetica, Arial, "Apple SD Gothic Neo", sans-serif' };
const hero = { fontFamily: '"Switzer", "Satoshi", "Helvetica Neue", Arial, sans-serif' };

/** 섹션 머리: 위 1px 선 + 영문 라벨과 번호 */
function Block({ label, no, title, children }: { label: string; no: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t pt-5" style={{ borderColor: C.line }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.soft }}>{label}</span>
        <span className="font-mono text-[12px] tracking-[0.06em]" style={{ color: C.soft }}>{String(no).padStart(2, "0")}</span>
      </div>
      <h2 className="text-[22px] font-medium leading-[1.25] tracking-[-0.035em] sm:text-[26px]" style={display}>{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  const list = rows.filter(([, v]) => v.trim());
  if (!list.length) return null;
  return (
    <dl className="grid gap-x-8 gap-y-3 text-[15px] leading-[1.65] sm:grid-cols-[9rem_minmax(0,1fr)]">
      {list.map(([k, v]) => (
        <div key={k} className="contents">
          <dt style={{ color: C.soft }}>{k}</dt>
          <dd className="whitespace-pre-line">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await getShared(token);
  if (!s) notFound();

  const est = s.planderItems ? estimate(s.planderItems) : null;
  const showPrice = s.sections.estimate;
  const showItems = Boolean(est && est.lines.length > 0 && (s.sections.plander || showPrice));
  const actions = (s.nextActions ?? []).filter((a) => a.text.trim());
  const date = s.heldAt ? s.heldAt.slice(0, 10).replace(/-/g, ".") : "";
  let no = 0;

  return (
    <div className="min-h-dvh" style={{ background: C.paper, color: C.ink, colorScheme: "light", ...body }}>
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&f[]=general-sans@400,500&f[]=switzer@500&display=swap"
      />
      <div className="mx-auto grid max-w-[880px] gap-14 px-6 pb-20 pt-8 sm:px-10 sm:pt-10">
        <header className="flex items-center justify-between">
          <span className="wordmark text-[24px] sm:text-[30px]" style={{ color: C.ink }} role="img" aria-label="PLANDER" />
          <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.soft }}>Meeting note</span>
        </header>

        <div className="grid gap-5">
          <h1 className="text-[34px] font-medium leading-[1.14] tracking-[-0.045em] sm:text-[52px]" style={display}>
            {s.clientName ? (
              <>
                {s.clientName},<br /> 함께 나눈 이야기
              </>
            ) : (
              s.title
            )}
          </h1>
          <p className="text-[15px] leading-[1.65] sm:text-[17px]" style={{ color: C.soft }}>
            {date && <span style={hero}>{date}</span>}
            {date && s.counterpartNames.length > 0 && ", "}
            {s.counterpartNames.length > 0 && `${s.counterpartNames.join(", ")}님과 미팅했습니다.`}
            {" "}들려주신 이야기와 플랜더가 함께할 일을 정리했습니다.
          </p>
        </div>

        {s.sections.summary && (
          <Block label="Summary" no={++no} title="미팅 정리">
            <p className="whitespace-pre-line text-[16px] leading-[1.75] sm:text-[17px]">
              {s.summary?.trim() || "정리 내용을 준비하고 있습니다."}
            </p>
          </Block>
        )}

        {s.needs && (
          <Block label="Needs" no={++no} title="원하시는 일">
            <Rows
              rows={[
                ["목표", s.needs.goals.join(", ")],
                ["해 보고 싶은 채널", (s.needs.wantChannels ?? []).join(", ")],
                ["지금 겪는 문제", s.needs.pains],
                ["바라는 결과", s.needs.wish],
                ["시작 시점", s.needs.timeline],
              ]}
            />
          </Block>
        )}

        {s.business && (
          <Block label="Business" no={++no} title="사업 정보">
            <Rows
              rows={[
                ["업종", s.business.industry],
                ["보강할 마케팅 단계", stageLabels(s.business.funnel ?? []).join(", ")],
                ["지역", s.business.region],
                ["운영 채널", s.business.channels.join(", ")],
                ["사업 설명", s.business.description],
              ]}
            />
          </Block>
        )}

        {showItems && est && (
          <Block label="What we do" no={++no} title={showPrice ? "플랜더가 함께할 일과 예상 금액" : "플랜더가 함께할 일"}>
            <ul className="grid gap-3">
              {est.lines.map((l) => (
                <li
                  key={l.item.id}
                  className="grid gap-2 rounded-[18px] border bg-white/60 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
                  style={{ borderColor: C.line }}
                >
                  <div className="grid gap-1">
                    <span className="text-[17px] font-medium tracking-[-0.02em]" style={display}>
                      {l.name}
                      {l.tierName && <span className="ml-2 text-[13px] font-normal" style={{ color: C.soft }}>{l.tierName}</span>}
                    </span>
                    <span className="text-[14px] leading-[1.65]" style={{ color: C.soft }}>{l.desc}</span>
                    {l.item.note && l.item.catalogId !== "custom" && <span className="text-[14px] leading-[1.65]">{l.item.note}</span>}
                  </div>
                  {showPrice && (
                    <div className="text-left sm:text-right" style={hero}>
                      {l.consult ? (
                        <span className="text-[14px]" style={{ ...body, color: C.soft }}>상담 후 확정</span>
                      ) : (
                        <>
                          <div className="text-[19px] tabular-nums tracking-[-0.03em]">{won(l.amount)}</div>
                          <div className="text-[12px] tabular-nums" style={{ color: C.soft }}>
                            {won(l.price)} x {l.qty.toLocaleString("ko-KR")}{l.unit}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {showPrice && (
              <div className="grid gap-4 rounded-[18px] p-6" style={{ background: C.ink, color: "#F3F2EE" }}>
                <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[14px]">
                  <dt style={{ color: "#A6A6A6" }}>공급가액</dt>
                  <dd className="text-right tabular-nums" style={hero}>{won(est.supply)}</dd>
                  <dt style={{ color: "#A6A6A6" }}>부가세 10%</dt>
                  <dd className="text-right tabular-nums" style={hero}>{won(est.vat)}</dd>
                </dl>
                <div className="flex items-end justify-between border-t pt-4" style={{ borderColor: "rgba(255,255,255,.14)" }}>
                  <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "#A6A6A6" }}>Total</span>
                  <span className="text-[30px] tabular-nums leading-none tracking-[-0.05em] sm:text-[38px]" style={hero}>{won(est.total)}</span>
                </div>
              </div>
            )}
            {showPrice && (
              <p className="text-[13px] leading-[1.65]" style={{ color: C.soft }}>
                플랜더 단가표를 기준으로 계산한 예상 금액입니다. 광고 매체비는 포함하지 않으며, 범위와 금액은 상담 후 함께 확정합니다.
              </p>
            )}
          </Block>
        )}

        {actions.length > 0 && (
          <Block label="Next" no={++no} title="다음 단계">
            <ol className="grid gap-3">
              {actions.map((a, i) => (
                <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-2 text-[15px] leading-[1.65]">
                  <span className="font-mono text-[12px] tracking-[0.06em]" style={{ color: C.soft }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {a.text}
                    {a.due && <span className="ml-2 text-[13px]" style={{ color: C.soft }}>{a.due.replace(/-/g, ".")}까지</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Block>
        )}

        <footer className="grid gap-6 border-t pt-6 text-[13px] leading-[1.7]" style={{ borderColor: C.line, color: C.soft }}>
          <p className="text-[18px] font-medium tracking-[-0.03em]" style={{ ...display, color: C.ink }}>
            함께 만들고, 함께 키웁니다.
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            <div className="grid">
              <span>주식회사 플랜더</span>
              <span>대표 이동욱</span>
              <span>contact@plander.io</span>
            </div>
            <div className="grid sm:text-right">
              <span>마지막 수정 <span style={hero}>{s.updatedAt.slice(0, 10).replace(/-/g, ".")}</span></span>
              <span>이 페이지는 미팅에 함께한 분께만 공유됩니다.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
