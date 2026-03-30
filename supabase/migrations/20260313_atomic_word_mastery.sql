-- Atomic word mastery upsert to eliminate read-then-write race condition.
-- Computes new mastery_score and next_review_at entirely in SQL.

create or replace function public.upsert_word_mastery(
  p_user_id uuid,
  p_word_simplified text,
  p_hsk_level smallint,
  p_mastery_delta integer
) returns void language plpgsql as $$
declare
  v_new_score smallint;
begin
  insert into public.hsk_word_mastery (
    user_id, word_simplified, hsk_level, mastery_score, review_count,
    last_reviewed_at, next_review_at, updated_at
  ) values (
    p_user_id, p_word_simplified, p_hsk_level,
    least(5, greatest(0, p_mastery_delta))::smallint,
    1, now(),
    now() + (power(2, least(5, greatest(0, p_mastery_delta))) || ' days')::interval,
    now()
  )
  on conflict (user_id, word_simplified, hsk_level) do update set
    mastery_score = least(5, greatest(0, hsk_word_mastery.mastery_score + p_mastery_delta))::smallint,
    review_count  = hsk_word_mastery.review_count + 1,
    hsk_level     = p_hsk_level,
    last_reviewed_at = now(),
    next_review_at   = now() + (
      power(2, least(5, greatest(0, hsk_word_mastery.mastery_score + p_mastery_delta)))
      || ' days'
    )::interval,
    updated_at = now();
end;
$$;
