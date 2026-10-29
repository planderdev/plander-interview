"use client";

import { useState } from "react";

/** 현재 주소(origin)에 path 를 붙여 복사합니다. */
export function CopyButton({ path, label }: { path: string; label: string }) {
  const [done, setDone] = useState<"" | "ok" | "fail">("");
  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setDone("ok");
    } catch {
      window.prompt("링크를 복사해 주세요.", url);
      setDone("fail");
    }
    setTimeout(() => setDone(""), 2000);
  }
  return (
    <button type="button" className="btn btn-sm" onClick={copy}>
      {done === "ok" ? "복사했습니다" : label}
    </button>
  );
}
