import { sealBytes } from "@/lib/seal";

export const dynamic = "force-dynamic";

/** 직인 이미지. 견적서 화면에서 바로 보입니다. PDF로 뽑을 때만 비밀번호를 묻습니다. */
export async function GET() {
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
