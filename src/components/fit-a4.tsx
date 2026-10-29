"use client";

import { useEffect } from "react";

/**
 * 인쇄할 때 견적서를 A4 한 장에 맞춥니다.
 * 인쇄 직전에 A4 폭(210mm, 안쪽 여백 10mm 포함)으로 다시 재고, 높이가 297mm 를 넘으면 그만큼 줄입니다.
 * 인쇄 버튼과 Cmd+P 모두에서 동작합니다.
 */
const MM = 96 / 25.4;
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;

export function FitA4({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = () => document.getElementById(targetId);
    function before() {
      const node = el();
      if (!node) return;
      node.style.zoom = "1";
      node.style.width = `${PAGE_W}px`;
      node.style.maxWidth = `${PAGE_W}px`;
      node.classList.add("printing");
      const h = node.scrollHeight;
      // 너무 작아져 읽기 어려워지지 않게 50% 밑으로는 줄이지 않습니다. 그보다 길면 다음 장으로 넘어갑니다.
      const z = h > PAGE_H ? Math.max(0.5, (PAGE_H - 4) / h) : 1;
      node.style.zoom = String(z);
    }
    function after() {
      const node = el();
      if (!node) return;
      node.style.zoom = "";
      node.style.width = "";
      node.style.maxWidth = "";
      node.classList.remove("printing");
    }
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [targetId]);
  return null;
}
