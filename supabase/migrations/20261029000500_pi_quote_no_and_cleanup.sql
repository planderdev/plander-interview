-- 1. 견적번호를 만든 달과 순서로 자동으로 매깁니다. 예: 202610-3
--    새 인터뷰를 만들 때 트리거가 번호를 넣고, 이후에는 바뀌지 않게 막습니다.
-- 2. 요약 정리 구역을 없앴으므로 고객 공유의 '미팅 정리'와 '다음 단계'를 끕니다.
--    예전 기록의 요약 내용은 지우지 않고 그대로 둡니다.

begin;

create or replace function public.pi_interviews_quote_no()
returns trigger
language plpgsql set search_path = '' as $$
declare
  v_ym text;
  v_n int;
begin
  new.quote := coalesce(new.quote, '{}'::jsonb);
  if tg_op = 'UPDATE' then
    -- 한 번 매긴 번호는 바꾸지 않습니다.
    if coalesce(old.quote->>'no', '') <> '' then
      new.quote := jsonb_set(new.quote, '{no}', old.quote->'no');
    end if;
    return new;
  end if;
  if coalesce(new.quote->>'no', '') = '' then
    -- 같은 순간에 두 건이 만들어져도 번호가 겹치지 않게 잠급니다.
    perform pg_advisory_xact_lock(hashtext('pi_interviews_quote_no'));
    v_ym := to_char(coalesce(new.created_at, now()) at time zone 'Asia/Seoul', 'YYYYMM');
    select coalesce(max((regexp_match(quote->>'no', '^' || v_ym || '-(\d+)$'))[1]::int), 0) + 1
      into v_n
      from public.pi_interviews
     where quote->>'no' like v_ym || '-%';
    new.quote := jsonb_set(new.quote, '{no}', to_jsonb(v_ym || '-' || v_n));
  end if;
  return new;
end $$;

drop trigger if exists pi_interviews_quote_no on public.pi_interviews;
create trigger pi_interviews_quote_no before insert or update on public.pi_interviews
  for each row execute function public.pi_interviews_quote_no();

-- 번호가 없는 기존 인터뷰는 만든 순서대로 매깁니다.
with ranked as (
  select id,
         to_char(created_at at time zone 'Asia/Seoul', 'YYYYMM') as ym,
         row_number() over (
           partition by to_char(created_at at time zone 'Asia/Seoul', 'YYYYMM')
           order by created_at, id
         ) as n
    from public.pi_interviews
   where coalesce(quote->>'no', '') = ''
)
update public.pi_interviews p
   set quote = jsonb_set(coalesce(p.quote, '{}'::jsonb), '{no}', to_jsonb(r.ym || '-' || r.n))
  from ranked r
 where p.id = r.id;

update public.pi_interviews
   set share_sections = share_sections || '{"summary": false, "nextActions": false}'::jsonb;
alter table public.pi_interviews alter column share_sections set default
  '{"summary":false,"business":false,"needs":true,"plander":true,"estimate":false,"nextActions":false}'::jsonb;

commit;
