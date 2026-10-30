import "server-only";

import { cache } from "react";

import { canEdit, canView, toShared } from "./access";
import { cookies } from "next/headers";

import { nextQuoteNo } from "./quote";
import { MOCK_MEMBERS, MOCK_USER_COOKIE, mockDb, mockMe, persistMock } from "./mock";
import { defaultSections, emptyBusiness, emptyCheck, emptyNeeds, emptyQuote, emptySummary, relabel, relabelAll } from "./options";
import { RPC, TABLES, isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";
import type { ClientHistory, ClientOption, Interview, Member, SharedInterview } from "./types";

/* ------------------------------------------------------------------ */
/* DB 행 <-> Interview                                                  */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

function fromRow(r: Row): Interview {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "",
    status: (r.status as Interview["status"]) ?? "draft",
    heldAt: (r.held_at as string | null)?.slice(0, 16) ?? "",
    place: (r.place as string) ?? "",
    method: (r.method as string) ?? "",
    clientName: (r.client_name as string) ?? "",
    counterparts: (r.counterparts as Interview["counterparts"]) ?? [],
    business: { ...emptyBusiness(), ...((r.business as object) ?? {}) },
    needs: { ...emptyNeeds(), ...((r.needs as object) ?? {}) },
    planderItems: (r.plander_items as Interview["planderItems"]) ?? [],
    partnerItems: (r.partner_items as Interview["partnerItems"]) ?? [],
    summary: { ...emptySummary(), ...((r.summary as object) ?? {}) },
    participantIds: (r.participant_ids as string[]) ?? [],
    internalScope: (r.internal_scope as Interview["internalScope"]) ?? "team",
    shareEnabled: Boolean(r.share_enabled),
    shareToken: (r.share_token as string | null) ?? null,
    shareSections: { ...defaultSections(), ...((r.share_sections as object) ?? {}) },
    check: { ...emptyCheck(), ...((r.conversion_check as object) ?? {}) },
    quote: { ...emptyQuote(), ...((r.quote as object) ?? {}) },
    clientId: (r.client_id as string | null) ?? null,
    projectId: (r.project_id as string | null) ?? null,
    convertedAt: (r.converted_at as string | null) ?? null,
    createdBy: r.created_by as string,
    updatedBy: (r.updated_by as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

/** 예전 선택지 이름으로 저장된 값을 지금 이름으로 바꿉니다. */
function relabelInterview(i: Interview): Interview {
  return {
    ...i,
    business: { ...i.business, industry: relabel(i.business.industry), model: relabel(i.business.model), channels: relabelAll(i.business.channels) },
    needs: { ...i.needs, goals: relabelAll(i.needs.goals), wantChannels: relabelAll(i.needs.wantChannels) },
    partnerItems: i.partnerItems.map((x) => ({ ...x, field: relabel(x.field) })),
  };
}

/** 저장 파일에 예전 형식으로 남은 목업 기록에 새 칸의 기본값을 채웁니다. */
function normalize(i: Interview): Interview {
  return relabelInterview({
    ...i,
    business: { ...emptyBusiness(), ...i.business },
    needs: { ...emptyNeeds(), ...i.needs },
    summary: { ...emptySummary(), ...i.summary },
    shareSections: { ...defaultSections(), ...i.shareSections },
    check: { ...emptyCheck(), ...i.check },
    quote: { ...emptyQuote(), ...i.quote },
  });
}

/** 화면에서 고칠 수 있는 칸만 DB 행으로 옮깁니다. 전환 결과, 공유 토큰, 작성자는 여기서 바꾸지 않습니다. */
function toEditableRow(i: Interview): Row {
  return {
    title: i.title,
    status: i.status === "converted" ? undefined : i.status,
    held_at: i.heldAt || null,
    place: i.place,
    method: i.method,
    client_name: i.clientName,
    counterparts: i.counterparts,
    business: i.business,
    needs: i.needs,
    plander_items: i.planderItems,
    partner_items: i.partnerItems,
    summary: i.summary,
    participant_ids: i.participantIds,
    internal_scope: i.internalScope,
    share_sections: i.shareSections,
    conversion_check: i.check,
    // 견적번호는 DB 트리거가 매기고, 바꿔서 보내도 트리거가 원래 번호로 되돌립니다.
    quote: i.quote,
    // 전환 전에는 불러온 웍스 고객을 바꿀 수 있습니다. 전환 뒤에는 DB 트리거가 막습니다.
    client_id: i.projectId ? undefined : i.clientId,
  };
}

/* ------------------------------------------------------------------ */
/* 사용자                                                               */
/* ------------------------------------------------------------------ */

export const getMe = cache(async (): Promise<Member | null> => {
  const sb = await createSupabaseServerClient();
  if (!sb) return mockMe((await cookies()).get(MOCK_USER_COOKIE)?.value);
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb
    .from(TABLES.users)
    .select("id,name,role,position,team,is_active")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!data || data.is_active === false) return null;
  return { id: data.id, name: data.name, role: data.role, position: data.position ?? "", team: data.team ?? "" };
});

export const listMembers = cache(async (): Promise<Member[]> => {
  const sb = await createSupabaseServerClient();
  if (!sb) return MOCK_MEMBERS;
  const { data } = await sb
    .from(TABLES.users)
    .select("id,name,role,position,team,is_active,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name");
  return (data ?? []).map((u) => ({ id: u.id, name: u.name, role: u.role, position: u.position ?? "", team: u.team ?? "" }));
});

export async function listClients(): Promise<ClientOption[]> {
  const sb = await createSupabaseServerClient();
  if (!sb) return mockDb().clients;
  const { data } = await sb
    .from(TABLES.clients)
    .select("id,name,industry,contact_name,phone,email,website,address")
    .eq("is_archived", false)
    .order("name");
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    industry: c.industry ?? "",
    contactName: c.contact_name ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    website: c.website ?? "",
    address: c.address ?? "",
  }));
}

/** 불러온 웍스 고객의 최근 프로젝트와, 내가 볼 수 있는 지난 인터뷰 */
export async function getClientHistory(me: Member, clientId: string, exceptInterview: string): Promise<ClientHistory> {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const db = mockDb();
    return {
      projects: db.projects
        .filter((p) => p.clientId === clientId)
        .map(({ id, title, status, category, startDate, endDate }) => ({ id, title, status, category, startDate, endDate })),
      interviews: db.interviews
        .filter((i) => i.clientId === clientId && i.id !== exceptInterview && canView(i, me))
        .map((i) => ({ id: i.id, title: i.title, heldAt: i.heldAt, status: i.status })),
    };
  }
  const [p, iv] = await Promise.all([
    sb
      .from(TABLES.projects)
      .select("id,title,status,category,start_date,end_date")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(6),
    sb
      .from(TABLES.interviews)
      .select("id,title,held_at,status")
      .eq("client_id", clientId)
      .neq("id", exceptInterview)
      .order("held_at", { ascending: false })
      .limit(6),
  ]);
  return {
    projects: (p.data ?? []).map((x) => ({
      id: x.id, title: x.title, status: x.status, category: x.category ?? "", startDate: x.start_date, endDate: x.end_date,
    })),
    interviews: (iv.data ?? []).map((x) => ({ id: x.id, title: x.title, heldAt: (x.held_at ?? "").slice(0, 16), status: x.status })),
  };
}

/* ------------------------------------------------------------------ */
/* 인터뷰                                                               */
/* ------------------------------------------------------------------ */

export async function listInterviews(me: Member): Promise<Interview[]> {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    return mockDb()
      .interviews.map(normalize)
      .filter((i) => canView(i, me))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  // 볼 수 있는 행은 RLS(pi_can_view)가 거릅니다.
  const { data, error } = await sb.from(TABLES.interviews).select("*").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => relabelInterview(fromRow(r)));
}

export async function getInterview(me: Member, id: string): Promise<Interview | null> {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const i = mockDb().interviews.find((x) => x.id === id);
    return i && canView(i, me) ? normalize(structuredClone(i)) : null;
  }
  const { data } = await sb.from(TABLES.interviews).select("*").eq("id", id).maybeSingle();
  return data ? relabelInterview(fromRow(data)) : null;
}

/** 미팅 일시는 한국 시각 그대로 저장합니다. (예: 2026-10-29T14:00) */
function kstNow(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 16);
}

export async function createInterview(me: Member): Promise<string> {
  const title = "새 인터뷰";
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const at = new Date().toISOString();
    const id = `i-${crypto.randomUUID().slice(0, 8)}`;
    mockDb().interviews.unshift({
      id, title, status: "draft", heldAt: kstNow(), place: "", method: "대면", clientName: "",
      counterparts: [], business: emptyBusiness(), needs: emptyNeeds(), planderItems: [], partnerItems: [],
      summary: emptySummary(), participantIds: [me.id], internalScope: "team", shareEnabled: false,
      shareToken: null, shareSections: defaultSections(), check: emptyCheck(),
      quote: { ...emptyQuote(), no: nextQuoteNo(mockDb().interviews.map((x) => x.quote?.no ?? ""), at) },
      clientId: null, projectId: null,
      convertedAt: null, createdBy: me.id, updatedBy: me.id, createdAt: at, updatedAt: at,
    });
    persistMock();
    return id;
  }
  const { data, error } = await sb
    .from(TABLES.interviews)
    .insert({ title, created_by: me.id, updated_by: me.id, participant_ids: [me.id], held_at: kstNow() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** 저장하려는 사이에 다른 사람이 먼저 고쳤을 때 */
export class SaveConflictError extends Error {}

async function conflictMessage(updatedBy: string | null | undefined): Promise<string> {
  const name = (await listMembers()).find((m) => m.id === updatedBy)?.name;
  return `${name ? `${name} 님이` : "다른 사람이"} 이 인터뷰를 먼저 고쳤습니다. 내 변경은 아직 저장되지 않았습니다.`;
}

/**
 * 인터뷰를 저장합니다. baseUpdatedAt 은 화면이 마지막으로 받은 수정 시각입니다.
 * 그 사이에 다른 사람이 고쳤으면 덮어쓰지 않고 SaveConflictError 를 던집니다. null 이면 확인 없이 덮어씁니다.
 */
export async function saveInterview(me: Member, next: Interview, baseUpdatedAt: string | null): Promise<{ updatedAt: string }> {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const db = mockDb();
    const idx = db.interviews.findIndex((x) => x.id === next.id);
    if (idx < 0 || !canEdit(db.interviews[idx], me)) throw new Error("이 인터뷰를 고칠 권한이 없습니다.");
    const cur = db.interviews[idx];
    if (baseUpdatedAt !== null && cur.updatedAt !== baseUpdatedAt) throw new SaveConflictError(await conflictMessage(cur.updatedBy));
    const updatedAt = new Date().toISOString();
    db.interviews[idx] = {
      ...next,
      status: cur.status === "converted" ? "converted" : next.status,
      shareEnabled: cur.shareEnabled,
      shareToken: cur.shareToken,
      quote: { ...next.quote, no: cur.quote?.no || next.quote.no },
      clientId: cur.projectId ? cur.clientId : next.clientId,
      projectId: cur.projectId,
      convertedAt: cur.convertedAt,
      createdBy: cur.createdBy,
      createdAt: cur.createdAt,
      updatedBy: me.id,
      updatedAt,
    };
    persistMock();
    return { updatedAt };
  }
  let q = sb.from(TABLES.interviews).update({ ...toEditableRow(next), updated_by: me.id }).eq("id", next.id);
  if (baseUpdatedAt !== null) q = q.eq("updated_at", baseUpdatedAt);
  const { data, error } = await q.select("updated_at").maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return { updatedAt: data.updated_at as string };
  // 고쳐진 행이 없으면: 볼 수 있는데 수정 시각이 다르면 충돌, 아니면 권한 없음
  const { data: cur } = await sb.from(TABLES.interviews).select("updated_at,updated_by").eq("id", next.id).maybeSingle();
  if (cur && baseUpdatedAt !== null && cur.updated_at !== baseUpdatedAt) {
    throw new SaveConflictError(await conflictMessage(cur.updated_by as string | null));
  }
  throw new Error("이 인터뷰를 고칠 권한이 없습니다.");
}

export async function deleteInterview(me: Member, id: string): Promise<void> {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const db = mockDb();
    const i = db.interviews.find((x) => x.id === id);
    // DB 정책 pi_interviews_delete 와 같게: 볼 수 있고, 작성자이거나 운영자 이상
    if (!i || !canView(i, me) || !(i.createdBy === me.id || me.role !== "user")) throw new Error("삭제 권한이 없습니다.");
    db.interviews = db.interviews.filter((x) => x.id !== id);
    persistMock();
    return;
  }
  const { error } = await sb.from(TABLES.interviews).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** 고객 공유 링크를 켜거나 끕니다. 다시 켜면 새 주소를 만들어 예전 링크는 열리지 않습니다. 바뀐 수정 시각도 돌려줍니다. */
export async function setShare(me: Member, id: string, enabled: boolean): Promise<{ token: string | null; updatedAt: string }> {
  const token = enabled ? crypto.randomUUID().replace(/-/g, "") : null;
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const i = mockDb().interviews.find((x) => x.id === id);
    if (!i || !canEdit(i, me)) throw new Error("공유 설정을 바꿀 권한이 없습니다.");
    i.shareEnabled = enabled;
    i.shareToken = token;
    i.updatedBy = me.id;
    i.updatedAt = new Date().toISOString();
    persistMock();
    return { token, updatedAt: i.updatedAt };
  }
  const { data, error } = await sb
    .from(TABLES.interviews)
    .update({ share_enabled: enabled, share_token: token, updated_by: me.id })
    .eq("id", id)
    .select("updated_at")
    .single();
  if (error) throw new Error(error.message);
  return { token, updatedAt: data.updated_at as string };
}

/** 로그인 없이 공유 링크로 엽니다. DB에서는 보안 함수가 고른 항목만 돌려줍니다. */
export async function getShared(token: string): Promise<SharedInterview | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  if (!isSupabaseConfigured()) {
    const i = mockDb().interviews.find((x) => x.shareEnabled && x.shareToken === token);
    return i ? toShared(normalize(i), MOCK_MEMBERS.find((m) => m.id === i.createdBy)?.name) : null;
  }
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb!.rpc(RPC.shared, { p_token: token });
  if (error || !data) return null;
  return data as SharedInterview;
}

export interface ConvertInput {
  id: string;
  title: string;
  category: string;
  budget: number | null;
  /** 기존 웍스 클라이언트에 붙일 때 */
  clientId: string | null;
}

/** 의뢰 전환: 웍스에 클라이언트(상담중)와 프로젝트(대기)를 만들고 인터뷰에 연결합니다. */
export async function convertInterview(
  me: Member,
  input: ConvertInput,
): Promise<{ clientId: string; projectId: string; updatedAt: string }> {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    const db = mockDb();
    const i = db.interviews.find((x) => x.id === input.id);
    if (!i || !canEdit(i, me)) throw new Error("전환 권한이 없습니다.");
    if (i.projectId) throw new Error("이미 의뢰로 전환한 인터뷰입니다.");
    let clientId = input.clientId ?? i.clientId;
    if (!clientId) {
      clientId = `cl-${crypto.randomUUID().slice(0, 8)}`;
      const cp = i.counterparts.find((c) => c.role === "decision") ?? i.counterparts[0];
      db.clients.push({
        id: clientId, name: i.clientName || i.title, industry: i.business.industry, contactName: cp?.name ?? "",
        phone: cp?.phone ?? "", email: cp?.email ?? "", website: i.business.website, address: i.business.region,
      });
    }
    const projectId = `pj-${crypto.randomUUID().slice(0, 8)}`;
    db.projects.push({ id: projectId, title: input.title, clientId, status: "waiting", category: input.category, startDate: null, endDate: null });
    const at = new Date().toISOString();
    Object.assign(i, { status: "converted", clientId, projectId, convertedAt: at, updatedBy: me.id, updatedAt: at });
    persistMock();
    return { clientId, projectId, updatedAt: at };
  }
  const { data, error } = await sb.rpc(RPC.convert, {
    p_interview: input.id,
    p_title: input.title,
    p_category: input.category,
    p_budget: input.budget,
    p_client: input.clientId,
  });
  if (error) throw new Error(error.message);
  const r = data as { client_id: string; project_id: string };
  const { data: row } = await sb.from(TABLES.interviews).select("updated_at").eq("id", input.id).single();
  return { clientId: r.client_id, projectId: r.project_id, updatedAt: (row?.updated_at as string) ?? "" };
}
