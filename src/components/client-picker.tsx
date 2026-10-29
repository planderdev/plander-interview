"use client";

import { useEffect, useMemo, useState } from "react";

import { clientHistoryAction } from "@/app/(app)/interviews/[id]/actions";
import { STATUS_META } from "@/lib/options";
import type { ClientHistory, ClientOption, InterviewStatus } from "@/lib/types";

const PROJECT_STATUS: Record<string, string> = {
  waiting: "대기",
  in_progress: "진행중",
  feedback: "피드백중",
  review: "검수중",
  completed: "완료",
  paused: "보류",
};

const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();

/**
 * 플랜더웍스에 등록된 고객 불러오기.
 * 기존 고객이면 고객사 이름, 업종, 연락처를 채우고 지난 프로젝트와 인터뷰를 보여 줍니다.
 */
export function ClientPicker({
  interviewId,
  clientId,
  clientName,
  clients,
  worksUrl,
  readOnly,
  locked,
  onPick,
  onUnlink,
}: {
  interviewId: string;
  clientId: string | null;
  clientName: string;
  clients: ClientOption[];
  worksUrl: string;
  readOnly: boolean;
  /** 의뢰 전환 뒤에는 바꾸지 않습니다 */
  locked: boolean;
  onPick: (c: ClientOption) => void;
  onUnlink: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<ClientHistory | null>(null);
  const [historyError, setHistoryError] = useState("");
  const linked = clientId ? clients.find((c) => c.id === clientId) ?? null : null;

  useEffect(() => {
    setHistory(null);
    setHistoryError("");
    if (!clientId) return;
    let alive = true;
    clientHistoryAction(clientId, interviewId).then((r) => {
      if (!alive) return;
      if (r.ok) setHistory(r.data);
      else setHistoryError(r.error);
    });
    return () => {
      alive = false;
    };
  }, [clientId, interviewId]);

  const matches = useMemo(() => {
    const n = norm(q);
    const list = n
      ? clients.filter((c) => norm(`${c.name}${c.contactName}${c.industry}`).includes(n))
      : clients;
    return list.slice(0, 8);
  }, [clients, q]);

  // 고객사 이름이 웍스 고객과 같으면 연결을 권합니다.
  const suggestion = !clientId && clientName.trim() ? clients.find((c) => norm(c.name) === norm(clientName)) : undefined;

  if (linked) {
    return (
      <div className="tile grid gap-4 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="grid min-w-0 flex-1 gap-1">
            <span className="flex items-center gap-2 text-xs text-sub">
              <span className="dot text-success" aria-hidden />
              플랜더웍스 고객과 연결됨
            </span>
            <span className="text-[17px] font-semibold tracking-tight">{linked.name}</span>
            <span className="text-sm text-sub">
              {[linked.industry, linked.contactName && `담당 ${linked.contactName}`, linked.phone, linked.email].filter(Boolean).join(", ") ||
                "웍스에 등록된 연락처가 없습니다."}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {worksUrl && (
              <a className="btn btn-sm" href={`${worksUrl}/clients/${linked.id}`} target="_blank" rel="noreferrer">
                웍스에서 보기
              </a>
            )}
            {!readOnly && !locked && (
              <button type="button" className="btn btn-sm" onClick={onUnlink}>
                연결 해제
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div className="grid content-start gap-2">
            <span className="eyebrow">Projects</span>
            {!history && !historyError && <span className="text-sm text-mute">불러오는 중</span>}
            {historyError && <span className="text-sm text-danger">{historyError}</span>}
            {history && history.projects.length === 0 && <span className="text-sm text-mute">웍스에 진행한 프로젝트가 없습니다.</span>}
            {history && history.projects.length > 0 && (
              <ul className="grid gap-1.5 text-sm">
                {history.projects.map((p) => (
                  <li key={p.id} className="flex items-baseline gap-2">
                    <span className="chip shrink-0 px-2 py-0 text-[11px]">{PROJECT_STATUS[p.status] ?? p.status}</span>
                    {worksUrl ? (
                      <a className="text-link min-w-0 truncate" href={`${worksUrl}/projects/${p.id}`} target="_blank" rel="noreferrer">{p.title}</a>
                    ) : (
                      <span className="min-w-0 truncate">{p.title}</span>
                    )}
                    {p.endDate && <span className="num ml-auto shrink-0 text-xs text-mute">{p.endDate.slice(0, 7)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid content-start gap-2">
            <span className="eyebrow">Interviews</span>
            {history && history.interviews.length === 0 && <span className="text-sm text-mute">이 고객과의 다른 인터뷰가 없습니다.</span>}
            {history && history.interviews.length > 0 && (
              <ul className="grid gap-1.5 text-sm">
                {history.interviews.map((i) => (
                  <li key={i.id} className="flex items-baseline gap-2">
                    <span className="chip shrink-0 px-2 py-0 text-[11px]">{STATUS_META[i.status as InterviewStatus]?.label ?? i.status}</span>
                    <a className="text-link min-w-0 truncate" href={`/interviews/${i.id}`}>{i.title}</a>
                    {i.heldAt && <span className="num ml-auto shrink-0 text-xs text-mute">{i.heldAt.slice(0, 10)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (readOnly) return null;

  return (
    <div className="tile grid gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="font-medium">이미 함께하고 있는 고객인가요?</span>
          <span className="text-sm text-sub">
            플랜더웍스에 등록된 고객을 불러오면 이름, 업종, 연락처가 채워지고 지난 프로젝트를 함께 볼 수 있습니다. 신규 고객이면 아래에 바로 적으세요.
          </span>
        </div>
        <button type="button" className={`btn btn-sm ${open ? "" : "btn-primary"}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "닫기" : "웍스 고객 불러오기"}
        </button>
      </div>

      {suggestion && !open && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-sub">웍스에 같은 이름의 고객이 있습니다.</span>
          <button type="button" className="btn btn-sm" onClick={() => onPick(suggestion)}>
            {suggestion.name} 연결하기
          </button>
        </div>
      )}

      {open && (
        <div className="grid gap-2">
          <input
            className="field"
            id="client-search"
            autoFocus
            placeholder="고객사, 담당자, 업종으로 찾기"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="웍스 고객 찾기"
          />
          <ul className="grid gap-1" aria-label="웍스 고객 목록">
            {matches.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-300 hover:bg-ink/5"
                  onClick={() => {
                    onPick(c);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="truncate text-xs text-mute">
                      {[c.industry, c.contactName].filter(Boolean).join(", ") || "업종, 담당자 정보 없음"}
                    </span>
                  </span>
                  <span className="text-xs text-sub">불러오기</span>
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-3 text-sm text-sub">찾는 고객이 웍스에 없습니다. 신규 고객이면 닫고 아래에 적어 주세요.</li>
            )}
          </ul>
          {clients.length > 8 && !q && <p className="px-3 text-xs text-mute">전체 {clients.length}곳 중 8곳만 보입니다. 이름으로 찾아 주세요.</p>}
        </div>
      )}
    </div>
  );
}
