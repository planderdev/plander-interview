"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  convertInterview,
  deleteInterview,
  getClientHistory,
  getMe,
  saveInterview,
  SaveConflictError,
  setShare,
  type ConvertInput,
} from "@/lib/store";
import type { Interview } from "@/lib/types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "알 수 없는 오류가 났습니다." };
  }
}

async function requireMe() {
  const me = await getMe();
  if (!me) throw new Error("다시 로그인해 주세요.");
  return me;
}

/** baseUpdatedAt 이 null 이면 다른 사람의 변경을 덮어씁니다. 충돌이면 conflict: true 를 돌려줍니다. */
export async function saveAction(next: Interview, baseUpdatedAt: string | null) {
  try {
    const r = await saveInterview(await requireMe(), next, baseUpdatedAt);
    revalidatePath("/interviews");
    return { ok: true as const, data: r };
  } catch (e) {
    if (e instanceof SaveConflictError) return { ok: false as const, error: e.message, conflict: true };
    return { ok: false as const, error: e instanceof Error ? e.message : "알 수 없는 오류가 났습니다.", conflict: false };
  }
}

export async function shareAction(id: string, enabled: boolean) {
  return run(async () => {
    const token = await setShare(await requireMe(), id, enabled);
    revalidatePath(`/interviews/${id}`);
    return token;
  });
}

export async function convertAction(input: ConvertInput) {
  return run(async () => {
    if (!input.title.trim()) throw new Error("프로젝트 제목을 입력해 주세요.");
    const r = await convertInterview(await requireMe(), { ...input, title: input.title.trim() });
    revalidatePath("/interviews");
    revalidatePath(`/interviews/${input.id}`);
    return r;
  });
}

/** 불러온 웍스 고객의 지난 프로젝트와 인터뷰 */
export async function clientHistoryAction(clientId: string, interviewId: string) {
  return run(async () => getClientHistory(await requireMe(), clientId, interviewId));
}

export async function deleteAction(id: string) {
  await deleteInterview(await requireMe(), id);
  revalidatePath("/interviews");
  redirect("/interviews");
}
