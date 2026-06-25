-- 1. Add theme and disappearing_mode to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS disappearing_mode text;

-- 2. Add nickname to group_members
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS nickname text;

-- 3. Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blocks' AND policyname = 'Users can manage their own blocks'
  ) THEN
    CREATE POLICY "Users can manage their own blocks"
      ON blocks FOR ALL
      USING (blocker_id = auth.uid())
      WITH CHECK (blocker_id = auth.uid());
  END IF;
END
$$;

-- 4. Add is_private to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
