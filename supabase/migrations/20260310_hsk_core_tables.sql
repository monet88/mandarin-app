-- HSK Core Tables: progress tracking, word mastery, event ledger, exam results

-- hsk_progress: per-user per-level aggregate progress
create table if not exists public.hsk_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hsk_level smallint not null check (hsk_level between 1 and 6),
  words_learned integer not null default 0,
  words_mastered integer not null default 0,
  total_study_seconds integer not null default 0,
  last_studied_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (user_id, hsk_level)
);

create index if not exists idx_hsk_progress_user on public.hsk_progress(user_id);
create index if not exists idx_hsk_progress_user_level on public.hsk_progress(user_id, hsk_level);

alter table public.hsk_progress enable row level security;

create policy "Users read own hsk_progress"
  on public.hsk_progress for select
  using (auth.uid() = user_id);

create policy "Service role manages hsk_progress"
  on public.hsk_progress for all
  using (auth.role() = 'service_role');

-- hsk_word_mastery: per-word SRS state per user
create table if not exists public.hsk_word_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_simplified text not null,
  hsk_level smallint not null check (hsk_level between 1 and 6),
  mastery_score smallint not null default 0 check (mastery_score between 0 and 5),
  review_count integer not null default 0,
  next_review_at timestamp with time zone,
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (user_id, word_simplified)
);

create index if not exists idx_hsk_word_mastery_user on public.hsk_word_mastery(user_id);
create index if not exists idx_hsk_word_mastery_review on public.hsk_word_mastery(user_id, next_review_at);
create index if not exists idx_hsk_word_mastery_level on public.hsk_word_mastery(user_id, hsk_level);

alter table public.hsk_word_mastery enable row level security;

create policy "Users read own hsk_word_mastery"
  on public.hsk_word_mastery for select
  using (auth.uid() = user_id);

create policy "Service role manages hsk_word_mastery"
  on public.hsk_word_mastery for all
  using (auth.role() = 'service_role');

-- hsk_event_ledger: idempotent event log (source of truth for aggregates)
create table if not exists public.hsk_event_ledger (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,  -- client-generated idempotency key
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,       -- 'word_reviewed', 'lesson_completed', 'exam_submitted'
  payload jsonb not null default '{}',
  hsk_level smallint check (hsk_level between 1 and 6),
  occurred_at timestamp with time zone not null, -- client timestamp (informational only)
  processed_at timestamp with time zone not null default now(), -- server-authoritative
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_hsk_event_ledger_user on public.hsk_event_ledger(user_id);
create index if not exists idx_hsk_event_ledger_event_id on public.hsk_event_ledger(event_id);
create index if not exists idx_hsk_event_ledger_type on public.hsk_event_ledger(user_id, event_type);

alter table public.hsk_event_ledger enable row level security;

create policy "Users read own hsk_event_ledger"
  on public.hsk_event_ledger for select
  using (auth.uid() = user_id);

create policy "Service role manages hsk_event_ledger"
  on public.hsk_event_ledger for all
  using (auth.role() = 'service_role');

-- hsk_exam_results: finalized exam scores per session
create table if not exists public.hsk_exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,       -- references hsk_exam_sessions(id) in content tables
  hsk_level smallint not null check (hsk_level between 1 and 6),
  listening_score smallint,       -- 0-100
  reading_score smallint,         -- 0-100
  writing_score smallint,         -- 0-100
  total_score smallint,           -- 0-100
  passed boolean,
  time_spent_seconds integer,
  completed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_hsk_exam_results_user on public.hsk_exam_results(user_id);
create index if not exists idx_hsk_exam_results_level on public.hsk_exam_results(user_id, hsk_level);

alter table public.hsk_exam_results enable row level security;

create policy "Users read own hsk_exam_results"
  on public.hsk_exam_results for select
  using (auth.uid() = user_id);

create policy "Service role manages hsk_exam_results"
  on public.hsk_exam_results for all
  using (auth.role() = 'service_role');
