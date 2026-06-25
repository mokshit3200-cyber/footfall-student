-- ============================================================
-- Cmpus — Migration 006: Missing tables, columns, and RPC
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── 1. username column on profiles ─────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- ── 2. timetable table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day int NOT NULL CHECK (day BETWEEN 0 AND 6), -- 0=Sun..6=Sat
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text NOT NULL,
  room text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'timetable' AND policyname = 'Own timetable') THEN
    CREATE POLICY "Own timetable" ON timetable FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_timetable_user_id ON timetable(user_id, day);

-- ── 3. follows table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted')) DEFAULT 'accepted',
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'View own follows') THEN
    CREATE POLICY "View own follows" ON follows FOR SELECT
      USING (follower_id = auth.uid() OR following_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Insert own follow') THEN
    CREATE POLICY "Insert own follow" ON follows FOR INSERT
      WITH CHECK (follower_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Update own follow') THEN
    CREATE POLICY "Update own follow" ON follows FOR UPDATE
      USING (follower_id = auth.uid() OR following_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Delete own follow') THEN
    CREATE POLICY "Delete own follow" ON follows FOR DELETE
      USING (follower_id = auth.uid());
  END IF;
END $$;

-- ── 4. last_message + last_at columns on groups ─────────────
ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_message text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_at timestamptz;

-- ── 5. create_dm RPC ────────────────────────────────────────
-- Returns the group_id (existing or newly created) for a DM between the
-- calling user and other_user_id. Safe to call multiple times (idempotent).
CREATE OR REPLACE FUNCTION create_dm(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  _me uuid := auth.uid();
  _group_id uuid;
BEGIN
  -- Find existing DM between the two users
  SELECT gm1.group_id INTO _group_id
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id
  JOIN groups g ON g.id = gm1.group_id
  WHERE gm1.user_id = _me
    AND gm2.user_id = other_user_id
    AND g.type = 'dm'
  LIMIT 1;

  -- If no existing DM, create one
  IF _group_id IS NULL THEN
    INSERT INTO groups (type, created_by) VALUES ('dm', _me)
    RETURNING id INTO _group_id;

    INSERT INTO group_members (group_id, user_id, role) VALUES
      (_group_id, _me, 'admin'),
      (_group_id, other_user_id, 'member');
  END IF;

  RETURN _group_id;
END;
$$;
