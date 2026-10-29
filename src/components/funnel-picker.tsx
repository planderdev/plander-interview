"use client";

import { useRef } from "react";

import { STAGES } from "@/lib/funnel";

/**
 * 보강이 필요한 마케팅 퍼널 단계 (에임 퍼널 보드의 다섯 단계).
 * 단계마다 목표 지표와 짧은 설명을 함께 보여 줘 미팅 중에 고객에게 설명할 수 있게 합니다.
 */
export function FunnelPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const latest = useRef(value);
  latest.current = value;
  const toggle = (k: string) => {
    const cur = latest.current;
    const next = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
    latest.current = next;
    onChange(next);
  };
  return (
    <ol className="grid gap-2 sm:grid-cols-5" aria-label="마케팅 퍼널 단계">
      {STAGES.map((s, i) => {
        const on = value.includes(s.key);
        return (
          <li key={s.key} className="min-w-0">
            <button
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(s.key)}
              className={`grid h-full w-full content-start gap-1.5 rounded-xl border p-3 text-left transition-colors duration-300 ${
                on ? "border-ink bg-ink text-canvas" : "border-ink/15 hover:border-ink/45"
              }`}
            >
              <span className={`index ${on ? "text-canvas/60" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] font-semibold">{s.label}</span>
              <span className={`text-xs ${on ? "text-canvas/70" : "text-sub"}`}>{s.metric}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** 고른 단계의 설명. 미팅 중 고객에게 그대로 읽어 줄 수 있는 문장입니다. */
export function FunnelNotes({ value }: { value: string[] }) {
  const picked = STAGES.filter((s) => value.includes(s.key));
  if (!picked.length) {
    return <p className="text-xs text-mute">고객의 마케팅이 지금 어느 단계에서 막혀 있는지 고릅니다. 여러 단계를 고를 수 있습니다.</p>;
  }
  return (
    <ul className="grid gap-1.5 text-sm">
      {picked.map((s) => (
        <li key={s.key} className="text-sub">
          <span className="font-medium text-ink">{s.label} 단계.</span> {s.body}
        </li>
      ))}
    </ul>
  );
}
