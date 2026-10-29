import "server-only";

import fs from "node:fs";
import path from "node:path";

/**
 * 견적서 직인 이미지. 공개 저장소라 git 에 올리지 않습니다(.gitignore).
 * 로컬에서는 public/brand/plander-seal.png 를 두면 나오고, 배포할 때는 같은 경로에 따로 넣어야 합니다.
 * 파일이 없으면 직인 없이 견적서를 그립니다.
 */
export const SEAL_SRC = "/brand/plander-seal.png";

export function hasSeal(): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", SEAL_SRC));
  } catch {
    return false;
  }
}
