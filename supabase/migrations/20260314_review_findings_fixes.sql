-- Fix #5: Cross-level word collision
-- Drop old unique constraint on (user_id, word_simplified), replace with (user_id, word_simplified, hsk_level)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hsk_word_mastery_user_id_word_simplified_key'
  ) THEN
    ALTER TABLE public.hsk_word_mastery
      DROP CONSTRAINT hsk_word_mastery_user_id_word_simplified_key;
  END IF;
END $$;

ALTER TABLE public.hsk_word_mastery
  ADD CONSTRAINT hsk_word_mastery_user_id_word_simplified_hsk_level_key
  UNIQUE (user_id, word_simplified, hsk_level);

-- Fix #7: Enforce at most 1 active exam session per user
CREATE UNIQUE INDEX IF NOT EXISTS hsk_exam_sessions_one_active_per_user
  ON public.hsk_exam_sessions (user_id)
  WHERE status = 'active';

-- Fix #9: Prevent repeatable trial abuse
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- Fix #1: Idempotency hole — track processed state per ledger row
ALTER TABLE public.hsk_event_ledger
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT false;
