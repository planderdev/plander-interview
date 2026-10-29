-- 인터뷰 중에 플랜더웍스 고객을 불러와 연결합니다.
-- client_id 를 화면에서 고칠 수 있게 열고, 의뢰 전환 뒤에는 바뀌지 않게 막습니다.
-- 전환 함수는 연결된 고객이 있으면 새 클라이언트를 만들지 않고 그 고객에 프로젝트를 붙입니다.

begin;

grant update (client_id) on public.pi_interviews to authenticated;

create or replace function public.pi_interviews_touch()
returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and old.status = 'converted' then
    new.status := 'converted';
  end if;
  -- 전환된 인터뷰의 웍스 고객 연결은 바꾸지 않습니다. (웍스에서 고객을 지워 null 이 되는 경우는 허용)
  if tg_op = 'UPDATE' and old.project_id is not null and new.client_id is not null
     and new.client_id is distinct from old.client_id then
    new.client_id := old.client_id;
  end if;
  if new.status = 'converted' and new.project_id is null
     and (tg_op = 'INSERT' or old.status <> 'converted') then
    raise exception '의뢰 전환은 pi_convert_interview 로만 할 수 있습니다.';
  end if;
  return new;
end $$;

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
  v_client uuid;
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
  -- 직접 고른 클라이언트, 없으면 인터뷰 중에 불러온 웍스 고객
  v_client := coalesce(p_client, r.client_id);
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
