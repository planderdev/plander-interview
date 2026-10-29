"use server";

import { unlockPdf } from "@/lib/seal";

/** 견적서 PDF 비밀번호 확인. 틀리면 잠깐 기다렸다 답해 연달아 맞혀 보기 어렵게 합니다. */
export async function unlockPdfAction(password: string): Promise<{ ok: boolean }> {
  const ok = await unlockPdf(String(password ?? ""));
  if (!ok) await new Promise((r) => setTimeout(r, 800));
  return { ok };
}
