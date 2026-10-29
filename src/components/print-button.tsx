"use client";

/** 브라우저 인쇄 창을 엽니다. 인쇄 창에서 "PDF로 저장"을 고르면 PDF 파일이 됩니다. */
export function PrintButton({ label = "인쇄 또는 PDF 저장", className = "" }: { label?: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {label}
    </button>
  );
}
