import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

/** 서버 컴포넌트, 서버 액션용 클라이언트. 환경 변수가 없으면 null (목업 모드) */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서 호출되면 무시합니다. 세션 갱신은 미들웨어가 합니다.
        }
      },
    },
  });
}
