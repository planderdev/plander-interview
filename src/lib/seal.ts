import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { cookies } from "next/headers";

/*
 * 견적서 PDF 잠금과 직인.
 *
 * - PDF 로 뽑으려면 비밀번호(QUOTE_PDF_PASSWORD)를 넣어야 합니다. 맞으면 30분 동안 쓸 수 있는 쿠키를 줍니다.
 * - 직인 이미지는 공개 폴더에 두지 않고, 잠금을 푼 사람에게만 /api/seal 로 내려 줍니다.
 *   배포에서는 환경 변수 SEAL_PNG_BASE64, 로컬에서는 private/plander-seal.png 를 씁니다(둘 다 git 에 없음).
 * - 비밀번호를 바꾸면 이미 받은 쿠키도 바로 무효가 됩니다.
 */

export const SEAL_SRC = "/api/seal";
const COOKIE = "pi_pdf";
const TTL_SECONDS = 30 * 60;

function password(): string {
  return process.env.QUOTE_PDF_PASSWORD ?? "";
}

export function pdfPasswordConfigured(): boolean {
  return password().length > 0;
}

function sign(exp: number): string {
  return crypto.createHmac("sha256", password()).update(`pi-pdf:${exp}`).digest("base64url");
}

function sameText(a: string, b: string): boolean {
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
}

/** 비밀번호가 맞으면 잠금 해제 쿠키를 넣습니다. */
export async function unlockPdf(input: string): Promise<boolean> {
  if (!pdfPasswordConfigured() || !sameText(input, password())) return false;
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
  return true;
}

export async function isPdfUnlocked(): Promise<boolean> {
  if (!pdfPasswordConfigured()) return false;
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const [expText, sig] = raw.split(".");
  const exp = Number(expText);
  if (!exp || !sig || exp < Date.now() / 1000) return false;
  return sameText(sig, sign(exp));
}

/** 직인 PNG. 없으면 null */
export function sealBytes(): Buffer | null {
  const env = process.env.SEAL_PNG_BASE64;
  if (env) {
    try {
      return Buffer.from(env, "base64");
    } catch {
      return null;
    }
  }
  try {
    return fs.readFileSync(path.join(process.cwd(), "private", "plander-seal.png"));
  } catch {
    return null;
  }
}

export function sealAvailable(): boolean {
  return sealBytes() !== null;
}
