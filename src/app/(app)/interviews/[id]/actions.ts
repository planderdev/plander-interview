"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { convertInterview, deleteInterview, getMe, saveInterview, setShare, type ConvertInput } from "@/lib/store";
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

export async function saveAction(next: Interview) {
  return run(async () => {
    const r = await saveInterview(await requireMe(), next);
    revalidatePath("/interviews");
    return r;
  });
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

export async function deleteAction(id: string) {
  await deleteInterview(await requireMe(), id);
  revalidatePath("/interviews");
  redirect("/interviews");
}
