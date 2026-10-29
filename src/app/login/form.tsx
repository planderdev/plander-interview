"use client";

import { useActionState } from "react";

import { loginAction } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5">
        <span className="label">이메일</span>
        <input className="field" type="email" name="email" id="email" autoComplete="username" required />
      </label>
      <label className="grid gap-1.5">
        <span className="label">비밀번호</span>
        <input className="field" type="password" name="password" id="password" autoComplete="current-password" required />
      </label>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <button className="btn btn-primary mt-1" disabled={pending}>{pending ? "확인 중" : "로그인"}</button>
    </form>
  );
}
