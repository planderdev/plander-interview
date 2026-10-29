"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { MOCK_MEMBERS, MOCK_USER_COOKIE } from "@/lib/mock";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** 목업 모드에서 화면을 볼 사람을 바꿉니다. 실제 DB를 연결하면 아무것도 하지 않습니다. */
export async function setMockUserAction(form: FormData) {
  if (isSupabaseConfigured()) return;
  const id = String(form.get("mockUser") ?? "");
  if (!MOCK_MEMBERS.some((m) => m.id === id)) return;
  (await cookies()).set(MOCK_USER_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
}
