-- 견적서 정보(quote)를 저장하고, 예상 금액을 공유하면 고객 견적서 페이지에 내려줍니다.

begin;

alter table public.pi_interviews add column if not exists quote jsonb not null default '{}'::jsonb;
grant update (quote) on public.pi_interviews to authenticated;

create or replace function public.pi_shared_interview(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.pi_interviews;
  s jsonb;
  q jsonb;
  cp jsonb;
  v_date text;
  v_owner text;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,64}$' then
    return null;
  end if;
  select * into r from public.pi_interviews where share_token = p_token and share_enabled;
  if not found then
    return null;
  end if;
  s := r.share_sections;
  q := coalesce(r.quote, '{}'::jsonb);
  -- 견적서 수신자 기본값: 결정권자, 없으면 첫 번째 미팅자
  select c into cp from jsonb_array_elements(r.counterparts) c
    where coalesce(c->>'name', '') <> ''
    order by (c->>'role' = 'decision') desc limit 1;
  v_date := coalesce(nullif(q->>'date', ''), to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD'));
  select u.name into v_owner from public.pw_users u where u.id = r.created_by;
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
    -- 견적서: 예상 금액을 공유할 때만. src/lib/quote.ts 의 resolveQuote 와 같은 기본값을 씁니다.
    'quote', case when (s->>'estimate')::boolean then jsonb_build_object(
      'title', coalesce(nullif(q->>'title', ''), case when r.client_name <> '' then r.client_name || ' 견적서' else r.title || ' 견적서' end),
      'no', coalesce(nullif(q->>'no', ''), replace(left(v_date, 7), '-', '') || '-' || upper(right(regexp_replace(r.id::text, '[^a-zA-Z0-9]', '', 'g'), 4))),
      'date', v_date,
      'staffName', coalesce(nullif(q->>'staffName', ''), v_owner, ''),
      'staffContact', coalesce(q->>'staffContact', ''),
      'recipientName', coalesce(nullif(q->>'recipientName', ''), trim(concat_ws(' ', nullif(cp->>'name', ''), nullif(cp->>'title', ''))), ''),
      'recipientPhone', coalesce(nullif(q->>'recipientPhone', ''), cp->>'phone', ''),
      'recipientEmail', coalesce(nullif(q->>'recipientEmail', ''), cp->>'email', ''),
      'recipientAddress', coalesce(nullif(q->>'recipientAddress', ''), r.business->>'region', ''),
      'note', coalesce(nullif(q->>'note', ''), '세부 제작 규격과 수량, 소재와 후가공 범위는 협의 후 확정합니다. 광고 매체비는 견적에 포함하지 않습니다.')
    ) end,
    'updatedAt', r.updated_at
  ));
end $$;

revoke all on function public.pi_shared_interview(text) from public;
grant execute on function public.pi_shared_interview(text) to anon, authenticated;

commit;
