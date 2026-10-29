"use client";

import type { ReactNode } from "react";

/** 섹션 머리의 영문 라벨 (PLANDER 디자인 시스템: 11px, 자간 0.12em, 대문자) */
const SECTION_LABEL: Record<string, string> = {
  meeting: "Meeting",
  counterparts: "Counterpart",
  business: "Business",
  needs: "Needs",
  plander: "What we do",
  partners: "Partners",
  summary: "Summary",
  share: "Sharing",
  convert: "Conversion",
};

export function Section({
  id,
  no,
  title,
  desc,
  aside,
  children,
}: {
  id: string;
  no: number;
  title: string;
  desc?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="card grid scroll-mt-24 gap-5 p-5 sm:p-7" aria-labelledby={`${id}-h`}>
      {/* 섹션 머리: 영문 라벨과 번호, 아래 1px 선 */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="eyebrow">{SECTION_LABEL[id] ?? id}</span>
        <span className="index">{String(no).padStart(2, "0")}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id={`${id}-h`} className="section-title">{title}</h2>
          {desc && <p className="text-sm text-sub">{desc}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, children, wide }: { label: string; htmlFor?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`grid min-w-0 gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

/** 하나 또는 여러 개를 고르는 칩 */
export function Chips({
  options,
  value,
  onChange,
  multi,
  disabled,
  label,
}: {
  options: readonly string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const selected = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  function click(o: string) {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
    } else onChange(value === o ? "" : o);
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" className="toggle-chip" aria-pressed={selected(o)} onClick={() => click(o)} disabled={disabled}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function RemoveButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" className="btn btn-sm btn-danger" onClick={onClick} aria-label={label} disabled={disabled}>
      삭제
    </button>
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);
