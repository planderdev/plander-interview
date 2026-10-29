"use client";

import { useRef } from "react";

import { setMockUserAction } from "@/app/mock-actions";
import { ROLE_LABEL } from "@/lib/options";
import type { Member } from "@/lib/types";

/** 목업 모드 전용. 역할마다 보이는 인터뷰(내부 공유 범위)를 확인할 때 씁니다. */
export function MockUserSwitch({ me, members }: { me: Member; members: Member[] }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setMockUserAction} className="flex items-center gap-2">
      <label htmlFor="mockUser" className="hidden text-xs text-sub sm:inline">보는 사람</label>
      <select
        id="mockUser"
        name="mockUser"
        className="field w-auto py-1.5 text-[13px]"
        defaultValue={me.id}
        onChange={() => form.current?.requestSubmit()}
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({ROLE_LABEL[m.role]})
          </option>
        ))}
      </select>
    </form>
  );
}
