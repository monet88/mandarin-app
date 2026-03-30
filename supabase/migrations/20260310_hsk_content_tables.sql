-- HSK Content Tables: question bank, exam sessions, audio manifests

-- hsk_question_bank: pre-generated exam questions indexed by level and section
create table if not exists public.hsk_question_bank (
  id uuid primary key default gen_random_uuid(),
  hsk_level smallint not null check (hsk_level between 1 and 6),
  section text not null,           -- 'listening', 'reading', 'writing'
  question_type text not null,     -- 'multiple_choice', 'fill_blank', 'ordering', 'passage_mc'
  question_data jsonb not null,    -- structured question payload (text, options, answer, etc.)
  vocab_ceiling jsonb,             -- words used; validated against hsk_level vocab list
  status text not null default 'pending', -- 'pending', 'valid', 'quarantined'
  generated_at timestamp with time zone not null default now(),
  validated_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_hsk_question_bank_level on public.hsk_question_bank(hsk_level);
create index if not exists idx_hsk_question_bank_section on public.hsk_question_bank(hsk_level, section);
create index if not exists idx_hsk_question_bank_status on public.hsk_question_bank(status);

alter table public.hsk_question_bank enable row level security;

-- Only authenticated users can read valid questions; service role manages all
create policy "Authenticated users read valid questions"
  on public.hsk_question_bank for select
  using (auth.role() = 'authenticated' and status = 'valid');

create policy "Service role manages hsk_question_bank"
  on public.hsk_question_bank for all
  using (auth.role() = 'service_role');

-- hsk_exam_sessions: active and completed exam sessions
create table if not exists public.hsk_exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hsk_level smallint not null check (hsk_level between 1 and 6),
  status text not null default 'active', -- 'active', 'submitted', 'expired'
  question_ids uuid[] not null default '{}', -- ordered list of question bank ids
  answers jsonb not null default '{}',       -- map of question_id -> answer
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null, -- server-set deadline
  submitted_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_hsk_exam_sessions_user on public.hsk_exam_sessions(user_id);
create index if not exists idx_hsk_exam_sessions_active on public.hsk_exam_sessions(user_id, status);

alter table public.hsk_exam_sessions enable row level security;

create policy "Users read own hsk_exam_sessions"
  on public.hsk_exam_sessions for select
  using (auth.uid() = user_id);

create policy "Service role manages hsk_exam_sessions"
  on public.hsk_exam_sessions for all
  using (auth.role() = 'service_role');

-- hsk_audio_manifests: maps listening questions to pre-generated TTS audio assets
create table if not exists public.hsk_audio_manifests (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.hsk_question_bank(id) on delete cascade,
  hsk_level smallint not null check (hsk_level between 1 and 6),
  storage_path text not null,       -- Supabase Storage path or external URL
  duration_seconds numeric(6,2),
  voice_id text,                    -- Azure TTS voice identifier
  status text not null default 'pending', -- 'pending', 'ready', 'error'
  generated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_hsk_audio_manifests_question on public.hsk_audio_manifests(question_id);
create index if not exists idx_hsk_audio_manifests_status on public.hsk_audio_manifests(status);

alter table public.hsk_audio_manifests enable row level security;

-- Authenticated users can read ready audio manifests only
create policy "Authenticated users read ready audio"
  on public.hsk_audio_manifests for select
  using (auth.role() = 'authenticated' and status = 'ready');

create policy "Service role manages hsk_audio_manifests"
  on public.hsk_audio_manifests for all
  using (auth.role() = 'service_role');
