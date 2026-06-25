-- ============================================================
-- 009 — Ambassador program + OG badges (Global Gold / Campus Silver)
-- Run in the Supabase SQL Editor (footfall-student project).
--
-- Adds permanent signup ranks + ambassador fields to profiles, backfills
-- existing users, and assigns ranks automatically on every new signup.
-- Ranks are assigned BEFORE INSERT and never updated, so they are locked
-- for life (deleting an account does not renumber anyone).
-- ============================================================

-- 1. Columns -------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_ambassador      boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ambassador_role    text;        -- e.g. 'Event Manager'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS global_signup_rank integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus_signup_rank integer;

-- 2. Backfill existing users by signup order -----------------
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at, id)                                  AS g_rank,
    row_number() OVER (PARTITION BY college ORDER BY created_at, id)             AS c_rank
  FROM profiles
)
UPDATE profiles p
SET global_signup_rank = r.g_rank,
    campus_signup_rank = r.c_rank
FROM ranked r
WHERE p.id = r.id
  AND p.global_signup_rank IS NULL;

-- 3. Global rank uses a sequence so it is strictly monotonic and
--    never reused, even across deletions.
CREATE SEQUENCE IF NOT EXISTS global_signup_seq;
SELECT setval('global_signup_seq', (SELECT COALESCE(MAX(global_signup_rank), 0) FROM profiles), true);

-- 4. Assign ranks on every new signup ------------------------
CREATE OR REPLACE FUNCTION assign_signup_ranks()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Global rank: atomic via sequence (race-safe).
  IF NEW.global_signup_rank IS NULL THEN
    NEW.global_signup_rank := nextval('global_signup_seq');
  END IF;

  -- Campus rank: serialize per-college so two concurrent signups at the
  -- same college can't grab the same number.
  IF NEW.campus_signup_rank IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('cmpus_campus_rank_' || coalesce(NEW.college, '')));
    SELECT COALESCE(MAX(campus_signup_rank), 0) + 1
      INTO NEW.campus_signup_rank
      FROM profiles
     WHERE college IS NOT DISTINCT FROM NEW.college;
  END IF;

  RETURN NEW;
END;
$$;

-- Runs BEFORE the existing handle_new_user() flow completes inserting the row.
DROP TRIGGER IF EXISTS trg_assign_signup_ranks ON profiles;
CREATE TRIGGER trg_assign_signup_ranks
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_signup_ranks();

-- 5. OG status is DERIVED, not stored — anyone with rank <= 999 is an OG.
--    (Frontend: global OG = global_signup_rank <= 999,
--               campus OG = campus_signup_rank <= 999.)
--    No extra column needed; the rank IS the source of truth.

-- 6. Ambassadors are set manually by you (founder) — example:
--    UPDATE profiles SET is_ambassador = true, ambassador_role = 'Event Manager'
--    WHERE username = 'some_student';
--    (You can run these one-off per crew member after they accept.)

-- profiles already has SELECT policies, so the new columns are readable by
-- the same-college / follow-relationship rules already in place. No RLS change.
