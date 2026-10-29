-- 에임(AIM) 퍼널과 레시피 빌더 항목을 인터뷰에 반영합니다.
-- 고객 공유의 '원하시는 일'에 해 보고 싶은 채널(wantChannels)을 더합니다.
-- 타겟 고객, 계약 기간, 제약 조건, 예산, 결정 시점은 내부에서만 봅니다.
-- 퍼널 단계는 business.funnel 에 저장되어 '고객사 정보'를 공유할 때 함께 나갑니다.
-- src/lib/access.ts 의 toShared 와 같게 유지합니다.

begin;

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
      'wantChannels', coalesce(r.needs->'wantChannels', '[]'::jsonb),
      'targets', '[]'::jsonb, 'period', '', 'constraints', '[]'::jsonb,
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

commit;
