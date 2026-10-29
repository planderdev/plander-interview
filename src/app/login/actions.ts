"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(_: string | null, form: FormData): Promise<string | null> {
  const sb = await createSupabaseServerClient();
  if (!sb) redirect("/interviews");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "");
  if (!email || !password) return "이메일과 비밀번호를 입력해 주세요.";

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return "이메일 또는 비밀번호가 맞지 않습니다.";

  const { data: member } = await sb.from("pw_users").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!member || member.is_active === false) {
    await sb.auth.signOut();
    return "웍스 구성원 계정만 들어올 수 있습니다. 운영자에게 계정 활성화를 요청해 주세요.";
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/interviews");
}

export async function logoutAction() {
  const sb = await createSupabaseServerClient();
  if (sb) await sb.auth.signOut();
  redirect("/login");
}
