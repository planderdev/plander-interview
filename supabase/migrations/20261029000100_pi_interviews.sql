-- 플랜더 인터뷰 (plander-interview) 첫 마이그레이션
-- Supabase 프로젝트 hmjbbdwzwiqihqhjtspd 를 플랜더 웍스, 피트인과 함께 씁니다.
-- pi_ 접두사 = 이 앱 소유. pw_ 테이블은 읽기와 pi_convert_interview 의 의뢰 전환 쓰기만 합니다.
-- session_replication_role 을 바꾸지 않습니다. 다른 앱의 트리거까지 멈춥니다.

begin;

create table if not exists public.pi_interviews (
  id uuid primary key default gen_random_uuid(),
  title text not null default '새 인터뷰',
  status text not null default 'draft'
    check (status in ('draft', 'organized', 'proposed', 'converted', 'dropped')),
  -- 미팅 일시는 한국 시각 그대로(시간대 없이) 저장합니다.
  held_at timestamp,
  place text not null default '',
  method text not null default '',
  client_name text not null default '',
  counterparts jsonb not null default '[]'::jsonb,
  business jsonb not null default '{}'::jsonb,
  needs jsonb not null default '{}'::jsonb,
  plander_items jsonb not null default '[]'::jsonb,
  partner_items jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  participant_ids uuid[] not null default '{}',
  internal_scope text not null default 'team'
    check (internal_scope in ('team', 'operators', 'participants')),
  share_enabled boolean not null default false,
  share_token text unique check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{16,64}$'),
  share_sections jsonb not null default
    '{"summary":true,"business":false,"needs":true,"plander":true,"estimate":false,"nextActions":true}'::jsonb,
  conversion_check jsonb not null default '{}'::jsonb,
  -- 의뢰 전환 결과. pi_convert_interview 만 채웁니다.
  client_id uuid references public.pw_clients(id) on delete set null,
  project_id uuid references public.pw_projects(id) on delete set null,
  converted_at timestamptz,
  created_by uuid not null references public.pw_users(id) on delete restrict,
  updated_by uuid references public.pw_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pi_interviews_updated_idx on public.pi_interviews (updated_at desc);
create index if not exists pi_interviews_created_by_idx on public.pi_interviews (created_by);
create index if not exists pi_interviews_project_idx on public.pi_interviews (project_id);

-- ------------------------------------------------------------------
-- 권한 판단. src/lib/access.ts 의 canView, canEdit 와 같게 유지합니다.
-- ------------------------------------------------------------------

create or replace function public.pi_member_role()
returns text
language sql stable security definer set search_path = '' as $$
  select u.role::text from public.pw_users u where u.id = auth.uid() and u.is_active
$$;

create or replace function public.pi_can_view(p_scope text, p_created_by uuid, p_participants uuid[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when public.pi_member_role() is null then false
    when public.pi_member_role() = 'super_admin' then true
    when p_scope = 'team' then true
    when p_scope = 'operators' then
      public.pi_member_role() = 'operator' or auth.uid() = p_created_by or auth.uid() = any(p_participants)
    else auth.uid() = p_created_by or auth.uid() = any(p_participants)
  end
$$;

create or replace function public.pi_can_edit(p_scope text, p_created_by uuid, p_participants uuid[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.pi_can_view(p_scope, p_created_by, p_participants)
    and (public.pi_member_role() <> 'user' or auth.uid() = p_created_by or auth.uid() = any(p_participants))
$$;

-- ------------------------------------------------------------------
-- 수정 시각, 전환 상태 보호
-- ------------------------------------------------------------------

create or replace function public.pi_interviews_touch()
returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  -- 전환된 인터뷰는 상태를 되돌리지 않습니다.
  if tg_op = 'UPDATE' and old.status = 'converted' then
    new.status := 'converted';
  end if;
  -- '의뢰 전환' 상태는 웍스 프로젝트가 연결되어야만 됩니다.
  if new.status = 'converted' and new.project_id is null
     and (tg_op = 'INSERT' or old.status <> 'converted') then
    raise exception '의뢰 전환은 pi_convert_interview 로만 할 수 있습니다.';
  end if;
  return new;
end $$;

drop trigger if exists pi_interviews_touch on public.pi_interviews;
create trigger pi_interviews_touch before insert or update on public.pi_interviews
  for each row execute function public.pi_interviews_touch();

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------

alter table public.pi_interviews enable row level security;

drop policy if exists pi_interviews_select on public.pi_interviews;
create policy pi_interviews_select on public.pi_interviews for select to authenticated
  using (public.pi_can_view(internal_scope, created_by, participant_ids));

drop policy if exists pi_interviews_insert on public.pi_interviews;
create policy pi_interviews_insert on public.pi_interviews for insert to authenticated
  with check (created_by = auth.uid() and public.pi_member_role() is not null and project_id is null and client_id is null);

drop policy if exists pi_interviews_update on public.pi_interviews;
create policy pi_interviews_update on public.pi_interviews for update to authenticated
  using (public.pi_can_edit(internal_scope, created_by, participant_ids))
  with check (public.pi_can_edit(internal_scope, created_by, participant_ids));

drop policy if exists pi_interviews_delete on public.pi_interviews;
create policy pi_interviews_delete on public.pi_interviews for delete to authenticated
  using (
    public.pi_can_view(internal_scope, created_by, participant_ids)
    and (created_by = auth.uid() or public.pi_member_role() in ('super_admin', 'operator'))
  );

-- 전환 결과와 작성자는 화면에서 직접 바꿀 수 없게 열 단위로 막습니다.
revoke all on public.pi_interviews from anon;
revoke update on public.pi_interviews from authenticated;
grant select, insert, delete on public.pi_interviews to authenticated;
grant update (
  title, status, held_at, place, method, client_name, counterparts, business, needs,
  plander_items, partner_items, summary, participant_ids, internal_scope,
  share_enabled, share_token, share_sections, conversion_check, updated_by
) on public.pi_interviews to authenticated;

-- ------------------------------------------------------------------
-- 고객 공유: 로그인 없이 토큰으로 엽니다. 고른 항목만 돌려줍니다.
-- 연락처, 외부 협력, 내부 메모, 위험 요소, 한 줄 요약은 절대 넣지 않습니다.
-- src/lib/access.ts 의 toShared 와 같게 유지합니다.
-- ------------------------------------------------------------------

create or replace function public.pi_shared_interview(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.pi_interviews;
  s jsonb;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,64}$' then
    return null;
  end if;
  select * into r from public.pi_interviews where share_token = p_token and share_enabled;
  if not found then
    return null;
  end if;
  s := r.share_sections;
  return jsonb_strip_nulls(jsonb_build_object(
    'title', r.title,
    'clientName', r.client_name,
    'heldAt', coalesce(to_char(r.held_at, 'YYYY-MM-DD"T"HH24:MI'), ''),
    'counterpartNames', coalesce((
      select jsonb_agg(trim(concat_ws(' ', nullif(c->>'name', ''), nullif(c->>'title', ''))))
      from jsonb_array_elements(r.counterparts) c
      where coalesce(c->>'name', '') <> ''
    ), '[]'::jsonb),
    'sections', s,
    'business', case when (s->>'business')::boolean then r.business end,
    'needs', case when (s->>'needs')::boolean then jsonb_build_object(
      'goals', coalesce(r.needs->'goals', '[]'::jsonb),
      'pains', coalesce(r.needs->>'pains', ''),
      'wish', coalesce(r.needs->>'wish', ''),
      'timeline', coalesce(r.needs->>'timeline', ''),
      'budget', '', 'decisionBy', ''
    ) end,
    'summary', case when (s->>'summary')::boolean then coalesce(r.summary->>'external', '') end,
    'planderItems', case when (s->>'plander')::boolean or (s->>'estimate')::boolean then r.plander_items end,
    'nextActions', case when (s->>'nextActions')::boolean then coalesce((
      select jsonb_agg(jsonb_build_object('text', a->>'text', 'due', coalesce(a->>'due', '')))
      from jsonb_array_elements(coalesce(r.summary->'nextActions', '[]'::jsonb)) a
    ), '[]'::jsonb) end,
    'updatedAt', r.updated_at
  ));
end $$;

revoke all on function public.pi_shared_interview(text) from public;
grant execute on function public.pi_shared_interview(text) to anon, authenticated;

-- ------------------------------------------------------------------
-- 의뢰 전환: 웍스 클라이언트(상담중)와 프로젝트(대기)를 만들고 인터뷰에 연결합니다.
-- 팀원도 자기가 고칠 수 있는 인터뷰는 전환할 수 있게 security definer 로 둡니다.
-- ------------------------------------------------------------------

create or replace function public.pi_convert_interview(
  p_interview uuid,
  p_title text,
  p_category text,
  p_budget numeric,
  p_client uuid
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.pi_interviews;
  v_client uuid := p_client;
  v_project uuid;
  v_contact jsonb;
  v_desc text;
  v_items text;
begin
  if public.pi_member_role() is null then
    raise exception '웍스 구성원만 전환할 수 있습니다.';
  end if;
  select * into r from public.pi_interviews where id = p_interview for update;
  if not found or not public.pi_can_edit(r.internal_scope, r.created_by, r.participant_ids) then
    raise exception '이 인터뷰를 전환할 권한이 없습니다.';
  end if;
  if r.project_id is not null then
    raise exception '이미 의뢰로 전환한 인터뷰입니다.';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception '프로젝트 제목이 필요합니다.';
  end if;
  if coalesce(trim(r.client_name), '') = '' then
    raise exception '고객사 이름이 필요합니다.';
  end if;

  -- 대표 연락처: 결정권자 우선, 없으면 첫 번째 미팅자
  select c into v_contact from jsonb_array_elements(r.counterparts) c
    order by (c->>'role' = 'decision') desc limit 1;

  if v_client is not null then
    perform 1 from public.pw_clients where id = v_client;
    if not found then
      raise exception '연결할 웍스 클라이언트를 찾지 못했습니다.';
    end if;
  else
    insert into public.pw_clients (name, industry, manager_id, contact_name, phone, email, website, memo)
    values (
      trim(r.client_name),
      coalesce(r.business->>'industry', ''),
      auth.uid(),
      coalesce(v_contact->>'name', ''),
      coalesce(v_contact->>'phone', ''),
      coalesce(v_contact->>'email', ''),
      coalesce(r.business->>'website', ''),
      '플랜더 인터뷰에서 전환 (' || to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD') || ')'
    )
    returning id into v_client;
    -- 관계 단계 열은 웍스에서 나중에 추가되어 schema.sql 에 없을 수 있어 있을 때만 씁니다.
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'pw_clients' and column_name = 'relation_status'
    ) then
      execute 'update public.pw_clients set relation_status = $1 where id = $2' using '상담중', v_client;
    end if;
  end if;

  select string_agg('- ' || coalesce(nullif(i->>'title', ''), i->>'catalogId') || ' x' || coalesce(i->>'qty', '1'), E'\n')
    into v_items from jsonb_array_elements(r.plander_items) i;

  v_desc := concat_ws(E'\n\n',
    nullif(r.summary->>'oneline', ''),
    nullif(r.summary->>'external', ''),
    case when coalesce(r.needs->>'pains', '') <> '' then '고객 고민: ' || (r.needs->>'pains') end,
    case when v_items is not null then E'인터뷰에서 고른 항목\n' || v_items end
  );

  insert into public.pw_projects (client_id, title, description, status, budget, priority, pm_id, goal, category, memo)
  values (
    v_client,
    trim(p_title),
    coalesce(v_desc, ''),
    'waiting',
    p_budget,
    'medium',
    auth.uid(),
    coalesce(r.needs->>'wish', ''),
    coalesce(p_category, ''),
    '플랜더 인터뷰에서 전환: ' || r.id::text
  )
  returning id into v_project;

  update public.pi_interviews
     set client_id = v_client, project_id = v_project, converted_at = now(),
         status = 'converted', updated_by = auth.uid()
   where id = r.id;

  return jsonb_build_object('client_id', v_client, 'project_id', v_project);
end $$;

revoke all on function public.pi_convert_interview(uuid, text, text, numeric, uuid) from public;
grant execute on function public.pi_convert_interview(uuid, text, text, numeric, uuid) to authenticated;

commit;
