"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { unlockPdfAction } from "@/app/pdf-actions";

/**
 * 견적서 PDF 뽑기. 비밀번호를 넣어야 인쇄 창이 열립니다. 직인은 화면에서도 보입니다.
 * 잠금을 풀면 30분 동안은 다시 묻지 않습니다.
 */
export function PdfButton({
  unlocked,
  configured,
  className = "",
  tone = "app",
}: {
  unlocked: boolean;
  configured: boolean;
  className?: string;
  /** app: 사내 화면, paper: 고객 화면(종이 바탕) */
  tone?: "app" | "paper";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const wantPrint = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  // 잠금이 풀린 화면이 다시 그려지면 직인 이미지를 다 받은 뒤 인쇄 창을 엽니다.
  useEffect(() => {
    if (!unlocked || !wantPrint.current) return;
    wantPrint.current = false;
    const seal = document.querySelector<HTMLImageElement>("img[data-seal]");
    const go = () => window.print();
    if (seal && !seal.complete) {
      seal.addEventListener("load", go, { once: true });
      seal.addEventListener("error", go, { once: true });
    } else go();
  }, [unlocked]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const r = await unlockPdfAction(pw);
      if (!r.ok) {
        setError("비밀번호가 맞지 않습니다.");
        return;
      }
      setPw("");
      setOpen(false);
      wantPrint.current = true;
      router.refresh();
    });
  }

  const field =
    tone === "paper"
      ? "rounded-full border border-[#0B0B0D]/20 bg-white px-4 py-2 text-[13px] text-[#0B0B0D] outline-none focus:border-[#0B0B0D]"
      : "field w-44 py-1.5 text-[13px]";
  const note = tone === "paper" ? "text-[12px] text-[#5C5F68]" : "text-xs text-sub";

  if (!configured) {
    return (
      <span className={note}>PDF 비밀번호가 아직 정해지지 않아 PDF로 뽑을 수 없습니다. 관리자에게 문의해 주세요.</span>
    );
  }

  if (unlocked) {
    return (
      <button type="button" className={className} onClick={() => window.print()}>
        PDF로 뽑기
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {open ? (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <label htmlFor="pdf-password" className="sr-only">PDF 비밀번호</label>
          <input
            ref={input}
            id="pdf-password"
            type="password"
            autoComplete="off"
            className={field}
            placeholder="PDF 비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button type="submit" className={className} disabled={pending || !pw}>
            {pending ? "확인 중" : "확인"}
          </button>
          <button type="button" className={note + " underline underline-offset-4"} onClick={() => setOpen(false)}>
            취소
          </button>
        </form>
      ) : (
        <button type="button" className={className} onClick={() => setOpen(true)}>
          PDF로 뽑기
        </button>
      )}
      {error && <span className={`${note} w-full text-right`} role="alert">{error}</span>}
    </div>
  );
}
