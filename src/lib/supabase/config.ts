/**
 * 플랜더 웍스와 같은 Supabase 프로젝트를 씁니다.
 * pi_ 접두사 = 이 앱(인터뷰) 소유. pw_ 는 웍스 소유라 읽기와 의뢰 전환 함수로만 다룹니다.
 */
export const TABLES = {
  interviews: "pi_interviews",
  users: "pw_users",
  clients: "pw_clients",
} as const;

export const RPC = {
  shared: "pi_shared_interview",
  convert: "pi_convert_interview",
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const WORKS_URL = (process.env.NEXT_PUBLIC_WORKS_URL ?? "").replace(/\/$/, "");
