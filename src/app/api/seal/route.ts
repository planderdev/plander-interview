import { sealBytes } from "@/lib/seal";
import { getMe, getShared } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * 직인 이미지. 견적서 화면에서 바로 보이고, PDF로 뽑을 때만 비밀번호를 묻습니다.
 * 로그인한 웍스 구성원이거나, 예상 금액을 공유 중인 고객 링크(?s=토큰)로 들어온 경우에만 내려 줍니다.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("s");
  const allowed = token ? Boolean((await getShared(token))?.quote) : Boolean(await getMe());
  if (!allowed) return new Response("직인 이미지를 볼 수 없습니다.", { status: 403 });
  const png = sealBytes();
  if (!png) return new Response("직인 이미지가 없습니다.", { status: 404 });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
