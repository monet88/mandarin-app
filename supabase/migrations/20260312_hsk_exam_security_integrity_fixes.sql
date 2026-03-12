-- Security + integrity hardening for HSK exam flows
-- Covers: answer leakage, section timing/order, finalize idempotency, writing eval persistence

-- 1) Lock question-bank direct reads (answers must only flow through sanitized edge responses)
drop policy if exists "Authenticated users read valid questions"
  on public.hsk_question_bank;

-- 2) Persist server-owned section progression/timing
alter table public.hsk_exam_sessions
  add column if not exists current_section text;

alter table public.hsk_exam_sessions
  add column if not exists section_deadlines jsonb not null default '{}'::jsonb;

update public.hsk_exam_sessions
set current_section = 'listening'
where current_section is null
  and status = 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hsk_exam_sessions_current_section_check'
  ) then
    alter table public.hsk_exam_sessions
      add constraint hsk_exam_sessions_current_section_check
      check (
        current_section is null or current_section in ('listening', 'reading', 'writing')
      );
  end if;
end
$$;

-- 3) Make finalize idempotent per session
-- Remove accidental duplicates before adding unique constraint.
with ranked as (
  select
    id,
    session_id,
    row_number() over (
      partition by session_id
      order by completed_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.hsk_exam_results
  where session_id is not null
)
delete from public.hsk_exam_results r
using ranked x
where r.id = x.id
  and x.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hsk_exam_results_session_id_unique'
  ) then
    alter table public.hsk_exam_results
      add constraint hsk_exam_results_session_id_unique unique (session_id);
  end if;
end
$$;

create index if not exists idx_hsk_exam_results_session_id
  on public.hsk_exam_results(session_id);

delete from public.hsk_exam_results r
where r.session_id is not null
  and not exists (
    select 1
    from public.hsk_exam_sessions s
    where s.id = r.session_id
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hsk_exam_results_session_id_fkey'
  ) then
    alter table public.hsk_exam_results
      add constraint hsk_exam_results_session_id_fkey
      foreign key (session_id)
      references public.hsk_exam_sessions(id)
      on delete cascade;
  end if;
end
$$;

-- 4) Persist writing evaluation for idempotent + rate-limited access
alter table public.hsk_exam_results
  add column if not exists writing_rubric jsonb;

alter table public.hsk_exam_results
  add column if not exists writing_fallback boolean;

alter table public.hsk_exam_results
  add column if not exists writing_evaluated_at timestamp with time zone;
