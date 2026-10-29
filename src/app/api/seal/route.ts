import { isPdfUnlocked, sealBytes } from "@/lib/seal";

export const dynamic = "force-dynamic";

/** 직인 이미지. PDF 잠금을 푼 사람에게만 내려 줍니다. */
export async function GET() {
  if (!(await isPdfUnlocked())) return new Response("PDF 비밀번호를 먼저 입력해 주세요.", { status: 403 });
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
