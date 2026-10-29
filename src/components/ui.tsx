"use client";

import type { ReactNode } from "react";

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
    <section id={id} className="card grid scroll-mt-24 gap-5 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id={`${id}-h`} className="section-title">
            <span className="num mr-2 text-sm text-mute">{String(no).padStart(2, "0")}</span>
            {title}
          </h2>
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
    <button type="button" className="btn btn-sm text-danger" onClick={onClick} aria-label={label} disabled={disabled}>
      삭제
    </button>
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);
